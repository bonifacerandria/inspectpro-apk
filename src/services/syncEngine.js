import apiClient from '../api/client'
import { getDb } from '../db/database'

let synchroEnCours = false

/**
 * Rejoue la file d'attente vers l'API, dans l'ordre chronologique.
 *
 * Résolution des identifiants : une inspection créée hors-ligne n'a qu'un
 * id_local jusqu'à ce que sa création soit synchronisée — à partir de là,
 * toute action suivante la concernant (réponse, photo, validation...) doit
 * utiliser l'id_serveur retourné par l'API. Même logique pour une photo
 * attachée à une réponse : elle a besoin de l'id serveur DE LA RÉPONSE,
 * connu seulement une fois que cette réponse a elle-même été synchronisée.
 *
 * Si une action échoue, on n'essaie plus les actions SUIVANTES de la même
 * inspection (l'ordre est important, une photo ne peut pas partir avant sa
 * réponse) — mais les autres inspections continuent d'être synchronisées
 * normalement.
 */
export async function synchroniser() {
  if (synchroEnCours) return { demarree: false, raison: 'deja_en_cours' }
  synchroEnCours = true

  const db = await getDb()
  const idsResolusInspection = {} // id_local -> id_serveur
  const idsResolusReponse = {}    // "inspectionIdLocal:pointControleId" -> id_serveur de la réponse
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
      await db.runAsync(
        `UPDATE inspections_locales SET id_serveur=? WHERE id_local=?`,
        [data.id, item.inspection_id_local]
      )
      break
    }

    case 'reponse': {
      const inspectionIdServeur = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      const { data } = await apiClient.post(`/inspections/${inspectionIdServeur}/reponses`, {
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
      const inspectionIdServeur = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)

      let photographiableId = payload.photographiable_id
      if (payload.photographiable_type === 'reponse_controle' && !photographiableId) {
        const cle = `${item.inspection_id_local}:${payload.point_controle_id}`
        photographiableId = idsResolusReponse[cle]
        if (!photographiableId) {
          throw new Error("Réponse liée pas encore synchronisée — cette photo sera renvoyée à la prochaine synchro.")
        }
      }

      const formData = new FormData()
      formData.append('inspection_id', String(inspectionIdServeur))
      formData.append('photographiable_type', payload.photographiable_type)
      formData.append('photographiable_id', String(photographiableId))
      if (payload.libelle) formData.append('libelle', payload.libelle)
      formData.append('photo', {
        uri: payload.uri_fichier,
        name: payload.uri_fichier.split('/').pop() || 'photo.jpg',
        type: 'image/jpeg',
      })

      await apiClient.post('/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await db.runAsync(`UPDATE photos_locales SET synchronise=1 WHERE id_local=?`, [item.reference_id])
      break
    }

    case 'valider': {
      const inspectionIdServeur = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      await apiClient.post(`/inspections/${inspectionIdServeur}/valider`, { conclusion: payload.conclusion })
      break
    }

    case 'statut': {
      const inspectionIdServeur = await resoudreInspection(db, item.inspection_id_local, idsResolusInspection)
      await apiClient.patch(`/inspections/${inspectionIdServeur}/statut`, { statut: payload.statut })
      break
    }

    default:
      throw new Error(`Type d'action de synchro inconnu : ${item.type_action}`)
  }
}

async function resoudreInspection(db, inspectionIdLocal, idsResolusInspection) {
  if (idsResolusInspection[inspectionIdLocal]) return idsResolusInspection[inspectionIdLocal]

  const ligne = await db.getFirstAsync(
    `SELECT id_serveur FROM inspections_locales WHERE id_local = ?`,
    [inspectionIdLocal]
  )
  if (ligne?.id_serveur) {
    idsResolusInspection[inspectionIdLocal] = ligne.id_serveur
    return ligne.id_serveur
  }

  throw new Error("Inspection pas encore synchronisée — cette action sera rejouée après elle.")
}
