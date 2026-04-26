import { z } from 'zod'

export const weatherResponseSchema = z.object({
  current: z.object({
    temperature_2m:       z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m:       z.number(),
    precipitation:        z.number(),
  }),
  hourly: z.object({
    time:                      z.array(z.string()),
    temperature_2m:            z.array(z.number()),
    precipitation_probability: z.array(z.number()),
    showers_sum:               z.array(z.number()).optional(),
  }),
})

export type WeatherResponse = z.infer<typeof weatherResponseSchema>

export const alertTypeSchema = z.enum(['FROST', 'HAIL', 'STRONG_WIND', 'HIGH_HUMIDITY', 'RAIN_EXPECTED'])
export const alertSeveritySchema = z.enum(['low', 'medium', 'high'])

export const alertCheckResultSchema = z.object({
  type:     alertTypeSchema,
  message:  z.string(),
  severity: alertSeveritySchema,
})

export type AlertCheckResult = z.infer<typeof alertCheckResultSchema>
