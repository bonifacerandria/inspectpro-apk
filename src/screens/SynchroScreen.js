import { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { useSyncAuto } from '../context/useSyncAuto'
import { listerFileSynchro, purgerTermines, abandonnerAction, rouvrirApresEchecValidation, LIBELLES_ACTION } from '../db/syncStatut'
import { theme } from '../styles/theme'

export default function SynchroScreen() {
  const { enAttente, synchroEnCours, lancerSynchro, enLigne } = useSyncAuto()
  const [actions, setActions] = useState([])

  const charger = useCallback(async () => {
    setActions(await listerFileSynchro())
  }, [])

  useEffect(() => { purgerTermines().catch(() => {}) }, [])
  useEffect(() => { charger() }, [charger, enAttente, synchroEnCours])

  function confirmerAbandon(action) {
    Alert.alert(
      'Abandonner cet envoi ?',
      "Cet élément ne sera jamais envoyé au serveur (il reste visible sur ce téléphone).",
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: async () => { await abandonnerAction(action.id); charger() } },
      ]
    )
  }

  async function rouvrir(action) {
    await rouvrirApresEchecValidation(action)
    charger()
    Alert.alert('Inspection rouverte', "Complète les éléments manquants (ex : photos obligatoires), puis valide à nouveau.")
  }

  const echecs = actions.filter((a) => a.statut === 'echec').length

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Text style={styles.resume}>
          {enLigne ? '● En ligne' : '📡 Hors ligne'} · {actions.length} en attente · {echecs} en échec
        </Text>
        <TouchableOpacity
          style={[styles.bouton, (!enLigne || synchroEnCours || actions.length === 0) && { opacity: 0.45 }]}
          disabled={!enLigne || synchroEnCours || actions.length === 0}
          onPress={lancerSynchro}
        >
          {synchroEnCours ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonTexte}>Synchroniser maintenant</Text>}
        </TouchableOpacity>
      </View>

      <FlatList
        data={actions}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 14 }}
        ListEmptyComponent={<Text style={styles.vide}>✅ Tout est synchronisé.</Text>}
        renderItem={({ item }) => {
          const enEchec = item.statut === 'echec'
          return (
            <View style={[styles.carte, enEchec && { borderColor: theme.colors.danger }]}>
              <View style={styles.ligne}>
                <Text style={styles.titre}>{LIBELLES_ACTION[item.type_action] || item.type_action}</Text>
                <Text style={[styles.badge, { color: enEchec ? theme.colors.danger : theme.colors.textMuted }]}>
                  {enEchec ? `Échec (×${item.tentatives})` : 'En attente'}
                </Text>
              </View>
              <Text style={styles.detail}>Inspection locale n°{item.inspection_id_local}</Text>
              {enEchec && item.derniere_erreur ? <Text style={styles.erreur}>{item.derniere_erreur}</Text> : null}

              {enEchec && (
                <View style={styles.actions}>
                  {item.type_action === 'valider' && (
                    <TouchableOpacity style={styles.action} onPress={() => rouvrir(item)}>
                      <Text style={styles.actionTexte}>Rouvrir l'inspection</Text>
                    </TouchableOpacity>
                  )}
                  {item.type_action !== 'creer_inspection' && (
                    <TouchableOpacity style={styles.action} onPress={() => confirmerAbandon(item)}>
                      <Text style={[styles.actionTexte, { color: theme.colors.danger }]}>Abandonner</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.colors.bgPage },
  entete: { padding: 14, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  resume: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 10 },
  bouton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  boutonTexte: { color: '#fff', fontWeight: '700' },
  vide: { textAlign: 'center', color: theme.colors.success, fontWeight: '700', marginTop: 40 },
  carte: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titre: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, flex: 1 },
  badge: { fontSize: 11.5, fontWeight: '700' },
  detail: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  erreur: { fontSize: 12, color: theme.colors.danger, marginTop: 6, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: theme.radius.sm, backgroundColor: theme.colors.neutralSoft },
  actionTexte: { fontWeight: '700', fontSize: 12.5, color: theme.colors.textPrimary },
})
