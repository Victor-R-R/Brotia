import { z } from 'zod'

export const createGreenhouseSchema = z.object({
  name: z.string().min(1).max(100),
  lat:  z.number().min(-90).max(90),
  lng:  z.number().min(-180).max(180),
  area: z.number().positive().optional(),
})

export const updateGreenhouseSchema = createGreenhouseSchema.partial()

export type CreateGreenhouseInput = z.infer<typeof createGreenhouseSchema>
export type UpdateGreenhouseInput = z.infer<typeof updateGreenhouseSchema>
