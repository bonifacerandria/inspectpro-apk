import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSyncAuto } from '../context/useSyncAuto'
import { theme } from '../styles/theme'

/**
 * Bandeau réutilisable : statut réseau + éléments en attente + bouton de
 * synchro manuelle. Un appui sur le texte ouvre l'écran de suivi détaillé.
 * Invisible quand tout est synchronisé et qu'on est en ligne.
 */
export default function BandeauSynchro() {
  const { enAttente, synchroEnCours, lancerSynchro, enLigne } = useSyncAuto()
  const navigation = useNavigation()

  if (enAttente === 0 && enLigne) return null

  return (
    <View style={[styles.bandeau, { backgroundColor: enLigne ? theme.colors.accentSoft : theme.colors.warningSoft }]}>
      <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Synchro')}>
        <Text style={[styles.texte, { color: enLigne ? theme.colors.accent : theme.colors.warning }]}>
          {enLigne ? '●' : '📡'} {enLigne ? 'En ligne' : 'Hors ligne'}
          {enAttente > 0 ? ` — ${enAttente} élément(s) en attente (détails ›)` : ''}
        </Text>
      </TouchableOpacity>

      {enAttente > 0 && enLigne && (
        <TouchableOpacity onPress={lancerSynchro} disabled={synchroEnCours} style={styles.bouton}>
          {synchroEnCours ? <ActivityIndicator size="small" color={theme.colors.accent} /> : <Text style={styles.boutonTexte}>Synchroniser</Text>}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  bandeau: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 8 },
  texte: { fontSize: 12.5, fontWeight: '600' },
  bouton: { paddingHorizontal: 10, paddingVertical: 4 },
  boutonTexte: { color: theme.colors.accent, fontWeight: '700', fontSize: 12.5 },
})
