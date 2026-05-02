import { useCallback, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { api } from '@/lib/api'
import type { AdminUser } from '@/lib/api'
import { palette } from '@/lib/theme'

const AdminScreen = () => {
  const [users,      setUsers]      = useState<AdminUser[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.admin.users.list()
      setUsers(data)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los usuarios.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { fetchUsers() }, [fetchUsers]))

  const handleRoleToggle = (user: AdminUser) => {
    const next = user.role === 'SUPERADMIN' ? 'USER' : 'SUPERADMIN'
    Alert.alert(
      'Cambiar rol',
      `¿Cambiar a ${user.email} a ${next}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await api.admin.users.setRole(user.id, next)
              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: next } : u))
            } catch {
              Alert.alert('Error', 'No se pudo cambiar el rol.')
            }
          },
        },
      ],
    )
  }

  const handleDelete = (user: AdminUser) => {
    Alert.alert(
      '¿Eliminar usuario?',
      `"${user.email}" será eliminado permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await api.admin.users.delete(user.id)
              setUsers(prev => prev.filter(u => u.id !== user.id))
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el usuario.')
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers() }} tintColor={palette.primary} />
      }
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: palette.foreground, marginBottom: 4 }}>
        🛡️ Admin
      </Text>
      <Text style={{ fontSize: 13, color: palette.muted, marginBottom: 16 }}>
        {users.length} usuarios registrados
      </Text>

      {users.map(u => {
        const fullName = [u.name, u.lastName].filter(Boolean).join(' ') || '—'
        const isSuperadmin = u.role === 'SUPERADMIN'
        return (
          <View
            key={u.id}
            style={{
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: 12,
              padding: 12,
              marginBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: palette.foreground }}>{fullName}</Text>
                <Text style={{ fontSize: 12, color: palette.muted }}>{u.email}</Text>
              </View>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
                backgroundColor: isSuperadmin ? palette.surfaceAlt : palette.border,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: isSuperadmin ? palette.primary : palette.muted }}>
                  {isSuperadmin ? '🛡️ Admin' : 'Usuario'}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 11, color: palette.subtle, marginBottom: 10 }}>
              🏡 {u._count.greenhouses} inv. · {u.provider ?? 'email'} · {new Date(u.createdAt).toLocaleDateString('es-ES')}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 7, borderRadius: 8,
                  borderWidth: 1, borderColor: palette.border, alignItems: 'center',
                }}
                onPress={() => handleRoleToggle(u)}
              >
                <Text style={{ fontSize: 12, color: palette.foreground }}>
                  {isSuperadmin ? '↓ Quitar admin' : '↑ Hacer admin'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 7, borderRadius: 8,
                  borderWidth: 1, borderColor: palette.danger, alignItems: 'center',
                }}
                onPress={() => handleDelete(u)}
              >
                <Text style={{ fontSize: 12, color: palette.danger }}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

export default AdminScreen
