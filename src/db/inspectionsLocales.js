import { getDb } from './database'

/**
 * Toute écriture ici fait DEUX choses dans la même transaction :
 *  1. Elle met à jour la table locale correspondante (source de vérité
 *     immédiate pour l'affichage, même sans réseau).
 *  2. Elle ajoute une entrée dans `file_synchro` (rejouée plus tard par
 *     syncEngine.js).
 * L'écran n'a jamais à se demander "je suis en ligne ou pas ?" — il
 * appelle toujours ces fonctions, point.
 */

function maintenant() {
  return new Date().toISOString()
}

// --- Inspections ---------------------------------------------------------

export async function creerInspectionLocale(equipementId) {
  const db = await getDb()
  const now = maintenant()

  const resultat = await db.runAsync(
    `INSERT INTO inspections_locales (equipement_id, statut, date_inspection, cree_le, maj_le)
     VALUES (?, 'en_cours', ?, ?, ?)`,
    [equipementId, now.slice(0, 10), now, now]
  )
  const idLocal = resultat.lastInsertRowId

  await db.runAsync(
    `INSERT INTO file_synchro (type_action, inspection_id_local, payload_json, cree_le)
     VALUES ('creer_inspection', ?, ?, ?)`,
    [idLocal, JSON.stringify({ equipement_id: equipementId }), now]
  )

  return idLocal
}

export async function listerInspectionsLocales() {
  const db = await getDb()
  return db.getAllAsync(`SELECT * FROM inspections_locales ORDER BY cree_le DESC`)
}

export async function lireInspectionLocale(idLocal) {
  const db = await getDb()
  return db.getFirstAsync(`SELECT * FROM inspections_locales WHERE id_local = ?`, [idLocal])
}

export async function validerInspectionLocale(idLocal, conclusion) {
  const db = await getDb()
  const now = maintenant()

  await db.runAsync(
    `UPDATE inspections_locales SET statut='validee', conclusion=?, maj_le=? WHERE id_local=?`,
    [conclusion ?? null, now, idLocal]
  )
  await db.runAsync(
    `INSERT INTO file_synchro (type_action, inspection_id_local, payload_json, cree_le)
     VALUES ('valider', ?, ?, ?)`,
    [idLocal, JSON.stringify({ conclusion: conclusion ?? null }), now]
  )
}

export async function changerStatutLocal(idLocal, statut) {
  const db = await getDb()
  const now = maintenant()

  await db.runAsync(`UPDATE inspections_locales SET statut=?, maj_le=? WHERE id_local=?`, [statut, now, idLocal])
  await db.runAsync(
    `INSERT INTO file_synchro (type_action, inspection_id_local, payload_json, cree_le)
     VALUES ('statut', ?, ?, ?)`,
    [idLocal, JSON.stringify({ statut }), now]
  )
}

// --- Réponses aux points de contrôle -------------------------------------

export async function enregistrerReponseLocale(inspectionIdLocal, pointControleId, champs) {
  const db = await getDb()
  const now = maintenant()

  await db.runAsync(
    `INSERT INTO reponses_locales
       (inspection_id_local, point_controle_id, statut, valeur_texte, valeur_nombre, valeur_choix, commentaire, maj_le)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(inspection_id_local, point_controle_id) DO UPDATE SET
       statut=excluded.statut, valeur_texte=excluded.valeur_texte, valeur_nombre=excluded.valeur_nombre,
       valeur_choix=excluded.valeur_choix, commentaire=excluded.commentaire, maj_le=excluded.maj_le`,
    [
      inspectionIdLocal, pointControleId,
      champs.statut ?? null, champs.valeur_texte ?? null, champs.valeur_nombre ?? null,
      champs.valeur_choix ?? null, champs.commentaire ?? null, now,
    ]
  )

  await db.runAsync(
    `INSERT INTO file_synchro (type_action, inspection_id_local, payload_json, cree_le)
     VALUES ('reponse', ?, ?, ?)`,
    [inspectionIdLocal, JSON.stringify({ point_controle_id: pointControleId, ...champs }), now]
  )
}

export async function listerReponsesLocales(inspectionIdLocal) {
  const db = await getDb()
  const lignes = await db.getAllAsync(
    `SELECT * FROM reponses_locales WHERE inspection_id_local = ?`,
    [inspectionIdLocal]
  )
  // Format identique à celui du web : point_controle_id -> réponse.
  const parPoint = {}
  for (const l of lignes) parPoint[l.point_controle_id] = l
  return parPoint
}

// --- Photos ---------------------------------------------------------------

/**
 * `photographiableIdConnu` : id serveur direct si déjà connu (cas d'une
 * photo obligatoire, dont l'id vient du formulaire déjà en cache) ; laisser
 * `null` pour une photo attachée à une réponse — elle sera résolue au
 * moment de la synchro, une fois la réponse elle-même synchronisée.
 */
export async function ajouterPhotoLocale(inspectionIdLocal, { type, photographiableIdConnu, pointControleId, uriFichier, libelle }) {
  const db = await getDb()
  const now = maintenant()

  const resultat = await db.runAsync(
    `INSERT INTO photos_locales
       (inspection_id_local, photographiable_type, photographiable_id, point_controle_id, uri_fichier, libelle, cree_le)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [inspectionIdLocal, type, photographiableIdConnu ?? null, pointControleId ?? null, uriFichier, libelle ?? null, now]
  )
  const idPhotoLocale = resultat.lastInsertRowId

  await db.runAsync(
    `INSERT INTO file_synchro (type_action, inspection_id_local, reference_id, payload_json, cree_le)
     VALUES ('photo', ?, ?, ?, ?)`,
    [
      inspectionIdLocal, idPhotoLocale,
      JSON.stringify({
        photographiable_type: type,
        photographiable_id: photographiableIdConnu ?? null,
        point_controle_id: pointControleId ?? null,
        uri_fichier: uriFichier,
        libelle: libelle ?? null,
      }),
      now,
    ]
  )

  return idPhotoLocale
}

export async function listerPhotosLocales(inspectionIdLocal) {
  const db = await getDb()
  return db.getAllAsync(`SELECT * FROM photos_locales WHERE inspection_id_local = ?`, [inspectionIdLocal])
}

// --- File de synchro : lecture pour affichage (badge, écran de statut) ---

export async function compterEnAttente() {
  const db = await getDb()
  const ligne = await db.getFirstAsync(
    `SELECT COUNT(*) as total FROM file_synchro WHERE statut IN ('en_attente', 'echec')`
  )
  return ligne?.total || 0
}
