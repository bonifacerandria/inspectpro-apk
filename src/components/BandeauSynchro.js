import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useSyncAuto } from '../context/useSyncAuto'
import { theme } from '../styles/theme'

/**
 * Bandeau réutilisable (à poser en haut de n'importe quel écran) : statut
 * réseau + nombre d'actions en attente + bouton de synchro manuelle.
 * S'affiche seulement s'il y a quelque chose à signaler (rien en attente
 * ET en ligne -> invisible, pour ne pas polluer l'écran en usage normal).
 */
export default function BandeauSynchro() {
  const { enAttente, synchroEnCours, lancerSynchro, enLigne } = useSyncAuto()

  if (enAttente === 0 && enLigne) return null

  return (
    <View style={[styles.bandeau, { backgroundColor: enLigne ? theme.colors.accentSoft : theme.colors.warningSoft }]}>
      <Text style={[styles.texte, { color: enLigne ? theme.colors.accent : theme.colors.warning }]}>
        {enLigne ? '●' : '📡'} {enLigne ? 'En ligne' : 'Hors ligne'}
        {enAttente > 0 ? ` — ${enAttente} élément(s) en attente de synchro` : ''}
      </Text>

      {enAttente > 0 && enLigne && (
        <TouchableOpacity onPress={lancerSynchro} disabled={synchroEnCours} style={styles.bouton}>
          {synchroEnCours ? (
            <ActivityIndicator size="small" color={theme.colors.accent} />
          ) : (
            <Text style={styles.boutonTexte}>Synchroniser</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  bandeau: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  texte: { fontSize: 12.5, fontWeight: '600', flex: 1 },
  bouton: { paddingHorizontal: 10, paddingVertical: 4 },
  boutonTexte: { color: theme.colors.accent, fontWeight: '700', fontSize: 12.5 },
})
