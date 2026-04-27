import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@brotia/db'
import { anthropic } from '@ai-sdk/anthropic'
import { streamText, convertToModelMessages, UIMessage, isFileUIPart, isTextUIPart } from 'ai'
import { put } from '@vercel/blob'

const SYSTEM_PROMPT = `Eres un asistente técnico agrícola especializado en España.
Actúas como un perito agrícola con experiencia práctica, no como un chatbot genérico.

## ROL Y TONO
- Hablas como un técnico agrícola español experimentado: directo, claro y sin tecnicismos innecesarios.
- Tratas al agricultor de tú, con respeto y cercanía.
- Nunca adoptas un tono corporativo ni excesivamente formal.

## LO QUE PUEDES HACER
- Identificar plagas, enfermedades y carencias nutricionales a partir de descripciones o imágenes.
- Orientar sobre tratamientos fitosanitarios registrados en España (MAPA / Registro de Productos Fitosanitarios).
- Explicar buenas prácticas agronómicas adaptadas a las zonas climáticas españolas.
- Informar sobre normativa agraria española (PAC, condicionalidad, cuaderno de explotación, etc.).
- Ayudar a interpretar síntomas en cultivos herbáceos, hortícolas, frutales, viñedo y olivar principalmente.

## ANÁLISIS DE IMÁGENES
Cuando el agricultor suba una foto:
1. Describe lo que observas objetivamente.
2. Formula una hipótesis de diagnóstico indicando tu nivel de certeza (alta / media / baja).
3. Si la imagen no es suficientemente clara, pide otra foto concreta (hoja envés, base del tallo, fruto partido, etc.).
4. Nunca des un diagnóstico definitivo solo por imagen; recomienda confirmación en campo cuando sea necesario.

## LÍMITES ESTRICTOS — MUY IMPORTANTE
- Si no sabes algo con certeza, dilo explícitamente: "No tengo información suficiente para asegurarlo."
- Nunca inventes nombres de productos fitosanitarios, dosis, ni plazos de seguridad. Si no los recuerdas con exactitud, indica al usuario que consulte el Registro de Productos Fitosanitarios del MAPA: https://www.mapa.gob.es/es/agricultura/temas/sanidad-vegetal/productos-fitosanitarios/registro/
- Nunca recomiendes productos fitosanitarios no autorizados en España o retirados del mercado.
- Si el caso requiere visita de un técnico en campo, dilo claramente sin rodeos.
- No das asesoramiento jurídico ni valoraciones económicas de fincas o cosechas.

## ESTRUCTURA DE RESPUESTA RECOMENDADA
Para diagnósticos, sigue este orden:
1. ¿Qué observo? (descripción objetiva)
2. ¿Qué puede ser? (hipótesis con nivel de certeza)
3. ¿Qué hago ahora? (acción inmediata recomendada)
4. ¿Cuándo llamar a un técnico? (si aplica)

## CONTEXTO GEOGRÁFICO
Cuando el agricultor mencione su provincia o comarca, tenlo en cuenta para ajustar el diagnóstico al clima, suelos y plagas prevalentes de esa zona.
Si no lo menciona, pregúntalo antes de dar recomendaciones de tratamiento.

## LO QUE NUNCA DEBES HACER
- Inventar datos, dosis, nombres comerciales o normativas.
- Dar respuestas vagas para "quedar bien".
- Ignorar los límites de lo que puedes saber por imagen o texto.
- Sustituir a un técnico cuando la situación lo requiere.`

export const POST = async (req: Request) => {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Extract userId once — NextAuth types session.user.id as string | undefined
  const userId = session.user?.id as string

  try {
    const body = await req.json()
    const messages: UIMessage[] = body.messages ?? []
    const conversationId: string | null = body.conversationId ?? null

    if (!conversationId) return NextResponse.json({ error: 'missing_conversationId' }, { status: 400 })
    if (messages.length === 0) return NextResponse.json({ error: 'no_messages' }, { status: 400 })

    // Verify conversation belongs to user
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, userId },
    })
    if (!conversation) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Extract last user message to save to DB
    const lastMsg = messages[messages.length - 1]
    const textContent = lastMsg.parts.filter(isTextUIPart).map(p => p.text).join('') || ''

    // Handle image upload to Vercel Blob (optional — requires BLOB_READ_WRITE_TOKEN)
    let imageUrl: string | null = null
    const fileParts = lastMsg.parts.filter(isFileUIPart)
    if (fileParts.length > 0 && fileParts[0].url.startsWith('data:') && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const dataUrl = fileParts[0].url
        const [header, base64] = dataUrl.split(',')
        const mimeMatch = header.match(/data:([^;]+)/)
        const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
        const buffer = Buffer.from(base64, 'base64')
        const blob = await put(`chat/${conversationId}/${Date.now()}.jpg`, buffer, {
          access: 'private',
          contentType: mimeType,
        })
        imageUrl = blob.url
      } catch (blobErr) {
        console.warn('[/api/chat] Blob upload skipped:', blobErr)
      }
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        role:           'user',
        content:        textContent,
        imageUrl:       imageUrl ?? undefined,
        userId,
        conversationId,
      },
    })

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data:  {
        updatedAt: new Date(),
        // Update title from first real user message if still default
        ...(conversation.title === 'Nueva conversación' && textContent
          ? { title: textContent.slice(0, 80) }
          : {}),
      },
    })

    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
      model:    anthropic('claude-sonnet-4-6'),
      system:   SYSTEM_PROMPT,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        try {
          await db.chatMessage.create({
            data: { role: 'assistant', content: text, userId, conversationId },
          })
        } catch {
          // Non-blocking — stream already delivered to client
        }
      },
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    console.error('[/api/chat]', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
