import { TouchableOpacity, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { getCropEmoji } from '@/lib/crops'
import type { CurrentWeather } from '@/lib/weather'

type Props = {
  id:              string
  name:            string
  lat:             number
  lng:             number
  area?:           number | null
  activeCropName?: string
  alertCount?:     number
  weather?:        CurrentWeather | null
}

export const GreenhouseCard = ({
  id, name, lat, lng, area, activeCropName, alertCount = 0, weather,
}: Props) => {
  const router = useRouter()

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3 active:opacity-80"
      onPress={() => router.push(`/greenhouse/${id}`)}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-foreground">🏡 {name}</Text>
        {area ? (
          <Text className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            📐 {area.toLocaleString()} m²
          </Text>
        ) : null}
      </View>

      {/* Location */}
      <Text className="text-xs text-subtle mb-2">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</Text>

      {/* Active crop */}
      {activeCropName ? (
        <Text className="text-sm text-muted mb-3">{getCropEmoji(activeCropName)} {activeCropName}</Text>
      ) : (
        <View className="mb-3" />
      )}

      {/* Weather */}
      {weather ? (
        <View className="flex-row gap-2 pt-3 border-t border-border/50">
          <View className="flex-1 items-center">
            <Text className="text-sm font-semibold text-foreground">
              🌡️ {weather.temperature_2m.toFixed(1)}°C
            </Text>
            <Text className="text-xs text-subtle">Temp.</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-sm font-semibold text-foreground">
              💧 {weather.relative_humidity_2m}%
            </Text>
            <Text className="text-xs text-subtle">Humedad</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-sm font-semibold text-foreground">
              💨 {weather.wind_speed_10m} km/h
            </Text>
            <Text className="text-xs text-subtle">Viento</Text>
          </View>
        </View>
      ) : (
        <Text className="text-xs text-subtle pt-3 border-t border-border/50">
          🌤️ Clima no disponible
        </Text>
      )}

      {/* Alert badge */}
      {alertCount > 0 ? (
        <View className="mt-2 bg-frost rounded-full px-2 py-0.5 self-start">
          <Text className="text-xs text-frost-text">
            ⚠️ {alertCount} alerta{alertCount > 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}
