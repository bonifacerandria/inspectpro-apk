import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { theme } from '../styles/theme'

/**
 * Affiché pendant restaurerSession() (lecture du stockage sécurisé au
 * démarrage) — évite un écran blanc/gris générique le temps de savoir si
 * une session existe déjà.
 */
export default function SplashScreen() {
  return (
    <View style={styles.conteneur}>
      <View style={styles.logoMark}>
        <Text style={styles.logoText}>IP</Text>
      </View>
      <Text style={styles.titre}>InspectPro</Text>
      <ActivityIndicator size="small" color={theme.colors.textOnDarkMuted} style={{ marginTop: 24 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.navy900 },
  logoMark: {
    width: 64, height: 64, borderRadius: theme.radius.lg, backgroundColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
})
