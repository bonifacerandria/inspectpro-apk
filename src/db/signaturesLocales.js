import { getDb } from './database'
import { supprimerFichierPhoto } from '../utils/stockagePhotos'

// Table créée à la demande (CREATE IF NOT EXISTS) : évite de modifier
// database.js et fonctionne aussi sur une base déjà existante sur le téléphone.
let tablePrete = null
export function assurerTableSignatures() {
  if (!tablePrete) {
    tablePrete = (async () => {
      const db = await getDb()
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS signatures_locales (
          id_local INTEGER PRIMARY KEY AUTOINCREMENT,
          inspection_id_local INTEGER NOT NULL,
          type_signataire TEXT NOT NULL,
          nom TEXT NOT NULL,
          uri_fichier TEXT NOT NULL,
          synchronise INTEGER NOT NULL DEFAULT 0,
          cree_le TEXT NOT NULL,
          UNIQUE(inspection_id_local, type_signataire)
        );
      `)
    })()
  }
  return tablePrete
}

export async function listerSignaturesLocales(inspectionIdLocal) {
  await assurerTableSignatures()
  const db = await getDb()
  const lignes = await db.getAllAsync(`SELECT * FROM signatures_locales WHERE inspection_id_local = ?`, [inspectionIdLocal])
  const parType = {}
  for (const l of lignes) parType[l.type_signataire] = l
  return parType
}

/** Une signature par type et par inspection : une nouvelle remplace l'ancienne (et son envoi en attente). */
export async function enregistrerSignatureLocale(inspectionIdLocal, { type, nom, uriFichier }) {
  await assurerTableSignatures()
  const db = await getDb()
  const now = new Date().toISOString()

  const existante = await db.getFirstAsync(
    `SELECT * FROM signatures_locales WHERE inspection_id_local = ? AND type_signataire = ?`,
    [inspectionIdLocal, type]
  )
  if (existante && !existante.synchronise) {
    await db.runAsync(
      `DELETE FROM file_synchro WHERE type_action = 'signature' AND reference_id = ? AND statut != 'termine'`,
      [existante.id_local]
    )
  }
  if (existante && existante.uri_fichier !== uriFichier) await supprimerFichierPhoto(existante.uri_fichier)

  await db.runAsync(
    `INSERT INTO signatures_locales (inspection_id_local, type_signataire, nom, uri_fichier, synchronise, cree_le)
     VALUES (?, ?, ?, ?, 0, ?)
     ON CONFLICT(inspection_id_local, type_signataire) DO UPDATE SET
       nom=excluded.nom, uri_fichier=excluded.uri_fichier, synchronise=0, cree_le=excluded.cree_le`,
    [inspectionIdLocal, type, nom, uriFichier, now]
  )
  const ligne = await db.getFirstAsync(
    `SELECT id_local FROM signatures_locales WHERE inspection_id_local = ? AND type_signataire = ?`,
    [inspectionIdLocal, type]
  )

  await db.runAsync(
    `INSERT INTO file_synchro (type_action, inspection_id_local, reference_id, payload_json, cree_le)
     VALUES ('signature', ?, ?, ?, ?)`,
    [inspectionIdLocal, ligne.id_local, JSON.stringify({ type_signataire: type, nom, uri_fichier: uriFichier }), now]
  )
}
