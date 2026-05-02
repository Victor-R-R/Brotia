import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { saveAuth } from '@/lib/auth-storage'
import { palette } from '@/lib/theme'

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

const inputStyle = {
  backgroundColor: palette.background,
  borderWidth: 1,
  borderColor: palette.border,
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 14,
  color: palette.foreground,
}

const LoginScreen = () => {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      // Build the redirect URI for this environment (Expo Go or standalone)
      const redirectUri = Linking.createURL('auth-callback')
      const authUrl     = `${API_BASE}/mobile-auth?redirect_uri=${encodeURIComponent(redirectUri)}`

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)
      if (result.type !== 'success') return

      // Extract the one-time code from the deep-link URL
      const parsed = Linking.parse(result.url)
      const code   = parsed.queryParams?.code as string | undefined
      if (!code) throw new Error('no_code')

      // Exchange the code for a JWT
      const res = await fetch(`${API_BASE}/api/auth/mobile-code?action=redeem`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      })
      if (!res.ok) throw new Error('redeem_failed')
      const { token, user } = await res.json()
      await saveAuth(token, user)
      router.replace('/(tabs)/')
    } catch {
      Alert.alert('Error', 'No se pudo conectar con Google. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async () => {
    const e = email.trim()
    const p = password.trim()
    if (!e || !p) { Alert.alert('Campos requeridos', 'Introduce tu email y contraseña.'); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/mobile-login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: e, password: p }),
      })
      if (res.status === 401) { Alert.alert('Credenciales incorrectas', 'Email o contraseña incorrectos.'); return }
      if (!res.ok) throw new Error()
      const { token, user } = await res.json()
      await saveAuth(token, user)
      router.replace('/(tabs)/')
    } catch {
      Alert.alert('Error', 'No se pudo conectar. Comprueba tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: palette.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>🌱</Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: palette.foreground, letterSpacing: -0.5 }}>
            Brotia
          </Text>
          <Text style={{ fontSize: 14, color: palette.subtle, marginTop: 4 }}>
            Gestión inteligente de invernaderos
          </Text>
        </View>

        {/* Google button */}
        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loading}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border,
            borderRadius: 10, paddingVertical: 14, marginBottom: 20,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ fontSize: 16 }}>G</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: palette.foreground }}>
            Continuar con Google
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
          <Text style={{ fontSize: 12, color: palette.subtle }}>o inicia con email</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.border }} />
        </View>

        {/* Email / password form */}
        <View style={{
          backgroundColor: palette.surface, borderRadius: 16,
          padding: 20, borderWidth: 1, borderColor: palette.border, gap: 16,
        }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: palette.muted }}>Email</Text>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="tu@email.com" placeholderTextColor={palette.subtle}
              autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress"
              style={inputStyle}
            />
          </View>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: palette.muted }}>Contraseña</Text>
            <TextInput
              value={password} onChangeText={setPassword}
              placeholder="••••••••" placeholderTextColor={palette.subtle}
              secureTextEntry textContentType="password"
              style={inputStyle}
            />
          </View>
          <TouchableOpacity
            onPress={handlePasswordLogin} disabled={loading}
            style={{ backgroundColor: palette.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Iniciar sesión</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={{ textAlign: 'center', color: palette.subtle, fontSize: 12, marginTop: 24 }}>
          ¿Sin cuenta? Regístrate en brotia.app desde tu navegador.
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}

export default LoginScreen
