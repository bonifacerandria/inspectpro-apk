"""Prépare app.json pour la génération de l'APK (idempotent, conserve le reste du fichier)."""
import json

CHEMIN = "app.json"
with open(CHEMIN, encoding="utf-8") as f:
    d = json.load(f)

e = d.setdefault("expo", {})
e["name"] = "InspectPro"
e["slug"] = "inspectpro"
e["version"] = "1.0.0"

android = e.setdefault("android", {})
android["package"] = "mg.bmoi.inspectpro"      # identifiant unique de l'app — à NE PLUS changer une fois publiée
android["permissions"] = ["CAMERA"]

plugins = e.setdefault("plugins", [])
plugins[:] = [
    p for p in plugins
    if not (p == "expo-image-picker" or (isinstance(p, list) and p and p[0] == "expo-image-picker"))
]
plugins.append([
    "expo-image-picker",
    {
        "cameraPermission": "InspectPro utilise l'appareil photo pour photographier les équipements inspectés.",
        "microphonePermission": False,
    },
])

with open(CHEMIN, "w", encoding="utf-8") as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("app.json mis à jour.")
