import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '../context/authStore'
import { theme } from '../styles/theme'
import BandeauSynchro from '../components/BandeauSynchro'
import { compterEnAttente } from '../db/inspectionsLocales'
import { useEffect, useState } from 'react'

export default function AccueilScreen() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [total, setTotal] = useState(null)

  useEffect(() => {
    compterEnAttente().then(setTotal)
  }, [])

  return (
    <View style={styles.conteneur}>
      <BandeauSynchro />

      <View style={{ padding: 24 }}>
        <Text style={styles.titre}>Bonjour {user?.nom} 👋</Text>
        <Text style={styles.sousTitre}>
          Base locale initialisée{total !== null ? ` — ${total} action(s) en attente de synchro` : ''}.
          Les vrais écrans d'inspection (Phase 3.4) consommeront cette même couche.
        </Text>

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
  sousTitre: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
  bouton: { marginTop: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  boutonTexte: { color: theme.colors.textPrimary, fontWeight: '700' },
})
