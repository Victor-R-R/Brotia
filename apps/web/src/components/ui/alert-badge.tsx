type AlertType = 'FROST' | 'HAIL' | 'STRONG_WIND' | 'HIGH_HUMIDITY' | 'RAIN_EXPECTED'

type AlertBadgeProps = {
  type: AlertType
  message: string
}

const alertConfig: Record<AlertType, { label: string; classes: string }> = {
  FROST:         { label: 'Helada',   classes: 'bg-frost text-frost-text' },
  HAIL:          { label: 'Granizo',  classes: 'bg-hail text-hail-text' },
  STRONG_WIND:   { label: 'Viento',   classes: 'bg-wind text-wind-text' },
  HIGH_HUMIDITY: { label: 'Humedad',  classes: 'bg-wind text-wind-text' },
  RAIN_EXPECTED: { label: 'Lluvia',   classes: 'bg-frost text-frost-text' },
}

export const AlertBadge = ({ type, message }: AlertBadgeProps) => {
  const { label, classes } = alertConfig[type]
  return (
    <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${classes}`}>
      <span className="font-semibold">{label}</span>
      <span>{message}</span>
    </div>
  )
}
