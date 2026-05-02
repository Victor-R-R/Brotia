import { useEffect, useState } from 'react'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { palette } from '@/lib/theme'
import { api } from '@/lib/api'

const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={{ fontSize: 20, lineHeight: 24 }}>{emoji}</Text>
)

const TabsLayout = () => {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    api.user.get()
      .then(u => setIsAdmin(u.role === 'SUPERADMIN'))
      .catch(() => {})
  }, [])

  return (
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
  )
}

export default TabsLayout
