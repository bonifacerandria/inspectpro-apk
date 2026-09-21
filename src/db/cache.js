import { getDb } from './database'

/**
 * Cache local du référentiel consommé pendant une inspection : le
 * formulaire dynamique d'un type d'équipement, et la liste des équipements
 * disponibles. Alimenté quand l'app est en ligne (à chaque consultation),
 * relu quand elle ne l'est pas.
 */

export async function sauvegarderFormulaire(typeEquipementId, formulaire) {
  const db = await getDb()
  await db.runAsync(
    `INSERT INTO formulaires_cache (type_equipement_id, json, maj_le)
     VALUES (?, ?, ?)
     ON CONFLICT(type_equipement_id) DO UPDATE SET json=excluded.json, maj_le=excluded.maj_le`,
    [typeEquipementId, JSON.stringify(formulaire), new Date().toISOString()]
  )
}

export async function lireFormulaire(typeEquipementId) {
  const db = await getDb()
  const ligne = await db.getFirstAsync(
    `SELECT json FROM formulaires_cache WHERE type_equipement_id = ?`,
    [typeEquipementId]
  )
  return ligne ? JSON.parse(ligne.json) : null
}

export async function sauvegarderEquipements(equipements) {
  const db = await getDb()
  const maintenant = new Date().toISOString()
  await db.withTransactionAsync(async () => {
    for (const eq of equipements) {
      await db.runAsync(
        `INSERT INTO equipements_cache (id, type_equipement_id, json, maj_le)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET json=excluded.json, maj_le=excluded.maj_le`,
        [eq.id, eq.type_equipement_id, JSON.stringify(eq), maintenant]
      )
    }
  })
}

export async function listerEquipementsCache() {
  const db = await getDb()
  const lignes = await db.getAllAsync(`SELECT json FROM equipements_cache ORDER BY id DESC`)
  return lignes.map((l) => JSON.parse(l.json))
}
