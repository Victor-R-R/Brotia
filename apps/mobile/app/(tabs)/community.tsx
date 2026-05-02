import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Heart, MessageSquare, Plus } from 'lucide-react-native'
import { api, type ThreadSummary } from '@/lib/api'
import { palette } from '@/lib/theme'

const CATEGORIES = [
  { key: '',             label: 'Todos',                  emoji: '' },
  { key: 'PLAGAS',       label: 'Plagas y enfermedades',  emoji: '🐛' },
  { key: 'RIEGO',        label: 'Riego y fertilización',  emoji: '💧' },
  { key: 'CULTIVOS',     label: 'Cultivos',               emoji: '🌱' },
  { key: 'CLIMA',        label: 'Clima y temporadas',     emoji: '🌤️' },
  { key: 'EQUIPAMIENTO', label: 'Equipamiento',           emoji: '🔧' },
  { key: 'GENERAL',      label: 'General',                emoji: '💬' },
]

const formatName = (name: string | null, lastName: string | null) =>
  [name, lastName].filter(Boolean).join(' ') || 'Usuario'

const CommunityScreen = () => {
  const router = useRouter()
  const [threads,    setThreads]    = useState<ThreadSummary[]>([])
  const [category,   setCategory]   = useState('')
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (cat: string) => {
    try {
      const data = await api.community.list(cat || undefined)
      setThreads(data)
    } catch { /* non-blocking */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    load(category).finally(() => setLoading(false))
  }, [category, load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load(category)
    setRefreshing(false)
  }, [category, load])

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ borderBottomWidth: 1, borderBottomColor: palette.border, flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
      >
        {CATEGORIES.map(cat => {
          const isActive = category === cat.key
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: isActive ? palette.primary : palette.surface,
                borderWidth: 1,
                borderColor: isActive ? palette.primary : palette.border,
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '500',
                color: isActive ? '#fff' : palette.subtle,
              }}>
                {cat.emoji ? `${cat.emoji} ${cat.label}` : cat.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={t => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: palette.subtle, fontSize: 14, marginTop: 48 }}>
              No hay publicaciones aún. ¡Sé el primero!
            </Text>
          }
          renderItem={({ item: thread }) => (
            <TouchableOpacity
              onPress={() => router.push(`/community/${thread.id}`)}
              style={{
                backgroundColor: palette.surface,
                borderRadius: 12,
                padding: 14,
                borderWidth: 1,
                borderColor: palette.border,
              }}
            >
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: palette.primary + '22',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: palette.primary }}>
                    {[thread.user.name?.[0], thread.user.lastName?.[0]].filter(Boolean).join('').toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: palette.primary, fontWeight: '500', marginBottom: 2 }}>
                    {thread.category}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: palette.foreground, marginBottom: 2 }}>
                    {thread.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: palette.subtle }} numberOfLines={2}>
                    {thread.contentPreview}
                  </Text>
                  <Text style={{ fontSize: 11, color: palette.subtle, marginTop: 2 }}>
                    {formatName(thread.user.name, thread.user.lastName)}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MessageSquare size={13} color={palette.subtle} />
                      <Text style={{ fontSize: 12, color: palette.subtle }}>{thread._count.replies}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Heart
                        size={13}
                        color={thread.hasLiked ? '#ef4444' : palette.subtle}
                        fill={thread.hasLiked ? '#ef4444' : 'transparent'}
                      />
                      <Text style={{ fontSize: 12, color: palette.subtle }}>{thread._count.likes}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/community/new')}
        style={{
          position: 'absolute', bottom: 90, right: 20,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: palette.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

export default CommunityScreen
