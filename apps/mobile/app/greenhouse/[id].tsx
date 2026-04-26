import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, Stack } from 'expo-router'
import { Thermometer, Droplets, Wind } from 'lucide-react-native'
import { api } from '@/lib/api'
import type { WeatherData } from '@/lib/api'
import { palette } from '@/lib/theme'

const GreenhouseDetailScreen = () => {
  const { id }              = useLocalSearchParams<{ id: string }>()
  const safeId              = Array.isArray(id) ? id[0] : id
  const [data,    setData]    = useState<WeatherData | null>(null)
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    const load = async () => {
      setData(null)
      setName('')
      setError(false)
      setLoading(true)
      try {
        const [gh, weatherData] = await Promise.all([
          api.greenhouses.get(safeId),
          api.greenhouses.weather(safeId),
        ])
        setName(gh.name)
        setData(weatherData)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [safeId])

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  if (error) return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-base text-muted text-center">No se pudo cargar el invernadero.</Text>
    </View>
  )

  return (
    <>
      <Stack.Screen options={{ title: name, headerShown: true }} />
      <ScrollView className="flex-1 bg-background px-4 pt-4">
        {data?.alerts.map((alert, i) => (
          <View key={i} className="bg-frost rounded-full px-3 py-1 mb-2 self-start">
            <Text className="text-frost-text text-xs">{alert.message}</Text>
          </View>
        ))}

        <Text className="text-sm text-muted uppercase tracking-wider mb-3">Clima actual</Text>

        <View className="flex-row gap-3 mb-6">
          {[
            { icon: Thermometer, value: `${data?.weather.current.temperature_2m.toFixed(1)}°C`, label: 'Temp.' },
            { icon: Droplets,    value: `${data?.weather.current.relative_humidity_2m}%`,         label: 'Humedad' },
            { icon: Wind,        value: `${data?.weather.current.wind_speed_10m} km/h`,           label: 'Viento' },
          ].map(({ icon: Icon, value, label }) => (
            <View key={label} className="flex-1 bg-surface-alt rounded-2xl p-3 items-center gap-1">
              <Icon size={16} color={palette.icon} />
              <Text className="text-sm font-semibold text-foreground">{value}</Text>
              <Text className="text-xs text-subtle">{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  )
}

export default GreenhouseDetailScreen
