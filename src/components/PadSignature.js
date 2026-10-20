import { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, PanResponder, StyleSheet } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { captureRef } from 'react-native-view-shot'
import { theme } from '../styles/theme'

/**
 * Zone de signature tactile. Les traits sont dessinés en SVG ; à la
 * validation la zone est capturée en PNG (fond blanc) et son URI temporaire
 * est transmise à onValider(uri).
 */
export default function PadSignature({ onValider, onAnnuler }) {
  const [traits, setTraits] = useState([])
  const traitsRef = useRef([])
  const zoneRef = useRef(null)

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent
        traitsRef.current = [...traitsRef.current, `M${x},${y} L${x},${y}`]
        setTraits(traitsRef.current)
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent
        const copie = [...traitsRef.current]
        copie[copie.length - 1] += ` L${x},${y}`
        traitsRef.current = copie
        setTraits(copie)
      },
    })
  ).current

  function effacer() {
    traitsRef.current = []
    setTraits([])
  }

  async function valider() {
    const uri = await captureRef(zoneRef, { format: 'png', quality: 1, result: 'tmpfile' })
    onValider(uri)
  }

  return (
    <View>
      <View ref={zoneRef} collapsable={false} style={styles.zone} {...pan.panHandlers}>
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {traits.map((d, i) => (
            <Path key={i} d={d} stroke="#0A1628" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ))}
        </Svg>
        {traits.length === 0 && <Text style={styles.invite}>Signer ici avec le doigt</Text>}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaire} onPress={onAnnuler}><Text style={styles.secondaireTexte}>Annuler</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaire} onPress={effacer}><Text style={styles.secondaireTexte}>Effacer</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.principal, traits.length === 0 && { opacity: 0.4 }]} disabled={traits.length === 0} onPress={valider}>
          <Text style={styles.principalTexte}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  zone: { height: 220, backgroundColor: '#fff', borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  invite: { color: theme.colors.textMuted, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  secondaire: { flex: 1, borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md, padding: 12, alignItems: 'center', backgroundColor: theme.colors.surface },
  secondaireTexte: { fontWeight: '700', color: theme.colors.textPrimary },
  principal: { flex: 1, backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  principalTexte: { color: '#fff', fontWeight: '700' },
})
