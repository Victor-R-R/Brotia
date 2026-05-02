import { useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import MapView, { Marker, UrlTile } from 'react-native-maps'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import { Thermometer, Droplets, Wind } from 'lucide-react-native'
import { api } from '@/lib/api'
import type { WeatherData } from '@/lib/api'
import { palette } from '@/lib/theme'

type Coords = { lat: number; lng: number }

const GreenhouseDetailScreen = () => {
  const { id }              = useLocalSearchParams<{ id: string }>()
  const safeId              = Array.isArray(id) ? id[0] : id
  const router              = useRouter()
  const [data,      setData]      = useState<WeatherData | null>(null)
  const [name,      setName]      = useState('')
  const [coords,    setCoords]    = useState<Coords | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  useEffect(() => {
    const load = async () => {
      setData(null)
      setName('')
      setCoords(null)
      setError(false)
      setLoading(true)
      try {
        const [gh, weatherData] = await Promise.all([
          api.greenhouses.get(safeId),
          api.greenhouses.weather(safeId),
        ])
        setName(gh.name)
        setCoords({ lat: gh.lat, lng: gh.lng })
        setData(weatherData)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [safeId])

  const handleDelete = () => {
    Alert.alert(
      '¿Eliminar invernadero?',
      `"${name}" y todos sus datos serán eliminados permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            try {
              await api.greenhouses.delete(safeId)
              router.replace('/')
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el invernadero.')
              setDeleting(false)
            }
          },
        },
      ]
    )
  }

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
      <Stack.Screen options={{ title: name, headerShown: true, headerBackTitle: '' }} />
      <ScrollView className="flex-1 bg-background">

        {/* Map */}
        {coords ? (
          <MapView
            style={{ width: '100%', height: 180 }}
            mapType="none"
            initialRegion={{
              latitude:      coords.lat,
              longitude:     coords.lng,
              latitudeDelta:  0.004,
              longitudeDelta: 0.004,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <UrlTile
              urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
              maximumZ={19}
              flipY={false}
              tileSize={256}
            />
            <Marker
              coordinate={{ latitude: coords.lat, longitude: coords.lng }}
              title={name}
              tracksViewChanges={false}
            >
              <View style={styles.markerDot} />
            </Marker>
          </MapView>
        ) : null}

        <View className="px-4 pt-4">
          {/* Alerts */}
          {data?.alerts.map((alert, i) => (
            <View key={i} className="bg-frost rounded-full px-3 py-1 mb-2 self-start">
              <Text className="text-frost-text text-xs">{alert.message}</Text>
            </View>
          ))}

          {/* Weather */}
          <Text className="text-sm text-muted uppercase tracking-wider mb-3">Clima actual</Text>

          <View className="flex-row gap-3 mb-6">
            {[
              { icon: Thermometer, value: `${data?.weather.current.temperature_2m.toFixed(1)}°C`, label: 'Temp.' },
              { icon: Droplets,    value: `${data?.weather.current.relative_humidity_2m}%`,        label: 'Humedad' },
              { icon: Wind,        value: `${data?.weather.current.wind_speed_10m} km/h`,          label: 'Viento' },
            ].map(({ icon: Icon, value, label }) => (
              <View key={label} className="flex-1 bg-surface-alt rounded-2xl p-3 items-center gap-1">
                <Icon size={16} color={palette.icon} />
                <Text className="text-sm font-semibold text-foreground">{value}</Text>
                <Text className="text-xs text-subtle">{label}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl border border-border items-center"
              onPress={() => router.push(`/greenhouse/${safeId}/edit`)}
            >
              <Text className="text-sm font-medium text-foreground">✏️ Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl border items-center"
              style={{ borderColor: palette.danger }}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Text className="text-sm font-medium" style={{ color: palette.danger }}>
                {deleting ? 'Eliminando…' : '🗑️ Eliminar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
})

export default GreenhouseDetailScreen
