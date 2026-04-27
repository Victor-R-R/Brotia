import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Leaf, Plus } from 'lucide-react-native'
import { api } from '@/lib/api'
import type { CropListItem } from '@/lib/api'
import { palette } from '@/lib/theme'

const STATUS_CONFIG = {
  GROWING:   { label: 'En crecimiento', bg: '#d1fae5', text: '#065f46' },
  HARVESTED: { label: 'Cosechado',      bg: '#f3f4f6', text: '#6b7280' },
  FAILED:    { label: 'Fallido',        bg: '#fee2e2', text: '#991b1b' },
} as const

const CropsScreen = () => {
  const router = useRouter()
  const [crops,      setCrops]      = useState<CropListItem[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  const fetchCrops = useCallback(async () => {
    setError(null)
    try {
      const data = await api.crops.list()
      setCrops(data)
    } catch {
      setError('No se pudieron cargar los cultivos. Desliza para reintentar.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchCrops() }, [fetchCrops])

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
        <Text className="text-xl font-bold text-foreground">Mis Cultivos</Text>
        <TouchableOpacity
          className="bg-primary rounded-full w-9 h-9 items-center justify-center"
          onPress={() => router.push('/crop/new')}
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchCrops() }}
          />
        }
      >
        {error ? (
          <Text className="text-xs text-center py-4" style={{ color: STATUS_CONFIG.FAILED.text }}>
            {error}
          </Text>
        ) : null}

        {!loading && crops.length === 0 && !error ? (
          <View className="items-center py-16">
            <Leaf size={40} color={palette.muted} style={{ marginBottom: 12 }} />
            <Text className="text-base text-muted mb-2">Sin cultivos aún</Text>
            <Text className="text-sm text-center" style={{ color: palette.muted }}>
              Pulsa + para registrar tu primer cultivo
            </Text>
          </View>
        ) : null}

        {crops.map(crop => {
          const st = STATUS_CONFIG[crop.status]
          return (
            <View
              key={crop.id}
              className="bg-surface border border-border rounded-2xl p-4 mb-3"
            >
              <View className="flex-row items-start justify-between mb-1">
                <View className="flex-row items-center gap-2 flex-1 mr-2">
                  <Leaf size={16} color={palette.primary} />
                  <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
                    {crop.name}
                  </Text>
                </View>
                <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: st.bg }}>
                  <Text className="text-xs font-medium" style={{ color: st.text }}>{st.label}</Text>
                </View>
              </View>

              {crop.variety ? (
                <Text className="text-xs text-subtle mb-1">Variedad: {crop.variety}</Text>
              ) : null}

              <Text className="text-xs text-subtle">
                Invernadero: <Text style={{ color: palette.muted }}>{crop.greenhouse.name}</Text>
              </Text>
              <Text className="text-xs text-subtle mt-0.5">
                Plantado:{' '}
                {new Date(crop.plantedAt).toLocaleDateString('es-ES', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
              {crop.expectedHarvestAt ? (
                <Text className="text-xs text-subtle mt-0.5">
                  Cosecha prevista:{' '}
                  {new Date(crop.expectedHarvestAt).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              ) : null}
            </View>
          )
        })}

        <View className="h-6" />
      </ScrollView>
    </View>
  )
}

export default CropsScreen
