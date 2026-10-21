import { getDb } from './database'

export const LIBELLES_ACTION = {
  creer_inspection: "Création de l'inspection",
  reponse: 'Réponse à un point de contrôle',
  photo: 'Photo',
  signature: 'Signature',
  valider: "Validation de l'inspection",
  statut: 'Changement de statut',
}

export async function listerFileSynchro() {
  const db = await getDb()
  return db.getAllAsync(
    `SELECT * FROM file_synchro WHERE statut IN ('en_attente', 'echec') ORDER BY id ASC`
  )
}

/** Nettoyage : les actions terminées depuis plus de 7 jours n'ont plus d'intérêt. */
export async function purgerTermines() {
  const db = await getDb()
  const limite = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  await db.runAsync(`DELETE FROM file_synchro WHERE statut = 'termine' AND cree_le < ?`, [limite])
}

/** Abandonne une action en attente/en échec (elle ne sera jamais envoyée). */
export async function abandonnerAction(idAction) {
  const db = await getDb()
  await db.runAsync(`DELETE FROM file_synchro WHERE id = ? AND statut != 'termine'`, [idAction])
}

/**
 * Validation refusée par le serveur (ex: photo obligatoire manquante) :
 * on retire la validation en échec et on remet l'inspection « en cours »
 * localement, pour pouvoir compléter puis revalider. Le serveur, lui, n'a
 * jamais validé -> il est déjà dans l'état cohérent.
 */
export async function rouvrirApresEchecValidation(action) {
  const db = await getDb()
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM file_synchro WHERE id = ?`, [action.id])
    await db.runAsync(
      `UPDATE inspections_locales SET statut = 'en_cours', maj_le = ? WHERE id_local = ?`,
      [new Date().toISOString(), action.inspection_id_local]
    )
  })
}
