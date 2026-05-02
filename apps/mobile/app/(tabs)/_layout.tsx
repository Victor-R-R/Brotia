import { useCallback, useEffect, useState } from 'react'
import { Tabs } from 'expo-router'
import { View, Text, TouchableOpacity, AppState } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { palette } from '@/lib/theme'
import { api } from '@/lib/api'
import { getImpersonatedUser, clearImpersonation, type StoredUser } from '@/lib/auth-storage'
import { onImpersonationChange, notifyImpersonationChange } from '@/lib/impersonation-events'

const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={{ fontSize: 20, lineHeight: 24 }}>{emoji}</Text>
)

const TabsLayout = () => {
  const insets = useSafeAreaInsets()
  const [isAdmin,      setIsAdmin]      = useState(false)
  const [impersonated, setImpersonated] = useState<StoredUser | null>(null)

  const refreshState = useCallback(async () => {
    const [user, imp] = await Promise.all([
      api.user.get().catch(() => null),
      getImpersonatedUser(),
    ])
    setIsAdmin(user?.role === 'SUPERADMIN')
    setImpersonated(imp)
  }, [])

  useEffect(() => {
    refreshState()
    const sub  = AppState.addEventListener('change', s => { if (s === 'active') refreshState() })
    const unsub = onImpersonationChange(refreshState)
    return () => { sub.remove(); unsub() }
  }, [refreshState])

  const exitImpersonation = async () => {
    await clearImpersonation()
    setImpersonated(null)
    notifyImpersonationChange()
  }

  return (
    <View style={{ flex: 1 }}>
      {impersonated ? (
        <View style={{
          backgroundColor: '#FBBF24',
          paddingTop: insets.top + 6,
          paddingBottom: 6,
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#78350F', flex: 1 }} numberOfLines={1}>
            🎭 Impersonando: {impersonated.name ?? impersonated.email}
          </Text>
          <TouchableOpacity
            onPress={exitImpersonation}
            style={{
              backgroundColor: '#92400E',
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginLeft: 8,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>Salir</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Tabs
        screenOptions={{
          tabBarActiveTintColor:   palette.primary,
          tabBarInactiveTintColor: palette.subtle,
          tabBarStyle: {
            backgroundColor: palette.surface,
            borderTopColor:  palette.border,
          },
          headerStyle:     { backgroundColor: palette.surface },
          headerTintColor: palette.foreground,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title:      'Inicio',
            tabBarIcon: () => <TabIcon emoji="🏡" />,
          }}
        />
        <Tabs.Screen
          name="crops"
          options={{
            title:      'Cultivos',
            tabBarIcon: () => <TabIcon emoji="🌱" />,
          }}
        />
        <Tabs.Screen
          name="estadisticas"
          options={{
            title:      'Estadísticas',
            tabBarIcon: () => <TabIcon emoji="📊" />,
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title:      'Comunidad',
            tabBarIcon: () => <TabIcon emoji="🤝" />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title:      'IA',
            tabBarIcon: () => <TabIcon emoji="🤖" />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title:      'Cuenta',
            tabBarIcon: () => <TabIcon emoji="👤" />,
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title:      'Admin',
            tabBarIcon: () => <TabIcon emoji="🛡️" />,
            href:       isAdmin ? '/admin' : null,
          }}
        />
      </Tabs>
    </View>
  )
}

export default TabsLayout
