import { useEffect, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'

/**
 * Hook simple exposant l'état de connectivité en temps réel. Utilisé pour :
 *  - décider si une action part directement en API ou va dans la file
 *    d'attente locale (Phase 3.3)
 *  - déclencher la synchronisation automatique au retour du réseau
 *    (Phase 3.7)
 */
export function useReseau() {
  const [estConnecte, setEstConnecte] = useState(true)

  useEffect(() => {
    const desabonner = NetInfo.addEventListener((etat) => {
      setEstConnecte(Boolean(etat.isConnected && etat.isInternetReachable !== false))
    })
    return () => desabonner()
  }, [])

  return estConnecte
}
