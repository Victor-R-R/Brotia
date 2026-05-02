import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { api } from '../../lib/api'
import type { EstadisticasData } from '../../lib/api'
import { palette } from '@/lib/theme'

const ALERT_LABELS: Record<string, string> = {
  FROST:         'Helada',
  HAIL:          'Granizo',
  STRONG_WIND:   'Viento',
  HIGH_HUMIDITY: 'Humedad',
  RAIN_EXPECTED: 'Lluvia',
}

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <View className="bg-surface border border-border rounded-xl p-4 flex-1">
    <Text className="text-xs text-muted mb-1 font-medium uppercase tracking-wide">{label}</Text>
    <Text className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Outfit' }}>{value}</Text>
    {sub ? <Text className="text-xs text-muted mt-0.5">{sub}</Text> : null}
  </View>
)

const SectionTitle = ({ title }: { title: string }) => (
  <Text className="text-base font-semibold text-foreground mb-3" style={{ fontFamily: 'Outfit' }}>{title}</Text>
)

const EstadisticasScreen = () => {
  const [data,      setData]      = useState<EstadisticasData | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error,     setError]     = useState(false)

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const result = await api.estadisticas.get()
      setData(result)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-foreground text-base text-center mb-2">No se pudieron cargar las estadísticas</Text>
        <Text className="text-muted text-sm text-center">Comprueba tu conexión e inténtalo de nuevo</Text>
      </View>
    )
  }

  const totalAlerts = Object.values(data.alertCounts).reduce((s, n) => s + n, 0)

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={palette.primary} />
      }
    >
      <Text className="font-bold text-2xl text-foreground mb-1" style={{ fontFamily: 'Outfit' }}>
        Estadísticas
      </Text>
      <Text className="text-sm text-muted mb-6">Rendimiento y producción de tus cultivos</Text>

      {/* Overview */}
      <View className="flex-row gap-3 mb-3">
        <StatCard label="Invernaderos" value={String(data.greenhouseCount)} />
        <StatCard label="Plagas detectadas" value={String(data.pestCount)} />
      </View>

      <View className="flex-row gap-3 mb-6">
        <StatCard
          label="Cosecha total"
          value={`${data.harvestTotalKg.toFixed(1)} kg`}
        />
        <StatCard
          label="Últimos 30 días"
          value={`${data.harvestLast30DaysKg.toFixed(1)} kg`}
        />
      </View>

      {/* Crop status */}
      <SectionTitle title="Estado de cultivos" />
      <View className="bg-surface border border-border rounded-xl p-4 mb-6">
        <View className="flex-row justify-between mb-3">
          <View className="items-center flex-1">
            <View className="bg-green-100 rounded-full px-3 py-1 mb-1">
              <Text className="text-green-700 text-xs font-semibold">En cultivo</Text>
            </View>
            <Text className="text-xl font-bold text-foreground" style={{ fontFamily: 'Outfit' }}>
              {data.cropCounts.GROWING}
            </Text>
          </View>
          <View className="items-center flex-1">
            <View className="bg-blue-100 rounded-full px-3 py-1 mb-1">
              <Text className="text-blue-700 text-xs font-semibold">Cosechados</Text>
            </View>
            <Text className="text-xl font-bold text-foreground" style={{ fontFamily: 'Outfit' }}>
              {data.cropCounts.HARVESTED}
            </Text>
          </View>
          <View className="items-center flex-1">
            <View className="bg-red-100 rounded-full px-3 py-1 mb-1">
              <Text className="text-red-700 text-xs font-semibold">Fallidos</Text>
            </View>
            <Text className="text-xl font-bold text-foreground" style={{ fontFamily: 'Outfit' }}>
              {data.cropCounts.FAILED}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {(() => {
          const total = data.cropCounts.GROWING + data.cropCounts.HARVESTED + data.cropCounts.FAILED
          if (total === 0) return null
          const growingPct  = (data.cropCounts.GROWING  / total) * 100
          const harvestedPct = (data.cropCounts.HARVESTED / total) * 100
          const failedPct   = (data.cropCounts.FAILED   / total) * 100
          return (
            <View className="h-2 rounded-full overflow-hidden flex-row">
              <View style={{ width: `${growingPct}%`,   backgroundColor: '#16a34a' }} />
              <View style={{ width: `${harvestedPct}%`, backgroundColor: '#3b82f6' }} />
              <View style={{ width: `${failedPct}%`,    backgroundColor: '#ef4444' }} />
            </View>
          )
        })()}
      </View>

      {/* Alerts */}
      {totalAlerts > 0 && (
        <>
          <SectionTitle title={`Alertas meteorológicas (${totalAlerts})`} />
          <View className="bg-surface border border-border rounded-xl p-4 mb-6 gap-2">
            {Object.entries(data.alertCounts).map(([type, count]) => (
              <View key={type} className="flex-row justify-between items-center">
                <Text className="text-sm text-foreground">{ALERT_LABELS[type] ?? type}</Text>
                <View className="bg-surface-alt rounded-full px-2.5 py-0.5">
                  <Text className="text-xs font-semibold text-muted">{count}</Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Recent harvests */}
      {data.recentHarvests.length > 0 && (
        <>
          <SectionTitle title="Últimas cosechas" />
          <View className="bg-surface border border-border rounded-xl overflow-hidden mb-6">
            {data.recentHarvests.map((h, i) => (
              <View
                key={i}
                className="flex-row justify-between items-center px-4 py-3"
                style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#e5e7eb' }}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{h.cropName}</Text>
                  <Text className="text-xs text-muted" numberOfLines={1}>{h.greenhouseName}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-foreground">{h.kg.toFixed(1)} kg</Text>
                  <Text className="text-xs text-muted">
                    {new Date(h.harvestedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      {data.recentHarvests.length === 0 && data.cropCounts.GROWING === 0 && (
        <View className="items-center py-8">
          <Text className="text-muted text-sm text-center">
            Aún no hay datos. Añade cultivos y registra cosechas para ver tus estadísticas.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

export default EstadisticasScreen
