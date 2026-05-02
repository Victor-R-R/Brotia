import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Modal, FlatList, SafeAreaView, Pressable,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { api } from '@/lib/api'
import type { GreenhouseListItem } from '@/lib/api'
import { palette } from '@/lib/theme'
import { CROP_EMOJI, CROP_NAMES, getCropEmoji, matchesCropSearch } from '@/lib/crops'

type GhOption = Pick<GreenhouseListItem, 'id' | 'name'>
type CropItem  = { name: string; emoji: string } | { name: '__otro'; emoji: string }

const ALL_ITEMS: CropItem[] = [
  ...CROP_NAMES.map(name => ({ name, emoji: CROP_EMOJI[name] ?? '🌱' })),
  { name: '__otro', emoji: '✏️' },
]

const NewCropScreen = () => {
  const router = useRouter()
  const [selectedCrop,      setSelectedCrop]      = useState('')
  const [customName,        setCustomName]        = useState('')
  const [pickerOpen,        setPickerOpen]        = useState(false)
  const [search,            setSearch]            = useState('')
  const [variety,           setVariety]           = useState('')
  const [plantedAt,         setPlantedAt]         = useState('')
  const [expectedHarvestAt, setExpectedHarvestAt] = useState('')
  const [greenhouses,       setGreenhouses]       = useState<GhOption[]>([])
  const [selectedGh,        setSelectedGh]        = useState('')
  const [loading,           setLoading]           = useState(false)

  const cropName = selectedCrop === '__otro' ? customName : selectedCrop

  const filtered = ALL_ITEMS.filter(item =>
    item.name === '__otro' || matchesCropSearch(item.name, search)
  )

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

  const selectCrop = (name: string) => {
    setSelectedCrop(name)
    setPickerOpen(false)
    setSearch('')
    if (name !== '__otro') setCustomName('')
  }

  const handleSubmit = async () => {
    if (!cropName.trim()) {
      Alert.alert('Campo requerido', 'Selecciona o escribe el nombre del cultivo')
      return
    }
    if (!plantedAt.trim()) {
      Alert.alert('Campo requerido', 'La fecha de plantación es obligatoria (AAAA-MM-DD)')
      return
    }
    if (!selectedGh) {
      Alert.alert('Campo requerido', 'Selecciona un invernadero')
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(plantedAt)) {
      Alert.alert('Formato inválido', 'Usa el formato AAAA-MM-DD para la fecha')
      return
    }

    setLoading(true)
    try {
      await api.crops.create({
        name:              cropName.trim(),
        variety:           variety.trim() || undefined,
        plantedAt:         new Date(plantedAt).toISOString(),
        expectedHarvestAt: expectedHarvestAt.trim()
          ? new Date(expectedHarvestAt).toISOString()
          : undefined,
        greenhouseId:      selectedGh,
      })
      router.back()
    } catch {
      Alert.alert('Error', 'No se pudo crear el cultivo. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const triggerLabel = selectedCrop && selectedCrop !== '__otro'
    ? `${getCropEmoji(selectedCrop)}  ${selectedCrop}`
    : selectedCrop === '__otro'
      ? '✏️  Otro'
      : null

  return (
    <>
      <Stack.Screen options={{ title: 'Nuevo cultivo', headerShown: true, headerBackTitle: '' }} />
      <ScrollView className="flex-1 bg-background px-4 pt-4" keyboardShouldPersistTaps="handled">

        {/* Crop picker trigger */}
        <View className="mb-5">
          <Text className="text-sm font-medium text-foreground mb-1.5">Tipo de cultivo</Text>
          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            className="flex-row items-center justify-between px-3 py-3 rounded-xl border bg-surface"
            style={{ borderColor: selectedCrop ? palette.primary : palette.border }}
          >
            {triggerLabel ? (
              <Text className="text-sm font-medium text-foreground flex-1">{triggerLabel}</Text>
            ) : (
              <Text className="text-sm flex-1" style={{ color: palette.muted }}>
                Selecciona un cultivo…
              </Text>
            )}
            <Text className="text-muted text-base">▾</Text>
          </TouchableOpacity>

          {/* Custom name input when "Otro" is selected */}
          {selectedCrop === '__otro' ? (
            <TextInput
              className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground mt-2"
              placeholder="Nombre del cultivo…"
              placeholderTextColor={palette.muted}
              value={customName}
              onChangeText={setCustomName}
              autoFocus
            />
          ) : null}
        </View>

        {/* Variety */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Variedad (opcional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
            placeholder="Roma"
            placeholderTextColor={palette.muted}
            value={variety}
            onChangeText={setVariety}
          />
        </View>

        {/* Fecha plantación */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Fecha de plantación (AAAA-MM-DD)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
            placeholder="2026-04-27"
            placeholderTextColor={palette.muted}
            value={plantedAt}
            onChangeText={setPlantedAt}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Cosecha prevista */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Cosecha prevista (opcional, AAAA-MM-DD)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
            placeholder="2026-07-15"
            placeholderTextColor={palette.muted}
            value={expectedHarvestAt}
            onChangeText={setExpectedHarvestAt}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Invernadero */}
        {greenhouses.length > 0 ? (
          <View className="mb-5">
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

      {/* Crop picker modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: palette.border }}
          >
            <Text className="text-base font-semibold text-foreground">Tipo de cultivo</Text>
            <TouchableOpacity
              onPress={() => { setPickerOpen(false); setSearch('') }}
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: palette.surfaceAlt ?? '#E6F5EA' }}
            >
              <Text className="text-sm font-medium" style={{ color: palette.primary }}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="px-4 py-2" style={{ backgroundColor: palette.surface ?? '#fff' }}>
            <View
              className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: palette.surfaceAlt ?? '#E6F5EA' }}
            >
              <Text style={{ color: palette.muted }}>🔍</Text>
              <TextInput
                className="flex-1 text-sm text-foreground"
                placeholder="Buscar cultivo…"
                placeholderTextColor={palette.muted}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={{ color: palette.muted }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.name}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: palette.borderSubtle ?? '#C4E8CA', marginHorizontal: 16 }} />
            )}
            renderItem={({ item }) => {
              const isSelected = selectedCrop === item.name
              const label      = item.name === '__otro' ? 'Otro (escribir manualmente)' : item.name

              return (
                <Pressable
                  onPress={() => selectCrop(item.name)}
                  className="flex-row items-center gap-3 px-4 py-3.5"
                  style={({ pressed }) => ({
                    backgroundColor: isSelected
                      ? '#f0fdf4'
                      : pressed
                        ? (palette.surfaceAlt ?? '#E6F5EA')
                        : undefined,
                  })}
                >
                  <Text className="text-xl w-8 text-center leading-none">{item.emoji}</Text>
                  <Text
                    className="flex-1 text-sm"
                    style={{
                      color:      isSelected ? palette.primary : (palette.foreground ?? '#0B2610'),
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {label}
                  </Text>
                  {isSelected ? (
                    <Text style={{ color: palette.primary }}>✓</Text>
                  ) : null}
                </Pressable>
              )
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  )
}

export default NewCropScreen
