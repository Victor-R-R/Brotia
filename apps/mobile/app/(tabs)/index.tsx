import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { GreenhouseCard } from '@/components/GreenhouseCard'
import { api } from '@/lib/api'
import { fetchWeather } from '@/lib/weather'
import { palette } from '@/lib/theme'
import type { GreenhouseListItem } from '@/lib/api'
import type { CurrentWeather } from '@/lib/weather'


const GreenhousesScreen = () => {
  const router = useRouter()
  const mapRef = useRef<MapView>(null)
  const [greenhouses, setGreenhouses] = useState<GreenhouseListItem[]>([])
  const [weatherMap,  setWeatherMap]  = useState<Record<string, CurrentWeather | null>>({})
  const [refreshing,  setRefreshing]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    try {
      const data = await api.greenhouses.list()
      setGreenhouses(data)

      // Fetch weather for all greenhouses in parallel from Open-Meteo (no auth needed)
      const results = await Promise.allSettled(
        data.map(gh => fetchWeather(gh.lat, gh.lng))
      )
      const map: Record<string, CurrentWeather | null> = {}
      data.forEach((gh, i) => {
        const r = results[i]
        map[gh.id] = r.status === 'fulfilled' ? r.value : null
      })
      setWeatherMap(map)

    } catch {
      setError('No se pudieron cargar los invernaderos. Desliza para reintentar.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const firstGh = greenhouses[0]
  const initialRegion = firstGh ? {
    latitude:      firstGh.lat,
    longitude:     firstGh.lng,
    latitudeDelta:  0.05,
    longitudeDelta: 0.05,
  } : {
    latitude:       36.7, longitude: -3.4,
    latitudeDelta:  1,    longitudeDelta: 1,
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAll() }}
            tintColor={palette.primary}
          />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: palette.foreground }}>
            Mis Invernaderos
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: palette.primary, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.push('/greenhouse/new')}
          >
            <Plus size={18} color="white" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        {!loading && greenhouses.length > 0 ? (
          <View style={{ height: 200, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: palette.border }}>
            <MapView
              ref={mapRef}
              style={{ width: '100%', height: '100%' }}
              initialRegion={initialRegion}
              showsUserLocation={false}
              onMapReady={() => {
                if (greenhouses.length > 1) {
                  mapRef.current?.fitToCoordinates(
                    greenhouses.map(gh => ({ latitude: gh.lat, longitude: gh.lng })),
                    { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false }
                  )
                }
              }}
            >
              {greenhouses.map(gh => (
                <Marker
                  key={gh.id}
                  coordinate={{ latitude: gh.lat, longitude: gh.lng }}
                  title={gh.name}
                  onPress={() => router.push(`/greenhouse/${gh.id}`)}
                />
              ))}
            </MapView>
          </View>
        ) : null}

        {/* Cards */}
        <View style={{ paddingHorizontal: 16 }}>
          {error ? (
            <Text style={{ fontSize: 12, color: palette.danger, textAlign: 'center', paddingVertical: 16 }}>{error}</Text>
          ) : null}

          {!loading && greenhouses.length === 0 && !error ? (
            <View style={{ alignItems: 'center', paddingVertical: 64 }}>
              <Text style={{ fontSize: 16, color: palette.muted, marginBottom: 8 }}>Sin invernaderos aún</Text>
              <Text style={{ fontSize: 14, color: palette.subtle, textAlign: 'center' }}>
                Pulsa + para registrar tu primer invernadero
              </Text>
            </View>
          ) : null}

          {greenhouses.map(gh => (
            <GreenhouseCard
              key={gh.id}
              id={gh.id}
              name={gh.name}
              lat={gh.lat}
              lng={gh.lng}
              area={gh.area}
              activeCropName={gh.crops[0]?.name}
              alertCount={gh.alerts?.length ?? 0}
              weather={weatherMap[gh.id]}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default GreenhousesScreen
