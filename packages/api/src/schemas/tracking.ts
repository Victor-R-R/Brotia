import { z } from 'zod'

export const createHarvestSchema = z.object({
  kg:          z.number().positive(),
  harvestedAt: z.coerce.date().optional(),
  notes:       z.string().max(500).optional(),
})

export const createPestSchema = z.object({
  pestName:    z.string().min(1).max(100),
  severity:    z.enum(['low', 'medium', 'high']),
  notes:       z.string().max(500).optional(),
  detectedAt:  z.coerce.date().optional(),
})

export type CreateHarvestInput = z.infer<typeof createHarvestSchema>
export type CreatePestInput    = z.infer<typeof createPestSchema>
