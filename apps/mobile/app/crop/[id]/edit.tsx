import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, Modal, FlatList, SafeAreaView, Pressable, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { api } from '@/lib/api'
import { palette } from '@/lib/theme'
import { CROP_EMOJI, CROP_NAMES, getCropEmoji, matchesCropSearch } from '@/lib/crops'

type Status = 'GROWING' | 'HARVESTED' | 'FAILED'

const STATUS_OPTIONS: { value: Status; label: string; emoji: string }[] = [
  { value: 'GROWING',   label: 'En crecimiento', emoji: '🌱' },
  { value: 'HARVESTED', label: 'Cosechado',       emoji: '🌾' },
  { value: 'FAILED',    label: 'Fallido',         emoji: '❌' },
]

type CropItem = { name: string; emoji: string }

const ALL_ITEMS: CropItem[] = [
  ...CROP_NAMES.map(name => ({ name, emoji: CROP_EMOJI[name] ?? '🌱' })),
  { name: '__otro', emoji: '✏️' },
]

const CropEditScreen = () => {
  const router  = useRouter()
  const { id }  = useLocalSearchParams<{ id: string }>()
  const safeId  = Array.isArray(id) ? id[0] : id

  const [fetched,           setFetched]           = useState(false)
  const [selectedCrop,      setSelectedCrop]      = useState('')
  const [customName,        setCustomName]        = useState('')
  const [pickerOpen,        setPickerOpen]        = useState(false)
  const [search,            setSearch]            = useState('')
  const [variety,           setVariety]           = useState('')
  const [status,            setStatus]            = useState<Status>('GROWING')
  const [plantedAt,         setPlantedAt]         = useState('')
  const [expectedHarvestAt, setExpectedHarvestAt] = useState('')
  const [harvestedAt,       setHarvestedAt]       = useState('')
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState<string | null>(null)

  const cropName = selectedCrop === '__otro' ? customName : selectedCrop

  const filtered = ALL_ITEMS.filter(item =>
    item.name === '__otro' || matchesCropSearch(item.name, search)
  )

  useEffect(() => {
    api.crops.get(safeId)
      .then(crop => {
        const existing = crop.name ?? ''
        if (CROP_NAMES.includes(existing)) {
          setSelectedCrop(existing)
        } else {
          setSelectedCrop('__otro')
          setCustomName(existing)
        }
        setVariety(crop.variety ?? '')
        setStatus(crop.status ?? 'GROWING')
        setPlantedAt(
          crop.plantedAt ? new Date(crop.plantedAt).toISOString().slice(0, 10) : ''
        )
        setExpectedHarvestAt(
          crop.expectedHarvestAt ? new Date(crop.expectedHarvestAt).toISOString().slice(0, 10) : ''
        )
        setHarvestedAt(
          crop.harvestedAt ? new Date(crop.harvestedAt).toISOString().slice(0, 10) : ''
        )
        setFetched(true)
      })
      .catch(() => Alert.alert('Error', 'No se pudo cargar el cultivo.'))
  }, [safeId])

  const selectCrop = (name: string) => {
    setSelectedCrop(name)
    setPickerOpen(false)
    setSearch('')
    if (name !== '__otro') setCustomName('')
  }

  const handleSubmit = async () => {
    if (!cropName.trim()) {
      setError('El nombre del cultivo es obligatorio.')
      return
    }
    if (!plantedAt.trim()) {
      setError('La fecha de plantación es obligatoria.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const body: Parameters<typeof api.crops.update>[1] = {
        name:   cropName.trim(),
        status,
      }
      if (variety.trim())           body.variety           = variety.trim()
      if (plantedAt.trim())         body.plantedAt         = new Date(plantedAt).toISOString()
      if (expectedHarvestAt.trim()) body.expectedHarvestAt = expectedHarvestAt
      if (harvestedAt.trim())       body.harvestedAt       = harvestedAt

      await api.crops.update(safeId, body)
      router.back()
    } catch {
      setError('Error al guardar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const triggerLabel = selectedCrop && selectedCrop !== '__otro'
    ? `${getCropEmoji(selectedCrop)}  ${selectedCrop}`
    : selectedCrop === '__otro'
      ? `✏️  ${customName || 'Otro'}`
      : null

  if (!fetched) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Editar cultivo', headerShown: true, headerBackTitle: '' }} />
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
            <Text style={{ color: palette.muted }}>▾</Text>
          </TouchableOpacity>

          {selectedCrop === '__otro' ? (
            <TextInput
              className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground mt-2"
              placeholder="Nombre del cultivo…"
              placeholderTextColor={palette.muted}
              value={customName}
              onChangeText={setCustomName}
            />
          ) : null}
        </View>

        {/* Variety */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Variedad (opcional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
            placeholder="Ej: Cherry, Roma…"
            placeholderTextColor={palette.muted}
            value={variety}
            onChangeText={setVariety}
          />
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Estado</Text>
          {STATUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setStatus(opt.value)}
              className="flex-row items-center gap-3 py-2.5 px-3 rounded-xl mb-1.5 border"
              style={{
                backgroundColor: status === opt.value ? '#f0fdf4' : undefined,
                borderColor:     status === opt.value ? palette.primary : palette.border,
              }}
            >
              <View
                className="w-4 h-4 rounded-full border-2 items-center justify-center"
                style={{ borderColor: status === opt.value ? palette.primary : palette.border }}
              >
                {status === opt.value ? (
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.primary }} />
                ) : null}
              </View>
              <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
              <Text className="text-sm text-foreground">{opt.label}</Text>
            </TouchableOpacity>
          ))}
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
          <Text className="text-sm font-medium text-foreground mb-1.5">Cosecha prevista (opcional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
            placeholder="2026-07-15"
            placeholderTextColor={palette.muted}
            value={expectedHarvestAt}
            onChangeText={setExpectedHarvestAt}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Fecha de fin de cultivo */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-1.5">Fecha de fin de cultivo (opcional)</Text>
          <TextInput
            className="bg-surface border border-border rounded-xl px-3 py-3 text-sm text-foreground"
            placeholder="2026-08-01"
            placeholderTextColor={palette.muted}
            value={harvestedAt}
            onChangeText={setHarvestedAt}
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {error ? (
          <View className="rounded-xl px-3 py-2 mb-4" style={{ backgroundColor: '#fee2e2' }}>
            <Text className="text-xs font-medium" style={{ color: palette.danger }}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          className={`bg-primary rounded-xl py-3.5 items-center mt-2 mb-8 ${loading ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-sm">
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Crop picker modal — identical to new.tsx */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View
            className="flex-row items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: palette.border }}
          >
            <Text className="text-base font-semibold text-foreground">Tipo de cultivo</Text>
            <TouchableOpacity
              onPress={() => { setPickerOpen(false); setSearch('') }}
              className="px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: palette.surfaceAlt }}
            >
              <Text className="text-sm font-medium" style={{ color: palette.primary }}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <View className="px-4 py-2" style={{ backgroundColor: palette.surface }}>
            <View
              className="flex-row items-center gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: palette.surfaceAlt }}
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

          <FlatList
            data={filtered}
            keyExtractor={item => item.name}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: palette.borderSubtle, marginHorizontal: 16 }} />
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
                      : pressed ? palette.surfaceAlt : undefined,
                  })}
                >
                  <Text className="text-xl w-8 text-center leading-none">{item.emoji}</Text>
                  <Text
                    className="flex-1 text-sm"
                    style={{
                      color:      isSelected ? palette.primary : palette.foreground,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {label}
                  </Text>
                  {isSelected ? <Text style={{ color: palette.primary }}>✓</Text> : null}
                </Pressable>
              )
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  )
}

export default CropEditScreen
