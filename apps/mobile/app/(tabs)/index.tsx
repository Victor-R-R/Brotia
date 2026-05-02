import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { GreenhouseCard } from '@/components/GreenhouseCard'
import { api } from '@/lib/api'
import type { GreenhouseListItem } from '@/lib/api'

const GreenhousesScreen = () => {
  const router = useRouter()
  const [greenhouses, setGreenhouses] = useState<GreenhouseListItem[]>([])
  const [refreshing,  setRefreshing]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const fetchGreenhouses = useCallback(async () => {
    setError(null)
    try {
      const data = await api.greenhouses.list()
      setGreenhouses(data)
    } catch {
      setError('No se pudieron cargar los invernaderos. Desliza para reintentar.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchGreenhouses() }, [fetchGreenhouses])

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-foreground">Mis Invernaderos</Text>
        <TouchableOpacity
          className="bg-primary rounded-full w-9 h-9 items-center justify-center"
          onPress={() => router.push('/greenhouse/new')}
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchGreenhouses() }}
          />
        }
      >
        {error ? (
          <Text className="text-xs text-danger-text text-center py-4">{error}</Text>
        ) : null}
        {!loading && greenhouses.length === 0 && !error ? (
          <View className="items-center py-16">
            <Text className="text-base text-muted mb-2">Sin invernaderos aún</Text>
            <Text className="text-sm text-subtle text-center">Pulsa + para registrar tu primer invernadero</Text>
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
          />
        ))}
      </ScrollView>
    </View>
  )
}

export default GreenhousesScreen
