import { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { api } from '@/lib/api'
import type { CropListItem } from '@/lib/api'
import { getCropEmoji } from '@/lib/crops'
import { palette } from '@/lib/theme'

const STATUS_CONFIG = {
  GROWING:   { label: 'En crecimiento', emoji: '🌱', bg: palette.surfaceAlt, text: palette.primary },
  HARVESTED: { label: 'Cosechado',      emoji: '🌾', bg: '#fef3c7',          text: '#92400e'       },
  FAILED:    { label: 'Fallido',        emoji: '❌', bg: '#fee2e2',          text: palette.danger  },
} as const

const CropsScreen = () => {
  const router = useRouter()
  const [crops,       setCrops]       = useState<CropListItem[]>([])
  const [refreshing,  setRefreshing]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [deletingId,  setDeletingId]  = useState<string | null>(null)

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

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '¿Eliminar cultivo?',
      `"${name}" será eliminado permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            setDeletingId(id)
            try {
              await api.crops.delete(id)
              setCrops(prev => prev.filter(c => c.id !== id))
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el cultivo.')
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

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
            tintColor={palette.primary}
          />
        }
      >
        {error ? (
          <Text className="text-xs text-center py-4" style={{ color: palette.danger }}>{error}</Text>
        ) : null}

        {!loading && crops.length === 0 && !error ? (
          <View className="items-center py-16">
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🌱</Text>
            <Text className="text-base text-muted mb-2">Sin cultivos aún</Text>
            <Text className="text-sm text-center text-subtle">
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
              {/* Header: emoji + name + status badge */}
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-base font-semibold text-foreground flex-1 mr-2" numberOfLines={1}>
                  {getCropEmoji(crop.name)} {crop.name}
                </Text>
                <View className="rounded-full px-2.5 py-0.5 flex-row items-center gap-1" style={{ backgroundColor: st.bg }}>
                  <Text style={{ fontSize: 10 }}>{st.emoji}</Text>
                  <Text className="text-xs font-medium" style={{ color: st.text }}>{st.label}</Text>
                </View>
              </View>

              {/* Variety */}
              {crop.variety ? (
                <Text className="text-xs text-subtle mb-1">🌿 {crop.variety}</Text>
              ) : null}

              {/* Greenhouse */}
              <Text className="text-xs text-subtle mb-0.5">
                🏡 <Text style={{ color: palette.muted }}>{crop.greenhouse.name}</Text>
              </Text>

              {/* Dates */}
              <View className="flex-row items-center gap-1 mt-2 pt-2 border-t border-border">
                <Text className="text-xs text-subtle">
                  {'📅 '}
                  {new Date(crop.plantedAt).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                  {crop.expectedHarvestAt
                    ? ` → ${new Date(crop.expectedHarvestAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} (prev.)`
                    : ''}
                </Text>
              </View>

              {/* Actions */}
              <View className="flex-row gap-2 mt-2 pt-2 border-t border-border">
                <TouchableOpacity
                  className="flex-1 py-1.5 rounded-lg border border-border items-center"
                  onPress={() => handleDelete(crop.id, crop.name)}
                  disabled={deletingId === crop.id}
                >
                  <Text className="text-xs font-medium" style={{ color: palette.danger }}>
                    {deletingId === crop.id ? 'Eliminando…' : '🗑️ Eliminar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        })}

        <View className="h-6" />
      </ScrollView>
    </View>
  )
}

export default CropsScreen
