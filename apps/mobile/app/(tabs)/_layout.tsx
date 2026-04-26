import { Tabs } from 'expo-router'
import { LayoutDashboard, Leaf, Bot, Settings } from 'lucide-react-native'
import { palette } from '@/lib/theme'

const TabsLayout = () => (
  <Tabs
    screenOptions={{
      tabBarActiveTintColor:   palette.primary,
      tabBarInactiveTintColor: palette.muted,
      tabBarStyle: {
        backgroundColor: palette.white,
        borderTopColor:  palette.border,
      },
      headerStyle:     { backgroundColor: palette.white },
      headerTintColor: palette.foreground,
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title:      'Invernaderos',
        tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="crops"
      options={{
        title:      'Cultivos',
        tabBarIcon: ({ color }) => <Leaf size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="chat"
      options={{
        title:      'Brotia IA',
        tabBarIcon: ({ color }) => <Bot size={22} color={color} />,
      }}
    />
    <Tabs.Screen
      name="settings"
      options={{
        title:      'Ajustes',
        tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
      }}
    />
  </Tabs>
)

export default TabsLayout
