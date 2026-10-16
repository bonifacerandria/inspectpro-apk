import { useEffect, useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { obtenirEquipements } from '../api/equipements'
import { creerInspectionLocale } from '../db/inspectionsLocales'
import { synchroniser } from '../services/syncEngine'
import { theme } from '../styles/theme'
import BandeauSynchro from '../components/BandeauSynchro'

export default function EquipementsScreen({ navigation }) {
  const [equipements, setEquipements] = useState([])
  const [depuisCache, setDepuisCache] = useState(false)
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    obtenirEquipements().then(({ equipements: liste, depuisCache: cache }) => {
      setEquipements(liste)
      setDepuisCache(cache)
      setChargement(false)
    })
  }, [])

  async function demarrer(equipement) {
    const idLocal = await creerInspectionLocale(equipement.id)
    synchroniser().catch(() => {}) // si en ligne, l'inspection est créée côté serveur tout de suite
    navigation.replace('InspectionDetail', { idLocal })
  }

  const q = recherche.trim().toLowerCase()
  const filtres = q
    ? equipements.filter((e) =>
        [e.type_equipement?.libelle, e.site?.client?.nom, e.site?.nom, e.numero_serie, e.marque, e.modele]
          .filter(Boolean).join(' ').toLowerCase().includes(q))
    : equipements

  return (
    <View style={styles.conteneur}>
      <BandeauSynchro />
      <View style={{ padding: 14, paddingBottom: 4 }}>
        <TextInput placeholder="Rechercher (type, client, n° série…)" value={recherche} onChangeText={setRecherche} style={styles.recherche} />
        {depuisCache && <Text style={styles.avertissement}>Liste issue du cache local (hors-ligne ou serveur injoignable).</Text>}
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={theme.colors.accent} />
      ) : (
        <FlatList
          data={filtres}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={{ padding: 14 }}
          ListEmptyComponent={<Text style={styles.vide}>Aucun équipement disponible. Connecte-toi une première fois au réseau pour les charger.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.carte} onPress={() => demarrer(item)}>
              <Text style={styles.titre}>{item.type_equipement?.libelle}</Text>
              <Text style={styles.sousTitre}>{item.site?.client?.nom} — {item.site?.nom}</Text>
              <Text style={styles.detail}>
                {[item.marque, item.modele].filter(Boolean).join(' ') || '—'} · N° {item.numero_serie || '—'}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.colors.bgPage },
  recherche: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 11, backgroundColor: theme.colors.surface, fontSize: 14 },
  avertissement: { fontSize: 11.5, color: theme.colors.warning, marginTop: 6, fontWeight: '600' },
  vide: { textAlign: 'center', color: theme.colors.textMuted, marginTop: 40, fontSize: 13, paddingHorizontal: 20 },
  carte: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  titre: { fontSize: 14.5, fontWeight: '700', color: theme.colors.textPrimary },
  sousTitre: { fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 2 },
  detail: { fontSize: 11.5, color: theme.colors.textMuted, marginTop: 3 },
})
