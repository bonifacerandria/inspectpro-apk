import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'
import apiClient from '../api/client'

const CLE_TOKEN = 'inspectpro_token'
const CLE_USER = 'inspectpro_user'

/**
 * Traduit une erreur axios en message lisible, en distinguant les cas
 * courants (réseau absent, lenteur, identifiants invalides, compte
 * désactivé, panne serveur) — plutôt qu'un message générique unique.
 */
function messageErreurConnexion(err) {
  if (!err.response) {
    // Pas de réponse du tout -> problème réseau ou serveur injoignable.
    if (err.code === 'ECONNABORTED') {
      return 'La connexion est trop lente. Réessaie dans un instant.'
    }
    return 'Impossible de joindre le serveur — vérifie ta connexion réseau.'
  }

  const { status, data } = err.response

  if (status === 422) {
    // Identifiants invalides ou compte désactivé (cf. AuthController::login)
    return data?.errors?.email?.[0] || data?.message || 'Identifiants incorrects.'
  }

  if (status >= 500) {
    return 'Le serveur rencontre un problème. Réessaie dans quelques instants.'
  }

  return data?.message || 'Une erreur est survenue. Réessaie.'
}

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  chargement: false,
  erreur: null,
  pretAuDemarrage: false,

  restaurerSession: async () => {
    try {
      const token = await SecureStore.getItemAsync(CLE_TOKEN)
      const userJson = await SecureStore.getItemAsync(CLE_USER)
      set({
        token: token || null,
        user: userJson ? JSON.parse(userJson) : null,
        pretAuDemarrage: true,
      })
    } catch {
      // Stockage sécurisé illisible (rare) -> on repart sur une session vide
      // plutôt que de bloquer l'app indéfiniment sur l'écran de démarrage.
      set({ token: null, user: null, pretAuDemarrage: true })
    }
  },

  estConnecte: () => Boolean(get().token),

  effacerErreur: () => set({ erreur: null }),

  login: async (email, motDePasse) => {
    set({ chargement: true, erreur: null })
    try {
      const { data } = await apiClient.post('/login', { email, password: motDePasse })
      await SecureStore.setItemAsync(CLE_TOKEN, data.token)
      await SecureStore.setItemAsync(CLE_USER, JSON.stringify(data.user))
      set({ token: data.token, user: data.user, chargement: false })
      return true
    } catch (err) {
      set({ chargement: false, erreur: messageErreurConnexion(err) })
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
