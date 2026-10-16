import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import {
  lireInspectionLocale, listerReponsesLocales, enregistrerReponseLocale,
  listerPhotosLocales, ajouterPhotoLocale, validerInspectionLocale, changerStatutLocal,
} from '../db/inspectionsLocales'
import { lireEquipementCache } from '../db/cache'
import { obtenirFormulaire } from '../api/formulaire'
import { synchroniser } from '../services/syncEngine'
import { theme, STATUT_INSPECTION, STATUT_CONTROLE } from '../styles/theme'
import BandeauSynchro from '../components/BandeauSynchro'
import WidgetReponse from '../components/WidgetReponse'
import ChampPhoto from '../components/ChampPhoto'

export default function InspectionDetailScreen({ route, navigation }) {
  const { idLocal } = route.params
  const [inspection, setInspection] = useState(null)
  const [equipement, setEquipement] = useState(null)
  const [formulaire, setFormulaire] = useState(null)
  const [reponses, setReponses] = useState({})
  const [photos, setPhotos] = useState([])
  const [conclusion, setConclusion] = useState('')
  const [erreur, setErreur] = useState(null)
  const minuteur = useRef(null)

  const recharger = useCallback(async () => {
    const [insp, reps, phs] = await Promise.all([
      lireInspectionLocale(idLocal), listerReponsesLocales(idLocal), listerPhotosLocales(idLocal),
    ])
    setInspection(insp); setReponses(reps); setPhotos(phs)
    return insp
  }, [idLocal])

  useEffect(() => {
    (async () => {
      try {
        const insp = await recharger()
        const eq = await lireEquipementCache(insp.equipement_id)
        setEquipement(eq)
        if (!eq) throw new Error("Équipement introuvable en cache — rouvre la liste des équipements en ligne.")
        const { formulaire: f } = await obtenirFormulaire(eq.type_equipement_id)
        setFormulaire(f)
        setConclusion(insp.conclusion || '')
        navigation.setOptions({ title: f.type_equipement.libelle })
      } catch (e) {
        setErreur(e.message)
      }
    })()
    return () => clearTimeout(minuteur.current)
  }, [idLocal, recharger, navigation])

  // Synchro différée (1,5 s après la dernière saisie) : envoie au serveur
  // quand on est en ligne, sans lancer une requête à chaque touche.
  function planifierSynchro() {
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => { synchroniser().catch(() => {}) }, 1500)
  }

  async function enregistrer(point, champs) {
    const existant = reponses[point.id] || {}
    // enregistrerReponseLocale écrase toutes les colonnes -> on fusionne avec l'existant
    await enregistrerReponseLocale(idLocal, point.id, {
      statut: existant.statut ?? null,
      valeur_texte: existant.valeur_texte ?? null,
      valeur_nombre: existant.valeur_nombre ?? null,
      valeur_choix: existant.valeur_choix ?? null,
      commentaire: existant.commentaire ?? null,
      ...champs,
    })
    await recharger()
    planifierSynchro()
  }

  async function prendrePhoto(type, { photographiableId, point, libelle }, uri) {
    if (type === 'reponse_controle' && !reponses[point.id]) {
      // La réponse doit exister (localement) pour que la synchro puisse lui rattacher la photo.
      await enregistrerReponseLocale(idLocal, point.id, {})
    }
    await ajouterPhotoLocale(idLocal, {
      type, photographiableIdConnu: photographiableId ?? null,
      pointControleId: point?.id ?? null, uriFichier: uri, libelle,
    })
    await recharger()
    planifierSynchro()
  }

  function confirmer(titre, message, action) {
    Alert.alert(titre, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', onPress: action }])
  }

  if (erreur) return <View style={styles.centre}><Text style={styles.erreur}>{erreur}</Text></View>
  if (!inspection || !formulaire) return <View style={styles.centre}><ActivityIndicator color={theme.colors.accent} /></View>

  const modifiable = inspection.statut === 'en_cours'
  const peutValider = ['en_cours', 'terminee'].includes(inspection.statut)
  const statut = STATUT_INSPECTION[inspection.statut] || STATUT_INSPECTION.en_cours

  const compteurs = { C: 0, O: 0, NC: 0, DM: 0, DI: 0 }
  Object.values(reponses).forEach((r) => { if (compteurs[r.statut] !== undefined) compteurs[r.statut] += 1 })

  const photosDe = (type, cible) =>
    photos.filter((p) => p.photographiable_type === type && (type === 'photo_obligatoire' ? p.photographiable_id === cible : p.point_controle_id === cible))

  return (
    <View style={styles.conteneur}>
      <BandeauSynchro />
      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40 }}>
        {/* En-tête */}
        <View style={styles.carte}>
          <Text style={styles.titre}>{formulaire.type_equipement.libelle}</Text>
          <Text style={styles.sousTitre}>{equipement?.site?.client?.nom} — {equipement?.site?.nom}</Text>
          <View style={[styles.badge, { backgroundColor: statut.fond }]}>
            <Text style={{ color: statut.couleur, fontWeight: '700', fontSize: 11 }}>{statut.label}</Text>
          </View>
        </View>

        {/* Synthèse locale */}
        <View style={[styles.carte, { flexDirection: 'row', justifyContent: 'space-between' }]}>
          {Object.keys(compteurs).map((code) => (
            <View key={code} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: STATUT_CONTROLE[code].fg }}>{compteurs[code]}</Text>
              <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>{code}</Text>
            </View>
          ))}
        </View>

        {/* Points de contrôle par section */}
        {formulaire.sections.map((section) => (
          <View key={section.code} style={styles.carte}>
            <Text style={styles.section}>{section.libelle}</Text>
            {section.points_controle.map((point) => (
              <View key={point.id} style={styles.point}>
                <Text style={styles.libelle}>
                  {point.libelle}{point.obligatoire ? <Text style={{ color: theme.colors.danger }}> *</Text> : null}
                </Text>
                {point.type_reponse === 'photo' ? (
                  <ChampPhoto
                    photos={photosDe('reponse_controle', point.id)}
                    modifiable={modifiable}
                    onPrise={(uri) => prendrePhoto('reponse_controle', { point, libelle: point.libelle }, uri)}
                  />
                ) : (
                  <WidgetReponse point={point} reponse={reponses[point.id]} modifiable={modifiable} onChanger={(c) => enregistrer(point, c)} />
                )}
              </View>
            ))}
          </View>
        ))}

        {/* Photos obligatoires */}
        {formulaire.photos_obligatoires?.length > 0 && (
          <View style={styles.carte}>
            <Text style={styles.section}>Photos obligatoires</Text>
            {formulaire.photos_obligatoires.map((po) => (
              <View key={po.id} style={styles.point}>
                <Text style={styles.libelle}>{po.libelle}</Text>
                <ChampPhoto
                  photos={photosDe('photo_obligatoire', po.id)}
                  modifiable={modifiable}
                  onPrise={(uri) => prendrePhoto('photo_obligatoire', { photographiableId: po.id, libelle: po.libelle }, uri)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Conclusion + actions */}
        {peutValider && (
          <View style={styles.carte}>
            <Text style={styles.section}>Conclusion</Text>
            <TextInput
              value={conclusion} onChangeText={setConclusion} multiline
              placeholder="Laisser vide pour utiliser l'avis calculé automatiquement"
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            />
            {inspection.statut === 'en_cours' && (
              <TouchableOpacity
                style={styles.boutonSecondaire}
                onPress={() => confirmer('Marquer comme terminée ?', 'La saisie des points de contrôle sera verrouillée.', async () => { await changerStatutLocal(idLocal, 'terminee'); await recharger(); planifierSynchro() })}
              >
                <Text style={styles.boutonSecondaireTexte}>✓ Marquer comme terminée</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.boutonPrincipal}
              onPress={() => confirmer("Valider l'inspection ?", 'Une fois validée, elle ne sera plus modifiable. Le serveur vérifiera les photos obligatoires lors de la synchro.', async () => { await validerInspectionLocale(idLocal, conclusion.trim() || null); await recharger(); planifierSynchro() })}
            >
              <Text style={styles.boutonPrincipalTexte}>Valider l'inspection</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.colors.bgPage },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erreur: { color: theme.colors.danger, textAlign: 'center', fontWeight: '600' },
  carte: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  titre: { fontSize: 16, fontWeight: '800', color: theme.colors.navy900 },
  sousTitre: { fontSize: 12.5, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill },
  section: { fontSize: 13, fontWeight: '800', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 },
  point: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 8 },
  libelle: { fontSize: 13.5, color: theme.colors.textPrimary, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 10, fontSize: 13.5, backgroundColor: theme.colors.surface },
  boutonSecondaire: { marginTop: 12, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  boutonSecondaireTexte: { fontWeight: '700', color: theme.colors.textPrimary },
  boutonPrincipal: { marginTop: 10, backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 13, alignItems: 'center' },
  boutonPrincipalTexte: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
})
