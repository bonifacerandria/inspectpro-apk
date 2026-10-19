import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { theme } from '../styles/theme'
import { conserverPhoto } from '../utils/stockagePhotos'
import { supprimerPhotoLocale } from '../db/photosLocales'

/**
 * Prise de photo + miniatures. La photo est copiée dans le stockage
 * permanent AVANT d'être transmise à `onPrise(uri)`. Un tap sur une
 * miniature l'agrandit ; une photo non synchronisée (pastille orange)
 * peut être supprimée depuis l'aperçu.
 */
export default function ChampPhoto({ photos = [], modifiable, onPrise }) {
  const [ouverte, setOuverte] = useState(null)
  const [supprimees, setSupprimees] = useState([]) // masquage immédiat, sans dépendre d'un rechargement parent

  async function prendre() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Caméra', "L'accès à la caméra est nécessaire pour prendre une photo.")
      return
    }
    const resultat = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!resultat.canceled && resultat.assets?.[0]?.uri) {
      onPrise(await conserverPhoto(resultat.assets[0].uri))
    }
  }

  function demanderSuppression(photo) {
    Alert.alert('Supprimer cette photo ?', 'Elle ne sera pas envoyée au serveur.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          if (await supprimerPhotoLocale(photo.id_local)) {
            setSupprimees((s) => [...s, photo.id_local])
            setOuverte(null)
          }
        },
      },
    ])
  }

  const visibles = photos.filter((p) => !supprimees.includes(p.id_local))

  return (
    <View style={styles.ligne}>
      {visibles.map((p) => (
        <TouchableOpacity key={p.id_local} style={styles.miniature} onPress={() => setOuverte(p)}>
          <Image source={{ uri: p.uri_fichier }} style={styles.image} />
          {!p.synchronise && <View style={styles.pastille} />}
        </TouchableOpacity>
      ))}
      {modifiable && (
        <TouchableOpacity style={styles.ajout} onPress={prendre}>
          <Text style={{ fontSize: 18 }}>📷</Text>
        </TouchableOpacity>
      )}

      <Modal visible={!!ouverte} transparent animationType="fade" onRequestClose={() => setOuverte(null)}>
        <View style={styles.fond}>
          {ouverte && <Image source={{ uri: ouverte.uri_fichier }} style={styles.grande} resizeMode="contain" />}
          <View style={styles.actions}>
            {ouverte && !ouverte.synchronise && modifiable && (
              <TouchableOpacity style={[styles.bouton, { backgroundColor: theme.colors.danger }]} onPress={() => demanderSuppression(ouverte)}>
                <Text style={styles.boutonTexte}>Supprimer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.bouton} onPress={() => setOuverte(null)}>
              <Text style={styles.boutonTexte}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  miniature: { width: 52, height: 52 },
  image: { width: '100%', height: '100%', borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border },
  pastille: { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.warning },
  ajout: { width: 52, height: 52, borderRadius: theme.radius.sm, borderWidth: 1.4, borderStyle: 'dashed', borderColor: theme.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  fond: { flex: 1, backgroundColor: 'rgba(10,22,40,0.94)', justifyContent: 'center', padding: 16 },
  grande: { width: '100%', height: '75%' },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 },
  bouton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, paddingHorizontal: 22, paddingVertical: 11 },
  boutonTexte: { color: '#fff', fontWeight: '700' },
})
