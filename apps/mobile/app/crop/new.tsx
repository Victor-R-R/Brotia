import { useCallback, useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { api } from '@/lib/api'
import type { GreenhouseListItem } from '@/lib/api'
import { palette } from '@/lib/theme'

const NewCropScreen = () => {
  const router = useRouter()
  const [form,        setForm]        = useState({ name: '', variety: '', plantedAt: '', expectedHarvestAt: '' })
  const [greenhouses, setGreenhouses] = useState<Pick<GreenhouseListItem, 'id' | 'name'>[]>([])
  const [selectedGh,  setSelectedGh]  = useState<string>('')
  const [loading,     setLoading]     = useState(false)

  const loadGreenhouses = useCallback(async () => {
    try {
      const data = await api.greenhouses.list()
      setGreenhouses(data)
      if (data.length > 0) setSelectedGh(data[0].id)
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los invernaderos')
    }
  }, [])

  useEffect(() => { loadGreenhouses() }, [loadGreenhouses])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert('Campo requerido', 'El nombre del cultivo es obligatorio')
      return
    }
    if (!form.plantedAt.trim()) {
      Alert.alert('Campo requerido', 'La fecha de plantación es obligatoria (AAAA-MM-DD)')
      return
    }
    if (!selectedGh) {
      Alert.alert('Campo requerido', 'Selecciona un invernadero')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.plantedAt)) {
      Alert.alert('Formato inválido', 'Usa el formato AAAA-MM-DD para la fecha')
      return
    }

    setLoading(true)
    try {
      await api.crops.create({
        name:         form.name.trim(),
        variety:      form.variety.trim() || undefined,
        plantedAt:    new Date(form.plantedAt).toISOString(),
        expectedHarvestAt: form.expectedHarvestAt.trim()
          ? new Date(form.expectedHarvestAt).toISOString()
          : undefined,
        greenhouseId: selectedGh,
      })
      router.back()
    } catch {
      Alert.alert('Error', 'No se pudo crear el cultivo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo cultivo', headerShown: true }} />
      <ScrollView className="flex-1 bg-background px-4 pt-4">

        {[
          { key: 'name',     label: 'Nombre del cultivo', placeholder: 'Tomates cherry', required: true  },
          { key: 'variety',  label: 'Variedad (opcional)', placeholder: 'Roma',           required: false },
          { key: 'plantedAt',
            label: 'Fecha de plantación (AAAA-MM-DD)',
            placeholder: '2026-04-27',
            required: true },
          { key: 'expectedHarvestAt',
            label: 'Cosecha prevista (opcional, AAAA-MM-DD)',
            placeholder: '2026-07-15',
            required: false },
        ].map(field => (
          <View key={field.key} className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">{field.label}</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
              placeholder={field.placeholder}
              placeholderTextColor={palette.muted}
              value={form[field.key as keyof typeof form]}
              onChangeText={v => setForm(prev => ({ ...prev, [field.key]: v }))}
              keyboardType={field.key.includes('At') ? 'numbers-and-punctuation' : 'default'}
            />
          </View>
        ))}

        {greenhouses.length > 0 ? (
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Invernadero</Text>
            {greenhouses.map(gh => (
              <TouchableOpacity
                key={gh.id}
                onPress={() => setSelectedGh(gh.id)}
                className="flex-row items-center gap-3 py-2.5 px-3 rounded-xl mb-1.5 border"
                style={{
                  backgroundColor: selectedGh === gh.id ? '#f0fdf4' : undefined,
                  borderColor:     selectedGh === gh.id ? palette.primary : palette.border,
                }}
              >
                <View
                  className="w-4 h-4 rounded-full border-2 items-center justify-center"
                  style={{ borderColor: selectedGh === gh.id ? palette.primary : palette.border }}
                >
                  {selectedGh === gh.id ? (
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.primary }} />
                  ) : null}
                </View>
                <Text className="text-sm text-foreground">{gh.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          className={`bg-primary rounded-xl py-3.5 items-center mt-2 mb-8 ${loading ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-sm">
            {loading ? 'Creando...' : 'Crear cultivo'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  )
}

export default NewCropScreen
