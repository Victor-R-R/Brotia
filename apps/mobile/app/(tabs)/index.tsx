import { useCallback, useRef, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native'
import MapView, { Marker, UrlTile } from 'react-native-maps'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { Plus } from 'lucide-react-native'
import { GreenhouseCard } from '@/components/GreenhouseCard'
import { api } from '@/lib/api'
import { fetchWeather } from '@/lib/weather'
import { palette } from '@/lib/theme'
import type { GreenhouseListItem } from '@/lib/api'
import type { CurrentWeather } from '@/lib/weather'


const GreenhousesScreen = () => {
  const router = useRouter()
  const mapRef          = useRef<MapView>(null)
  const greenhousesRef  = useRef<GreenhouseListItem[]>([])
  const [greenhouses, setGreenhouses] = useState<GreenhouseListItem[]>([])
  const [weatherMap,  setWeatherMap]  = useState<Record<string, CurrentWeather | null>>({})
  const [refreshing,  setRefreshing]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setError(null)
    try {
      const data = await api.greenhouses.list()
      greenhousesRef.current = data
      setGreenhouses(data)

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

  useFocusEffect(useCallback(() => { fetchAll() }, [fetchAll]))

  const fitMap = useCallback(() => {
    const data = greenhousesRef.current
    if (!mapRef.current || data.length === 0) return
    const DELTA = 0.004
    const coords = data.length === 1
      ? [
          { latitude: data[0].lat - DELTA, longitude: data[0].lng - DELTA },
          { latitude: data[0].lat + DELTA, longitude: data[0].lng + DELTA },
        ]
      : data.map(gh => ({ latitude: gh.lat, longitude: gh.lng }))
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
      animated: false,
    })
  }, [])

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
              key={greenhouses.map(g => g.id).join(',')}
              ref={mapRef}
              mapType="none"
              style={{ width: '100%', height: '100%' }}
              onMapReady={fitMap}
            >
              <UrlTile
                urlTemplate="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
                maximumZ={19}
                flipY={false}
                tileSize={256}
              />
              {greenhouses.map(gh => (
                <Marker
                  key={gh.id}
                  coordinate={{ latitude: gh.lat, longitude: gh.lng }}
                  title={gh.name}
                  tracksViewChanges={false}
                  onPress={() => router.push(`/greenhouse/${gh.id}`)}
                >
                  <View style={styles.markerDot} />
                </Marker>
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

const styles = StyleSheet.create({
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.primary,
    borderWidth: 2,
    borderColor: palette.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
})

export default GreenhousesScreen
