import { useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { useRouter, Stack } from 'expo-router'
import { MapPin, CheckCircle } from 'lucide-react-native'
import { api } from '@/lib/api'
import { palette } from '@/lib/theme'

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

const NewGreenhouseScreen = () => {
  const router = useRouter()
  const [form,       setForm]       = useState({ name: '', lat: '', lng: '', area: '' })
  const [loading,    setLoading]    = useState(false)
  const [catastroRc, setCatastroRc] = useState<string | null>(null)
  const [querying,   setQuerying]   = useState(false)

  const previewCoords = useMemo(() => {
    const lat = parseFloat(form.lat)
    const lng = parseFloat(form.lng)
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    return { lat, lng }
  }, [form.lat, form.lng])

  const lookupCatastro = async (lat: string, lng: string) => {
    setQuerying(true)
    setCatastroRc(null)
    try {
      const res  = await fetch(`${API_URL}/api/catastro?lat=${lat}&lng=${lng}`)
      const data = await res.json()
      if (data.found) {
        setCatastroRc(data.rc ?? null)
        if (data.area) setForm(prev => ({ ...prev, area: String(Math.round(data.area)) }))
      }
    } catch {
      // Non-critical
    } finally {
      setQuerying(false)
    }
  }

  const detectLocation = async () => {
    try {
      const Location = await import('expo-location')
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa la ubicación para detectarla automáticamente')
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      const lat = loc.coords.latitude.toFixed(6)
      const lng = loc.coords.longitude.toFixed(6)
      setForm(prev => ({ ...prev, lat, lng }))
      lookupCatastro(lat, lng)
    } catch {
      Alert.alert('No disponible', 'Introduce las coordenadas manualmente')
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.lat.trim() || !form.lng.trim()) {
      Alert.alert('Campos requeridos', 'Nombre, latitud y longitud son obligatorios')
      return
    }

    const parsedLat = parseFloat(form.lat)
    const parsedLng = parseFloat(form.lng)

    if (isNaN(parsedLat) || parsedLat < -90  || parsedLat > 90  ||
        isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      Alert.alert('Coordenadas inválidas', 'Latitud: −90 a 90, Longitud: −180 a 180')
      return
    }

    if (form.area.trim() !== '') {
      const parsedArea = parseFloat(form.area)
      if (isNaN(parsedArea) || parsedArea <= 0) {
        Alert.alert('Superficie inválida', 'Introduce un número positivo')
        return
      }
    }

    setLoading(true)
    try {
      const gh = await api.greenhouses.create({
        name: form.name,
        lat:  parsedLat,
        lng:  parsedLng,
        area: form.area.trim() ? parseFloat(form.area) : undefined,
      })
      router.replace(`/greenhouse/${gh.id}`)
    } catch {
      Alert.alert('Error', 'No se pudo crear el invernadero. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo invernadero', headerShown: true }} />
      <ScrollView className="flex-1 bg-background px-4 pt-4">

        {[
          { key: 'name', label: 'Nombre',          placeholder: 'Invernadero Norte', numeric: false },
          { key: 'area', label: 'Superficie (m²)',  placeholder: '500',               numeric: true  },
        ].map(field => (
          <View key={field.key} className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">{field.label}</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
              placeholder={field.placeholder}
              placeholderTextColor={palette.muted}
              value={form[field.key as keyof typeof form]}
              onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
              keyboardType={field.numeric ? 'numeric' : 'default'}
            />
          </View>
        ))}

        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Ubicación GPS</Text>

          <TouchableOpacity
            className="bg-surface-alt border border-border rounded-xl px-3 py-3 flex-row items-center gap-2 mb-2"
            onPress={detectLocation}
          >
            <MapPin size={16} color={palette.primary} />
            <Text className="text-sm text-primary font-medium flex-1">Detectar mi ubicación</Text>
            {querying && <ActivityIndicator size="small" color={palette.primary} />}
          </TouchableOpacity>

          {catastroRc ? (
            <View className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2 mb-2">
              <CheckCircle size={13} color={palette.primary} />
              <Text className="text-xs text-muted">Catastro:</Text>
              <Text className="text-xs font-mono text-foreground flex-1" numberOfLines={1}>{catastroRc}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            {(['lat', 'lng'] as const).map(key => (
              <TextInput
                key={key}
                className="flex-1 bg-surface border border-border rounded-xl px-3 py-2.5 text-sm text-foreground"
                placeholder={key === 'lat' ? 'Latitud' : 'Longitud'}
                placeholderTextColor={palette.muted}
                value={form[key]}
                onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
                keyboardType="numbers-and-punctuation"
              />
            ))}
          </View>

          {previewCoords ? (
            <View className="mt-3 rounded-xl overflow-hidden border border-border" style={{ height: 160 }}>
              <MapView
                style={{ width: '100%', height: '100%' }}
                initialRegion={{
                  latitude:      previewCoords.lat,
                  longitude:     previewCoords.lng,
                  latitudeDelta:  0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: previewCoords.lat, longitude: previewCoords.lng }}
                />
              </MapView>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          className={`bg-primary rounded-xl py-3.5 items-center mt-4 mb-8 ${loading ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-sm">
            {loading ? 'Creando...' : 'Crear invernadero'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  )
}

export default NewGreenhouseScreen
