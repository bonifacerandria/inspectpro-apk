import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import { useReseau } from './useReseau'
import { synchroniser } from '../services/syncEngine'
import { compterEnAttente } from '../db/inspectionsLocales'

/**
 * Synchronisation automatique :
 *  - au retour du réseau (transition hors-ligne -> en ligne) ;
 *  - quand l'app revient au premier plan ;
 *  - toutes les 60 s tant qu'il reste des éléments à envoyer ;
 * + bouton manuel (lancerSynchro) et compteur rafraîchi toutes les 4 s
 * (le compteur est partagé entre écrans via la base locale).
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
    const id = setInterval(rafraichirCompteur, 4000)
    return () => clearInterval(id)
  }, [rafraichirCompteur])

  useEffect(() => {
    if (enLigne && etaitHorsLigne.current) lancerSynchro()
    etaitHorsLigne.current = !enLigne
  }, [enLigne, lancerSynchro])

  useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') {
        rafraichirCompteur()
        if (enLigne) lancerSynchro()
      }
    })
    return () => abonnement.remove()
  }, [enLigne, lancerSynchro, rafraichirCompteur])

  useEffect(() => {
    if (!enLigne || enAttente === 0) return
    const id = setInterval(lancerSynchro, 60000)
    return () => clearInterval(id)
  }, [enLigne, enAttente, lancerSynchro])

  return { enAttente, synchroEnCours, lancerSynchro, enLigne, rafraichirCompteur }
}
