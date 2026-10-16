import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { theme, STATUT_CONTROLE } from '../styles/theme'

const OPTIONS_ECHELLE = ['C', 'O', 'NC', 'DM', 'DI', 'NA']

/**
 * Un seul composant qui choisit son rendu selon point.type_reponse
 * (même principe que le web : moteur configurable, aucun cas codé par
 * type d'équipement). Le type 'photo' est géré par <ChampPhoto />.
 */
export default function WidgetReponse({ point, reponse, modifiable, onChanger }) {
  switch (point.type_reponse) {
    case 'conforme_echelle':
      return (
        <View style={styles.ligne}>
          {OPTIONS_ECHELLE.map((code) => {
            const actif = reponse?.statut === code
            const couleur = STATUT_CONTROLE[code].fg
            return (
              <TouchableOpacity
                key={code}
                disabled={!modifiable}
                onPress={() => onChanger({ statut: code })}
                style={[styles.echelle, { borderColor: couleur, backgroundColor: actif ? couleur : 'transparent' }]}
              >
                <Text style={{ color: actif ? '#fff' : couleur, fontWeight: '700', fontSize: 12 }}>{code}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )

    case 'oui_non':
    case 'choix_multiple': {
      const options = point.type_reponse === 'oui_non' ? ['Oui', 'Non'] : point.options || []
      return (
        <View style={[styles.ligne, { flexWrap: 'wrap' }]}>
          {options.map((opt) => {
            const actif = reponse?.valeur_choix === opt
            return (
              <TouchableOpacity
                key={opt}
                disabled={!modifiable}
                onPress={() => onChanger({ valeur_choix: opt })}
                style={[styles.choix, actif && styles.choixActif]}
              >
                <Text style={{ color: actif ? '#fff' : theme.colors.textPrimary, fontWeight: '600', fontSize: 12.5 }}>{opt}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )
    }

    case 'texte':
      return <Champ init={reponse?.valeur_texte || ''} modifiable={modifiable} multiline onValider={(v) => onChanger({ valeur_texte: v })} />

    case 'nombre':
      return (
        <Champ
          init={reponse?.valeur_nombre != null ? String(reponse.valeur_nombre) : ''}
          modifiable={modifiable} clavier="numeric"
          onValider={(v) => onChanger({ valeur_nombre: v ? Number(v.replace(',', '.')) : null })}
        />
      )

    case 'mesure':
      return (
        <View>
          <Champ
            init={reponse?.valeur_nombre != null ? String(reponse.valeur_nombre) : ''}
            modifiable={modifiable} clavier="numeric" placeholder={point.unite_mesure || ''}
            onValider={(v) => onChanger({ valeur_nombre: v ? Number(v.replace(',', '.')) : null })}
          />
          {point.valeur_nominale ? <Text style={styles.aide}>Nominal : {point.valeur_nominale} {point.unite_mesure}</Text> : null}
        </View>
      )

    default:
      return null
  }
}

function Champ({ init, modifiable, onValider, multiline, clavier, placeholder }) {
  const [valeur, setValeur] = useState(init)
  return (
    <TextInput
      value={valeur}
      onChangeText={setValeur}
      onBlur={() => onValider(valeur)}
      editable={modifiable}
      multiline={multiline}
      keyboardType={clavier || 'default'}
      placeholder={placeholder}
      style={[styles.input, multiline && { minHeight: 60, textAlignVertical: 'top' }]}
    />
  )
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', gap: 6 },
  echelle: { width: 34, height: 30, borderRadius: theme.radius.sm, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  choix: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.radius.sm, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surface },
  choixActif: { backgroundColor: theme.colors.navy700, borderColor: theme.colors.navy700 },
  input: { borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.sm, paddingHorizontal: 10, paddingVertical: 7, fontSize: 13, backgroundColor: theme.colors.surface, minWidth: 110 },
  aide: { fontSize: 11, color: theme.colors.textMuted, marginTop: 4 },
})
