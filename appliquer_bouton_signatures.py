
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
from pathlib import Path

# Fichier à modifier
chemin = Path("src/screens/InspectionDetailScreen.js")

# Emplacement où insérer le bouton
ancre = "{/* Conclusion + actions */}"

# Code du bouton Signatures
bloc = """        {/* Signatures */}
        <TouchableOpacity
          style={styles.carte}
          onPress={() => navigation.navigate('Signatures', { idLocal })}
        >
          <Text
            style={{
              fontWeight: '800',
              color: theme.colors.navy900
            }}
          >
            Signatures (inspecteur / client)
          </Text>

          <Text
            style={{
              fontSize: 12,
              color: theme.colors.textSecondary,
              marginTop: 2
            }}
          >
            À faire avant de valider l'inspection
          </Text>
        </TouchableOpacity>

"""

def main():
    # Vérifier l'existence du fichier
    if not chemin.is_file():
        print(f"ERREUR : fichier introuvable : {chemin}")
        print("Vérifiez que vous êtes dans le répertoire du projet.")
        sys.exit(1)

    # Lire le fichier en UTF-8
    try:
        with chemin.open("r", encoding="utf-8") as fichier:
            src = fichier.read()
    except (OSError, UnicodeError) as erreur:
        print(f"ERREUR lors de la lecture : {erreur}")
        sys.exit(1)

    # Éviter une insertion en double
    if "navigate('Signatures'" in src:
        print("Déjà appliqué : le bouton Signatures existe.")
        sys.exit(0)

    # Vérifier la présence de l'ancre
    if ancre not in src:
        print(f"ERREUR : ancre introuvable : {ancre}")
        print("Aucune modification effectuée.")
        sys.exit(1)

    # Créer une sauvegarde avant modification
    sauvegarde = chemin.with_suffix(".js.bak")

    try:
        with sauvegarde.open("w", encoding="utf-8") as fichier:
            fichier.write(src)

        # Insérer le bouton une seule fois
        nouveau_src = src.replace(
            ancre,
            bloc + "        " + ancre,
            1
        )

        with chemin.open("w", encoding="utf-8") as fichier:
            fichier.write(nouveau_src)

    except OSError as erreur:
        print(f"ERREUR lors de la modification : {erreur}")
        sys.exit(1)

    print("SUCCÈS : bouton Signatures ajouté.")
    print(f"Fichier modifié : {chemin}")
    print(f"Sauvegarde créée : {sauvegarde}")


if __name__ == "__main__":
    main()
