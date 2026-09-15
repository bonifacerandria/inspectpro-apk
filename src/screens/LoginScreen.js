import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../context/authStore'
import { theme } from '../styles/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const login = useAuthStore((s) => s.login)
  const chargement = useAuthStore((s) => s.chargement)
  const erreur = useAuthStore((s) => s.erreur)

  return (
    <View style={styles.conteneur}>
      <View style={styles.logoMark}><Text style={styles.logoText}>IP</Text></View>
      <Text style={styles.titre}>InspectPro</Text>
      <Text style={styles.sousTitre}>Connexion — inspecteur terrain</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        secureTextEntry
        value={motDePasse}
        onChangeText={setMotDePasse}
      />

      {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}

      <TouchableOpacity
        style={styles.bouton}
        disabled={chargement}
        onPress={() => login(email, motDePasse)}
      >
        {chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonTexte}>Se connecter</Text>}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: theme.colors.bgPage },
  logoMark: {
    width: 52, height: 52, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20, alignSelf: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  titre: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: theme.colors.navy900 },
  sousTitre: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: theme.colors.borderStrong, borderRadius: theme.radius.md,
    padding: 12, marginBottom: 12, backgroundColor: theme.colors.surface, fontSize: 15,
  },
  bouton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 6 },
  boutonTexte: { color: '#fff', fontWeight: '700', fontSize: 15 },
  erreur: { color: theme.colors.danger, fontSize: 13, marginBottom: 8, fontWeight: '600' },
})
