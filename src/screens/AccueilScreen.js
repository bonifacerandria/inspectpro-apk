import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../context/authStore'
import { useReseau } from '../context/useReseau'
import { theme } from '../styles/theme'

export default function AccueilScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const enLigne = useReseau()

  return (
    <View style={styles.conteneur}>
      <View style={[styles.badgeReseau, { backgroundColor: enLigne ? theme.colors.successSoft : theme.colors.warningSoft }]}>
        <Text style={{ color: enLigne ? theme.colors.success : theme.colors.warning, fontWeight: '700', fontSize: 12 }}>
          {enLigne ? '● En ligne' : '● Hors ligne'}
        </Text>
      </View>

      <Text style={styles.titre}>Bonjour {user?.nom} 👋</Text>
      <Text style={styles.sousTitre}>
        Connexion validée avec l'API InspectPro. Les écrans d'inspection arrivent aux prochaines étapes.
      </Text>

      <TouchableOpacity style={styles.bouton} onPress={logout}>
        <Text style={styles.boutonTexte}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, padding: 24, backgroundColor: theme.colors.bgPage },
  badgeReseau: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill, marginBottom: 20 },
  titre: { fontSize: 20, fontWeight: '800', color: theme.colors.navy900 },
  sousTitre: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
  bouton: { marginTop: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  boutonTexte: { color: theme.colors.textPrimary, fontWeight: '700' },
})
