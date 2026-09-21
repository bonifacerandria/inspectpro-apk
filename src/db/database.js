import * as SQLite from 'expo-sqlite'

/**
 * Base SQLite locale — cœur du mode hors-ligne.
 *
 * Principe "local-first" : TOUTE saisie (création d'inspection, réponse à
 * un point de contrôle, photo, validation, changement de statut) est
 * d'abord écrite ici, que le réseau soit disponible ou non. Chaque écriture
 * ajoute aussi une entrée dans `file_synchro`. Le moteur de synchro
 * (syncEngine.js) rejoue ensuite cette file vers l'API, dans l'ordre,
 * automatiquement au retour du réseau ou via le bouton manuel.
 *
 * Ça unifie complètement le flux : aucune branche "si en ligne -> API
 * directe, sinon -> local" dans les écrans. Une inspection créée alors
 * qu'on est en ligne passe simplement par une synchro quasi instantanée.
 */

let dbPromise = null

export function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('inspectpro.db')
  }
  return dbPromise
}

export async function initialiserDb() {
  const db = await getDb()

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Cache du formulaire dynamique par type d'équipement (sections +
    -- points de contrôle + photos/documents/essais requis) — le même JSON
    -- que renvoie GET /types-equipement/{id}/formulaire, pour pouvoir
    -- démarrer/continuer une inspection sans réseau.
    CREATE TABLE IF NOT EXISTS formulaires_cache (
      type_equipement_id INTEGER PRIMARY KEY,
      json TEXT NOT NULL,
      maj_le TEXT NOT NULL
    );

    -- Cache des équipements accessibles à l'inspecteur (pour pouvoir choisir
    -- un équipement et démarrer une inspection hors réseau).
    CREATE TABLE IF NOT EXISTS equipements_cache (
      id INTEGER PRIMARY KEY,
      type_equipement_id INTEGER NOT NULL,
      json TEXT NOT NULL,
      maj_le TEXT NOT NULL
    );

    -- Inspections : id_local = identifiant local, toujours présent.
    -- id_serveur = rempli une fois synchronisée (POST /inspections rejoué).
    CREATE TABLE IF NOT EXISTS inspections_locales (
      id_local INTEGER PRIMARY KEY AUTOINCREMENT,
      id_serveur INTEGER,
      equipement_id INTEGER NOT NULL,
      statut TEXT NOT NULL DEFAULT 'en_cours',
      conclusion TEXT,
      date_inspection TEXT NOT NULL,
      cree_le TEXT NOT NULL,
      maj_le TEXT NOT NULL
    );

    -- Une ligne par point de contrôle déjà répondu, par inspection locale.
    -- upsert sur (inspection_id_local, point_controle_id), comme côté API.
    CREATE TABLE IF NOT EXISTS reponses_locales (
      id_local INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id_local INTEGER NOT NULL,
      point_controle_id INTEGER NOT NULL,
      statut TEXT,
      valeur_texte TEXT,
      valeur_nombre REAL,
      valeur_choix TEXT,
      commentaire TEXT,
      maj_le TEXT NOT NULL,
      UNIQUE(inspection_id_local, point_controle_id)
    );

    -- Photos prises hors-ligne (ou en ligne, peu importe) : le fichier vit
    -- dans le stockage de l'app (expo-file-system), cette table ne garde
    -- que la référence + son état de synchro.
    CREATE TABLE IF NOT EXISTS photos_locales (
      id_local INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id_local INTEGER NOT NULL,
      photographiable_type TEXT NOT NULL,     -- 'photo_obligatoire' | 'reponse_controle'
      photographiable_id INTEGER,             -- id serveur direct si connu (photo_obligatoire)
      point_controle_id INTEGER,              -- pour résoudre l'id serveur d'une réponse après coup
      uri_fichier TEXT NOT NULL,
      libelle TEXT,
      synchronise INTEGER NOT NULL DEFAULT 0,
      cree_le TEXT NOT NULL
    );

    -- File d'attente de synchronisation : une ligne = une action à rejouer
    -- vers l'API, dans l'ordre (id croissant = ordre chronologique).
    CREATE TABLE IF NOT EXISTS file_synchro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_action TEXT NOT NULL,     -- creer_inspection | reponse | photo | valider | statut
      inspection_id_local INTEGER NOT NULL,
      reference_id INTEGER,          -- id_local de la ligne concernée (photos_locales.id_local...)
      payload_json TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'en_attente',  -- en_attente | echec | termine
      tentatives INTEGER NOT NULL DEFAULT 0,
      derniere_erreur TEXT,
      cree_le TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reponses_inspection ON reponses_locales(inspection_id_local);
    CREATE INDEX IF NOT EXISTS idx_photos_inspection ON photos_locales(inspection_id_local);
    CREATE INDEX IF NOT EXISTS idx_synchro_statut ON file_synchro(statut);
  `)
}
