import apiClient from '../api/client'
import { getDb } from '../db/database'
import { assurerTableSignatures } from '../db/signaturesLocales'

let synchroEnCours = false

/**
 * Rejoue la file d'attente vers l'API, dans l'ordre chronologique.
 * Les id_local sont résolus en id_serveur au fil de la synchro ; si une
 * action échoue, les suivantes de la MÊME inspection sont suspendues (ordre
 * important), les autres inspections continuent.
 * (Version avec l'action 'signature' en plus.)
 */
export async function synchroniser() {
  if (synchroEnCours) return { demarree: false, raison: 'deja_en_cours' }
  synchroEnCours = true

  const db = await getDb()
  const idsResolusInspection = {}
  const idsResolusReponse = {}
  const inspectionsEnEchec = new Set()
  let traites = 0
  let echecs = 0

  try {
    const items = await db.getAllAsync(
      `SELECT * FROM file_synchro WHERE statut IN ('en_attente', 'echec') ORDER BY id ASC`
    )

    for (const item of items) {
      if (inspectionsEnEchec.has(item.inspection_id_local)) continue
      try {
        await traiterItem(db, item, idsResolusInspection, idsResolusReponse)
        await db.runAsync(`UPDATE file_synchro SET statut='termine' WHERE id=?`, [item.id])
        traites += 1
      } catch (err) {
        inspectionsEnEchec.add(item.inspection_id_local)
        echecs += 1
        await db.runAsync(
          `UPDATE file_synchro SET statut='echec', tentatives=tentatives+1, derniere_erreur=? WHERE id=?`,
          [String(err?.response?.data?.message || err?.message || err), item.id]
        )
      }
    }
  } finally {
    synchroEnCours = false
  }
  return { demarree: true, traites, echecs }
}

async function traiterItem(db, item, idsResolusInspection, idsResolusReponse) {
  const payload = JSON.parse(item.payload_json)

  switch (item.type_action) {
    case 'creer_inspection': {
      const { data } = await apiClient.post('/inspections', { equipement_id: payload.equipement_id })
      idsResolusInspection[item.inspection_id_local] = data.id
      await db.runAsync(`UPDATE inspections_locales SET id_serveur=? WHERE id_local=?`, [data.id, item.inspection_id_local])
      break
    }

    case 'reponse': {
      const id = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      const { data } = await apiClient.post(`/inspections/${id}/reponses`, {
        point_controle_id: payload.point_controle_id,
        statut: payload.statut,
        valeur_texte: payload.valeur_texte,
        valeur_nombre: payload.valeur_nombre,
        valeur_choix: payload.valeur_choix,
        commentaire: payload.commentaire,
      })
      idsResolusReponse[`${item.inspection_id_local}:${payload.point_controle_id}`] = data.reponse.id
      break
    }

    case 'photo': {
      const id = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      let photographiableId = payload.photographiable_id
      if (payload.photographiable_type === 'reponse_controle' && !photographiableId) {
        photographiableId = idsResolusReponse[`${item.inspection_id_local}:${payload.point_controle_id}`]
        if (!photographiableId) throw new Error("Réponse liée pas encore synchronisée — cette photo sera renvoyée à la prochaine synchro.")
      }
      const formData = new FormData()
      formData.append('inspection_id', String(id))
      formData.append('photographiable_type', payload.photographiable_type)
      formData.append('photographiable_id', String(photographiableId))
      if (payload.libelle) formData.append('libelle', payload.libelle)
      formData.append('photo', { uri: payload.uri_fichier, name: payload.uri_fichier.split('/').pop() || 'photo.jpg', type: 'image/jpeg' })
      await apiClient.post('/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await db.runAsync(`UPDATE photos_locales SET synchronise=1 WHERE id_local=?`, [item.reference_id])
      break
    }

    case 'signature': {
      await assurerTableSignatures()
      const id = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      const formData = new FormData()
      formData.append('type_signataire', payload.type_signataire)
      formData.append('nom', payload.nom)
      formData.append('signature', { uri: payload.uri_fichier, name: 'signature.png', type: 'image/png' })
      await apiClient.post(`/inspections/${id}/signatures`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await db.runAsync(`UPDATE signatures_locales SET synchronise=1 WHERE id_local=?`, [item.reference_id])
      break
    }

    case 'valider': {
      const id = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      await apiClient.post(`/inspections/${id}/valider`, { conclusion: payload.conclusion })
      break
    }

    case 'statut': {
      const id = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      await apiClient.patch(`/inspections/${id}/statut`, { statut: payload.statut })
      break
    }

    default:
      throw new Error(`Type d'action de synchro inconnu : ${item.type_action}`)
  }
}

async function resoudreInspection(db, inspectionIdLocal, idsResolusInspection) {
  if (idsResolusInspection[inspectionIdLocal]) return idsResolusInspection[inspectionIdLocal]
  const ligne = await db.getFirstAsync(`SELECT id_serveur FROM inspections_locales WHERE id_local = ?`, [inspectionIdLocal])
  if (ligne?.id_serveur) {
    idsResolusInspection[inspectionIdLocal] = ligne.id_serveur
    return ligne.id_serveur
  }
  throw new Error("Inspection pas encore synchronisée — cette action sera rejouée après elle.")
}
