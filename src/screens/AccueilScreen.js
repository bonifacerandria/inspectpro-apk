import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../context/authStore'
import { theme } from '../styles/theme'
import BandeauSynchro from '../components/BandeauSynchro'

export default function AccueilScreen({ navigation }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <View style={styles.conteneur}>
      <BandeauSynchro />

      <View style={{ padding: 24 }}>
        <Text style={styles.titre}>Bonjour {user?.nom} 👋</Text>
        <Text style={styles.sousTitre}>Que veux-tu faire ?</Text>

        <TouchableOpacity style={styles.boutonPrincipal} onPress={() => navigation.navigate('Inspections')}>
          <Text style={styles.boutonPrincipalTexte}>🔍 Mes inspections</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bouton} onPress={logout}>
          <Text style={styles.boutonTexte}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.colors.bgPage },
  titre: { fontSize: 20, fontWeight: '800', color: theme.colors.navy900 },
  sousTitre: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 6, marginBottom: 22 },
  boutonPrincipal: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 15, alignItems: 'center' },
  boutonPrincipalTexte: { color: '#fff', fontWeight: '700', fontSize: 15 },
  bouton: { marginTop: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  boutonTexte: { color: theme.colors.textPrimary, fontWeight: '700' },
})
