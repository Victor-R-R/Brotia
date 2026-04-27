import { z } from 'zod'

export const createCropSchema = z.object({
  name:              z.string().min(1).max(100),
  variety:           z.string().max(100).optional(),
  plantedAt:         z.coerce.date(),
  expectedHarvestAt: z.coerce.date().optional(),
  greenhouseId:      z.string().min(1),
})

export const updateCropSchema = z.object({
  name:              z.string().min(1).max(100).optional(),
  variety:           z.string().max(100).optional(),
  status:            z.enum(['GROWING', 'HARVESTED', 'FAILED']).optional(),
  expectedHarvestAt: z.coerce.date().optional().nullable(),
})

export type CreateCropInput = z.infer<typeof createCropSchema>
export type UpdateCropInput = z.infer<typeof updateCropSchema>
