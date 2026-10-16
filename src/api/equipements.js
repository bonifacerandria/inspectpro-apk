import apiClient from './client'
import { sauvegarderEquipements, listerEquipementsCache } from '../db/cache'

/** Réseau d'abord (données à jour), repli silencieux sur le cache local. */
export async function obtenirEquipements() {
  try {
    const { data } = await apiClient.get('/equipements', { params: { per_page: 500 } })
    const equipements = data.data ?? data
    await sauvegarderEquipements(equipements)
    return { equipements, depuisCache: false }
  } catch {
    const equipements = await listerEquipementsCache()
    return { equipements, depuisCache: true }
  }
}
