import apiClient from './client'
import { sauvegarderFormulaire, lireFormulaire } from '../db/cache'

export async function obtenirFormulaire(typeEquipementId) {
  try {
    const { data } = await apiClient.get(`/types-equipement/${typeEquipementId}/formulaire`)
    await sauvegarderFormulaire(typeEquipementId, data)
    return { formulaire: data, depuisCache: false }
  } catch {
    const formulaire = await lireFormulaire(typeEquipementId)
    if (!formulaire) {
      throw new Error("Formulaire indisponible hors-ligne — ouvre une première fois ce type d'équipement en ligne pour le mettre en cache.")
    }
    return { formulaire, depuisCache: true }
  }
}
