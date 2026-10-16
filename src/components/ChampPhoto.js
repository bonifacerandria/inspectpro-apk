import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { theme } from '../styles/theme'

/**
 * Bouton « prendre une photo » + miniatures des photos déjà prises
 * (locales, donc visibles même avant synchro). `onPrise(uri)` est appelé
 * avec le fichier capturé ; l'écran parent l'enregistre via
 * ajouterPhotoLocale (qui met aussi l'upload en file de synchro).
 */
export default function ChampPhoto({ photos = [], modifiable, onPrise }) {
  async function prendre() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Caméra', "L'accès à la caméra est nécessaire pour prendre une photo.")
      return
    }
    const resultat = await ImagePicker.launchCameraAsync({ quality: 0.7 })
    if (!resultat.canceled && resultat.assets?.[0]?.uri) {
      onPrise(resultat.assets[0].uri)
    }
  }

  return (
    <View style={styles.ligne}>
      {photos.map((p) => (
        <View key={p.id_local} style={styles.miniature}>
          <Image source={{ uri: p.uri_fichier }} style={styles.image} />
          {!p.synchronise && <View style={styles.pastille} />}
        </View>
      ))}
      {modifiable && (
        <TouchableOpacity style={styles.ajout} onPress={prendre}>
          <Text style={{ fontSize: 18 }}>📷</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  miniature: { width: 52, height: 52 },
  image: { width: '100%', height: '100%', borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.border },
  pastille: { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.warning },
  ajout: { width: 52, height: 52, borderRadius: theme.radius.sm, borderWidth: 1.4, borderStyle: 'dashed', borderColor: theme.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
})
