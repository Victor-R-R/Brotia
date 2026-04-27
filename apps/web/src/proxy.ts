import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse, type NextRequest } from "next/server"

const UPSTASH_CONFIGURED =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN

const ratelimits = UPSTASH_CONFIGURED
  ? {
      // 5 registrations per IP per hour
      register: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        prefix: "rl:register",
      }),
      // 20 AI messages per IP per minute
      chat: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(20, "1 m"),
        prefix: "rl:chat",
      }),
      // 10 login attempts per IP per 15 minutes
      login: new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "15 m"),
        prefix: "rl:login",
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

  const { success, limit, remaining, reset } = await limiter.limit(ip)

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
