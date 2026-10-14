import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { listerInspectionsLocales } from '../db/inspectionsLocales'
import { listerEquipementsCache } from '../db/cache'
import { theme, STATUT_INSPECTION } from '../styles/theme'
import BandeauSynchro from '../components/BandeauSynchro'

export default function InspectionsScreen({ navigation }) {
  const [inspections, setInspections] = useState([])
  const [equipementsParId, setEquipementsParId] = useState({})

  // useFocusEffect plutôt que useEffect : recharge la liste à chaque retour
  // sur cet écran (après avoir créé/modifié une inspection ailleurs).
  useFocusEffect(
    useCallback(() => {
      let annule = false
      async function charger() {
        const [insp, equipements] = await Promise.all([listerInspectionsLocales(), listerEquipementsCache()])
        if (annule) return
        setInspections(insp)
        setEquipementsParId(Object.fromEntries(equipements.map((e) => [e.id, e])))
      }
      charger()
      return () => { annule = true }
    }, [])
  )

  return (
    <View style={styles.conteneur}>
      <BandeauSynchro />

      <View style={styles.entete}>
        <TouchableOpacity style={styles.boutonNouvelle} onPress={() => navigation.navigate('Equipements')}>
          <Text style={styles.boutonNouvelleTexte}>+ Nouvelle inspection</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={inspections}
        keyExtractor={(item) => String(item.id_local)}
        contentContainerStyle={{ padding: 14 }}
        ListEmptyComponent={<Text style={styles.vide}>Aucune inspection pour l'instant.</Text>}
        renderItem={({ item }) => {
          const equipement = equipementsParId[item.equipement_id]
          const statut = STATUT_INSPECTION[item.statut] || STATUT_INSPECTION.en_cours
          return (
            <TouchableOpacity
              style={styles.carte}
              onPress={() => navigation.navigate('InspectionDetail', { idLocal: item.id_local })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.carteTitre}>{equipement?.type_equipement?.libelle || `Équipement #${item.equipement_id}`}</Text>
                <Text style={styles.carteSousTitre}>{equipement?.site?.client?.nom} — {equipement?.site?.nom}</Text>
                <Text style={styles.carteDate}>{item.date_inspection}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.badge, { backgroundColor: statut.fond }]}>
                  <Text style={{ color: statut.couleur, fontWeight: '700', fontSize: 11 }}>{statut.label}</Text>
                </View>
                {!item.id_serveur && (
                  <Text style={styles.nonSynchro}>⏳ non synchronisée</Text>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.colors.bgPage },
  entete: { padding: 14, paddingBottom: 0 },
  boutonNouvelle: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 13, alignItems: 'center' },
  boutonNouvelleTexte: { color: '#fff', fontWeight: '700', fontSize: 14 },
  vide: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40, fontSize: 13 },
  carte: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border,
  },
  carteTitre: { fontSize: 14.5, fontWeight: '700', color: theme.colors.textPrimary },
  carteSousTitre: { fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 2 },
  carteDate: { fontSize: 11.5, color: theme.colors.textMuted, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill },
  nonSynchro: { fontSize: 10, color: theme.colors.warning, fontWeight: '600' },
})
