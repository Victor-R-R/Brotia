import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import { db } from '@brotia/db'
import { z } from 'zod'

const resend = new Resend(process.env.AUTH_RESEND_KEY!)

const registerSchema = z.object({
  name:            z.string().min(1).max(60),
  lastName:        z.string().min(1).max(60),
  email:           z.string().email(),
  phone:           z.string().max(20).optional(),
  address:         z.string().min(1).max(200),
  password:        z.string().min(8).max(100),
})

export const POST = async (req: Request) => {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { name, lastName, email, phone, address, password } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese email' },
        { status: 409 },
      )
    }

    const hashed = await bcrypt.hash(password, 12)

    await db.user.create({
      data: {
        name,
        lastName,
        email,
        phone:    phone ?? null,
        address,
        password: hashed,
        provider: 'credentials',
      },
    })

    await resend.emails.send({
      from:    'Brotia <brotia@brotia.app>',
      to:      email,
      subject: '¡Bienvenido a Brotia!',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h1 style="font-size:24px;color:#1C2E0F;margin-bottom:8px">¡Hola, ${name}! 👋</h1>
          <p style="color:#4B6838;font-size:16px;line-height:1.6">
            Tu cuenta en <strong>Brotia</strong> ha sido creada exitosamente.
            Ya puedes acceder a tu panel de gestión de invernaderos.
          </p>
          <a href="${process.env.NEXTAUTH_URL ?? 'https://brotia.app'}/login"
             style="display:inline-block;margin-top:24px;background:#2D5A1B;color:#fff;
                    padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Ir al panel
          </a>
          <p style="color:#7A9B6A;font-size:13px;margin-top:32px">
            Si no creaste esta cuenta, puedes ignorar este mensaje.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
