import { TouchableOpacity, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { MapPin, Leaf } from 'lucide-react-native'
import { palette } from '@/lib/theme'

type Props = {
  id:              string
  name:            string
  lat:             number
  lng:             number
  area?:           number | null
  activeCropName?: string
  alertCount?:     number
}

export const GreenhouseCard = ({ id, name, lat, lng, area, activeCropName, alertCount = 0 }: Props) => {
  const router = useRouter()

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 mb-3 active:opacity-80"
      onPress={() => router.push(`/greenhouse/${id}`)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-foreground">{name}</Text>
        {area ? (
          <Text className="text-xs text-subtle bg-surface-alt px-2 py-0.5 rounded-full">{area} m²</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1 mb-2">
        <MapPin size={12} color={palette.muted} />
        <Text className="text-xs text-subtle">{lat.toFixed(4)}, {lng.toFixed(4)}</Text>
      </View>

      {activeCropName ? (
        <View className="flex-row items-center gap-1.5">
          <Leaf size={14} color={palette.leafAccent} />
          <Text className="text-sm text-muted">{activeCropName}</Text>
        </View>
      ) : null}

      {alertCount > 0 ? (
        <View className="mt-2 bg-frost rounded-full px-2 py-0.5 self-start">
          <Text className="text-xs text-frost-text">{alertCount} alerta{alertCount > 1 ? 's' : ''}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  )
}
