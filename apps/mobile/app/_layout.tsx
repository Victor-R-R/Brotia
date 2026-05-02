import { useEffect, useState } from 'react'
import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { getToken } from '@/lib/auth-storage'

const RootLayout = () => {
  const router    = useRouter()
  const segments  = useSegments()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    getToken().then(token => {
      const inTabs  = segments[0] === '(tabs)'
      const inLogin = segments[0] === 'login'

      if (!token && !inLogin) {
        router.replace('/login')
      } else if (token && inLogin) {
        router.replace('/(tabs)/')
      }
      setChecked(true)
    })
  }, [segments, router])

  if (!checked) return null

  return <Stack screenOptions={{ headerShown: false, headerBackButtonDisplayMode: 'minimal' }} />
}

export default RootLayout
