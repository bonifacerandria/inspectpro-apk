import { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from './src/context/authStore'
import LoginScreen from './src/screens/LoginScreen'
import AccueilScreen from './src/screens/AccueilScreen'
import SplashScreen from './src/screens/SplashScreen'

const Stack = createNativeStackNavigator()

export default function App() {
  const pretAuDemarrage = useAuthStore((s) => s.pretAuDemarrage)
  const estConnecte = useAuthStore((s) => s.estConnecte())
  const restaurerSession = useAuthStore((s) => s.restaurerSession)

  useEffect(() => {
    restaurerSession()
  }, [restaurerSession])

  if (!pretAuDemarrage) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {estConnecte ? (
          <Stack.Screen name="Accueil" component={AccueilScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
