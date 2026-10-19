import { getDb } from './database'
import { supprimerFichierPhoto } from '../utils/stockagePhotos'

/**
 * Supprime une photo PAS ENCORE synchronisée : ligne locale, fichier, et
 * entrée correspondante dans la file de synchro (pour qu'elle ne soit
 * jamais envoyée). Une photo déjà envoyée au serveur n'est pas supprimable
 * depuis le mobile (on ne conserve pas son id serveur) -> retourne false.
 */
export async function supprimerPhotoLocale(idPhotoLocale) {
  const db = await getDb()
  const photo = await db.getFirstAsync(`SELECT * FROM photos_locales WHERE id_local = ?`, [idPhotoLocale])
  if (!photo || photo.synchronise) return false

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `DELETE FROM file_synchro WHERE type_action = 'photo' AND reference_id = ? AND statut != 'termine'`,
      [idPhotoLocale]
    )
    await db.runAsync(`DELETE FROM photos_locales WHERE id_local = ?`, [idPhotoLocale])
  })
  await supprimerFichierPhoto(photo.uri_fichier)
  return true
}
