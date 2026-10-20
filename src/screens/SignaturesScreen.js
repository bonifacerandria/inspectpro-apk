import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, Modal, ScrollView, StyleSheet } from 'react-native'
import { lireInspectionLocale } from '../db/inspectionsLocales'
import { listerSignaturesLocales, enregistrerSignatureLocale } from '../db/signaturesLocales'
import { conserverPhoto } from '../utils/stockagePhotos'
import { synchroniser } from '../services/syncEngine'
import { useAuthStore } from '../context/authStore'
import { theme } from '../styles/theme'
import BandeauSynchro from '../components/BandeauSynchro'
import PadSignature from '../components/PadSignature'

const SIGNATAIRES = [
  { type: 'inspecteur', titre: 'Inspecteur' },
  { type: 'client', titre: 'Client / Responsable' },
]

export default function SignaturesScreen({ route }) {
  const { idLocal } = route.params
  const user = useAuthStore((s) => s.user)
  const [signatures, setSignatures] = useState({})
  const [noms, setNoms] = useState({ inspecteur: user?.nom || '', client: '' })
  const [modifiable, setModifiable] = useState(true)
  const [typeEnCours, setTypeEnCours] = useState(null) // signataire dont le pad est ouvert
  const minuteur = useRef(null)

  const recharger = useCallback(async () => {
    const [sigs, insp] = await Promise.all([listerSignaturesLocales(idLocal), lireInspectionLocale(idLocal)])
    setSignatures(sigs)
    setModifiable(['en_cours', 'terminee'].includes(insp?.statut))
    setNoms((n) => ({
      inspecteur: sigs.inspecteur?.nom || n.inspecteur,
      client: sigs.client?.nom || n.client,
    }))
  }, [idLocal])

  useEffect(() => {
    recharger()
    return () => clearTimeout(minuteur.current)
  }, [recharger])

  async function surSignature(uriTemporaire) {
    const type = typeEnCours
    setTypeEnCours(null)
    const uri = await conserverPhoto(uriTemporaire) // stockage permanent, comme les photos
    await enregistrerSignatureLocale(idLocal, { type, nom: noms[type].trim(), uriFichier: uri })
    await recharger()
    clearTimeout(minuteur.current)
    minuteur.current = setTimeout(() => { synchroniser().catch(() => {}) }, 1000)
  }

  return (
    <View style={styles.conteneur}>
      <BandeauSynchro />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {!modifiable && <Text style={styles.info}>Cette inspection n'est plus modifiable : les signatures sont verrouillées.</Text>}

        {SIGNATAIRES.map(({ type, titre }) => {
          const sig = signatures[type]
          return (
            <View key={type} style={styles.carte}>
              <Text style={styles.titre}>{titre}</Text>
              <TextInput
                placeholder="Nom du signataire"
                value={noms[type]}
                onChangeText={(v) => setNoms((n) => ({ ...n, [type]: v }))}
                editable={modifiable}
                style={styles.input}
              />
              {sig && (
                <View style={styles.apercu}>
                  <Image source={{ uri: sig.uri_fichier }} style={styles.image} resizeMode="contain" />
                  {!sig.synchronise && <Text style={styles.attente}>⏳ en attente de synchro</Text>}
                </View>
              )}
              {modifiable && (
                <TouchableOpacity
                  style={[styles.bouton, !noms[type].trim() && { opacity: 0.4 }]}
                  disabled={!noms[type].trim()}
                  onPress={() => setTypeEnCours(type)}
                >
                  <Text style={styles.boutonTexte}>{sig ? '✍️ Refaire la signature' : '✍️ Signer'}</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })}
      </ScrollView>

      <Modal visible={!!typeEnCours} animationType="slide" onRequestClose={() => setTypeEnCours(null)}>
        <View style={styles.modal}>
          <Text style={styles.modalTitre}>
            Signature — {SIGNATAIRES.find((s) => s.type === typeEnCours)?.titre}
          </Text>
          <Text style={styles.modalNom}>{typeEnCours ? noms[typeEnCours] : ''}</Text>
          {typeEnCours && <PadSignature onValider={surSignature} onAnnuler={() => setTypeEnCours(null)} />}
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: theme.colors.bgPage },
  info: { color: theme.colors.warning, fontWeight: '600', fontSize: 12.5, marginBottom: 12 },
  carte: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  titre: { fontSize: 14, fontWeight: '800', color: theme.colors.navy900, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 10, fontSize: 14, backgroundColor: theme.colors.surface },
  apercu: { marginTop: 10, backgroundColor: '#fff', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 6 },
  image: { width: '100%', height: 90 },
  attente: { fontSize: 10.5, color: theme.colors.warning, fontWeight: '600', marginTop: 4 },
  bouton: { marginTop: 12, backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  boutonTexte: { color: '#fff', fontWeight: '700' },
  modal: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: theme.colors.bgPage },
  modalTitre: { fontSize: 17, fontWeight: '800', color: theme.colors.navy900 },
  modalNom: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 16 },
})
