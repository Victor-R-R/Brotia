import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse, type NextRequest } from "next/server"

// Upstash fails open internally after this delay when Redis is unresponsive.
// Its default is 5000ms, which is far too long to sit in front of a login.
const FAIL_OPEN_TIMEOUT_MS = 1500

const UPSTASH_CONFIGURED =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

const ratelimits = UPSTASH_CONFIGURED
  ? {
      // 5 registrations per IP per hour
      register: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "rl:register",
        timeout: FAIL_OPEN_TIMEOUT_MS,
      }),
      // 20 AI messages per IP per minute
      chat: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "rl:chat",
        timeout: FAIL_OPEN_TIMEOUT_MS,
      }),
      // 10 login attempts per IP per 15 minutes
      login: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "15 m"),
        prefix: "rl:login",
        timeout: FAIL_OPEN_TIMEOUT_MS,
      }),
    }
  : null

const getIp = (req: NextRequest): string => {
  // x-real-ip and req.ip are set by Vercel from the actual TCP connection IP.
  // X-Forwarded-For is attacker-controllable and must NOT be used for rate limiting keys.
  return (
    req.headers.get("x-real-ip") ??
    (req as NextRequest & { ip?: string }).ip ??
    "127.0.0.1"
  )
}

export const proxy = async (req: NextRequest) => {
  if (!ratelimits) return NextResponse.next()

  const { pathname } = req.nextUrl
  const ip = getIp(req)

  let limiter: Ratelimit | null = null

  if (pathname === "/api/auth/register") {
    limiter = ratelimits.register
  } else if (pathname === "/api/chat") {
    limiter = ratelimits.chat
  } else if (pathname.startsWith("/api/auth/")) {
    limiter = ratelimits.login
  }

  if (!limiter) return NextResponse.next()

  let result: Awaited<ReturnType<Ratelimit["limit"]>>

  try {
    result = await limiter.limit(ip)
  } catch (error) {
    // Rate limiting is a protection layer, not a gate. If the Redis backend is
    // unreachable, failing closed would take auth and chat down with it — a
    // dependency outage must not become an application outage. Fail open, loudly.
    console.error("[proxy] rate limit backend unreachable, failing open:", error)
    return NextResponse.next()
  }

  // Upstash fails open internally and returns success:true with reason "timeout"
  // when Redis is unresponsive — nothing was counted. Emitting X-RateLimit-*
  // headers here would advertise a quota no one is enforcing, so treat it
  // exactly like the catch above: pass through, report nothing, log it.
  if (result.reason === "timeout") {
    console.error("[proxy] rate limit timed out, request passed unchecked:", pathname)
    return NextResponse.next()
  }

  const { success, limit, remaining, reset } = result

  if (!success) {
    return NextResponse.json(
      { error: "demasiadas_solicitudes" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  const res = NextResponse.next()
  res.headers.set("X-RateLimit-Limit", limit.toString())
  res.headers.set("X-RateLimit-Remaining", remaining.toString())
  return res
}

export const config = {
  matcher: ["/api/auth/register", "/api/chat", "/api/auth/:path*"],
}
