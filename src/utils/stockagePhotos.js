// ⚠️ Selon la version d'Expo SDK du projet, un seul de ces deux imports est valide :
//   - SDK 54 et plus récent  -> 'expo-file-system/legacy'   (cas par défaut ci-dessous)
//   - SDK 53 et plus ancien  -> 'expo-file-system'
// Vérifier avec :  grep '"expo"' package.json
import * as FileSystem from 'expo-file-system/legacy'

const DOSSIER = `${FileSystem.documentDirectory}photos/`

async function assurerDossier() {
  const info = await FileSystem.getInfoAsync(DOSSIER)
  if (!info.exists) await FileSystem.makeDirectoryAsync(DOSSIER, { intermediates: true })
}

/**
 * Copie la photo (fichier temporaire de la caméra, que l'OS peut purger)
 * vers le stockage permanent de l'app et renvoie son nouvel URI.
 * Si la copie échoue, on garde l'URI d'origine plutôt que de perdre la photo.
 */
export async function conserverPhoto(uriTemporaire) {
  try {
    await assurerDossier()
    const extension = (uriTemporaire.split('.').pop() || 'jpg').split('?')[0]
    const destination = `${DOSSIER}${Date.now()}_${Math.floor(Math.random() * 1e6)}.${extension}`
    await FileSystem.copyAsync({ from: uriTemporaire, to: destination })
    return destination
  } catch {
    return uriTemporaire
  }
}

export async function supprimerFichierPhoto(uri) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true })
  } catch {
    // fichier déjà absent : sans importance
  }
}
