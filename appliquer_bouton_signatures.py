import sys
chemin = "src/screens/InspectionDetailScreen.js"
ancre = "{/* Conclusion + actions */}"
bloc = """        {/* Signatures */}
        <TouchableOpacity style={styles.carte} onPress={() => navigation.navigate('Signatures', { idLocal })}>
          <Text style={{ fontWeight: '800', color: theme.colors.navy900 }}>✍️ Signatures (inspecteur / client)</Text>
          <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>À faire avant de valider l'inspection</Text>
        </TouchableOpacity>

"""
src = open(chemin, encoding="utf-8").read()
if "navigate('Signatures'" in src:
    print("Déjà appliqué."); sys.exit(0)
if ancre not in src:
    print("Ancre introuvable : ajouter le bouton à la main."); sys.exit(1)
open(chemin, "w", encoding="utf-8").write(src.replace(ancre, bloc + "        " + ancre, 1))
print("Bouton Signatures ajouté.")
