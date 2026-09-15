import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import apiClient from '../api/client'

const CLE_TOKEN = 'inspectpro_token'
const CLE_USER = 'inspectpro_user'

/**
 * Équivalent mobile de web-app/src/context/authStore.js — mêmes actions
 * (login/logout/estConnecte), mais le token est stocké via expo-secure-store
 * (chiffré au niveau OS, Keychain sur iOS / Keystore sur Android) plutôt
 * que dans un localStorage en clair.
 *
 * ⚠️ Connexion : nécessite toujours le réseau (règle de gestion validée) —
 * pas de login hors-ligne, contrairement à la saisie d'inspection ensuite.
 */
export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  chargement: false,
  erreur: null,
  pretAuDemarrage: false, // true une fois la session restaurée depuis le stockage sécurisé

  /** À appeler une fois au démarrage de l'app pour restaurer une session existante. */
  restaurerSession: async () => {
    const token = await SecureStore.getItemAsync(CLE_TOKEN)
    const userJson = await SecureStore.getItemAsync(CLE_USER)
    set({
      token: token || null,
      user: userJson ? JSON.parse(userJson) : null,
      pretAuDemarrage: true,
    })
  },

  estConnecte: () => Boolean(get().token),

  login: async (email, motDePasse) => {
    set({ chargement: true, erreur: null })
    try {
      const { data } = await apiClient.post('/login', { email, password: motDePasse })
      await SecureStore.setItemAsync(CLE_TOKEN, data.token)
      await SecureStore.setItemAsync(CLE_USER, JSON.stringify(data.user))
      set({ token: data.token, user: data.user, chargement: false })
      return true
    } catch (err) {
      const message =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Connexion impossible — vérifie ta connexion réseau.'
          : 'Une erreur est survenue. Réessaie.')
      set({ chargement: false, erreur: message })
      return false
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/logout')
    } catch {
      // on nettoie quand même la session locale même si l'appel réseau échoue
    } finally {
      await SecureStore.deleteItemAsync(CLE_TOKEN)
      await SecureStore.deleteItemAsync(CLE_USER)
      set({ token: null, user: null })
    }
  },
}))
