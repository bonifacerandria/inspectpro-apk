import { useCallback, useEffect, useRef, useState } from 'react'
import { useReseau } from './useReseau'
import { synchroniser } from '../services/syncEngine'
import { compterEnAttente } from '../db/inspectionsLocales'

/**
 * - Déclenche la synchro automatiquement dès que le réseau REVIENT (pas à
 *   chaque render, seulement sur la transition hors-ligne -> en ligne).
 * - Expose `lancerSynchro()` pour le bouton manuel.
 * - Expose `enAttente` (nombre d'actions non synchronisées) pour un badge.
 */
export function useSyncAuto() {
  const enLigne = useReseau()
  const [enAttente, setEnAttente] = useState(0)
  const [synchroEnCours, setSynchroEnCours] = useState(false)
  const etaitHorsLigne = useRef(!enLigne)

  const rafraichirCompteur = useCallback(async () => {
    setEnAttente(await compterEnAttente())
  }, [])

  const lancerSynchro = useCallback(async () => {
    setSynchroEnCours(true)
    try {
      return await synchroniser()
    } finally {
      setSynchroEnCours(false)
      await rafraichirCompteur()
    }
  }, [rafraichirCompteur])

  useEffect(() => {
    rafraichirCompteur()
  }, [rafraichirCompteur])

  useEffect(() => {
    if (enLigne && etaitHorsLigne.current) {
      lancerSynchro() // retour réseau après une coupure -> synchro auto
    }
    etaitHorsLigne.current = !enLigne
  }, [enLigne, lancerSynchro])

  return { enAttente, synchroEnCours, lancerSynchro, enLigne, rafraichirCompteur }
}
