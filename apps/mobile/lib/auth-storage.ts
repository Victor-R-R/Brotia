import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY             = 'brotia_auth_token'
const USER_KEY              = 'brotia_auth_user'
const IMPERSONATE_TOKEN_KEY = 'brotia_impersonate_token'
const IMPERSONATE_USER_KEY  = 'brotia_impersonate_user'

export type StoredUser = {
  id:       string
  email:    string
  name:     string | null
  lastName: string | null
}

export const saveAuth = async (token: string, user: StoredUser) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
}

export const getToken = async (): Promise<string | null> =>
  SecureStore.getItemAsync(TOKEN_KEY)

export const getStoredUser = async (): Promise<StoredUser | null> => {
  const raw = await SecureStore.getItemAsync(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export const clearAuth = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(USER_KEY)
  await clearImpersonation()
}

export const saveImpersonation = async (token: string, user: StoredUser) => {
  await SecureStore.setItemAsync(IMPERSONATE_TOKEN_KEY, token)
  await SecureStore.setItemAsync(IMPERSONATE_USER_KEY, JSON.stringify(user))
}

export const getImpersonationToken = async (): Promise<string | null> =>
  SecureStore.getItemAsync(IMPERSONATE_TOKEN_KEY)

export const getImpersonatedUser = async (): Promise<StoredUser | null> => {
  const raw = await SecureStore.getItemAsync(IMPERSONATE_USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export const clearImpersonation = async () => {
  await SecureStore.deleteItemAsync(IMPERSONATE_TOKEN_KEY)
  await SecureStore.deleteItemAsync(IMPERSONATE_USER_KEY)
}
