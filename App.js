import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from './src/context/authStore'
import { initialiserDb } from './src/db/database'
import LoginScreen from './src/screens/LoginScreen'
import AccueilScreen from './src/screens/AccueilScreen'
import InspectionsScreen from './src/screens/InspectionsScreen'
import SplashScreen from './src/screens/SplashScreen'
import { theme } from './src/styles/theme'

const Stack = createNativeStackNavigator()

const optionsEntete = {
  headerShown: true,
  headerStyle: { backgroundColor: theme.colors.navy900 },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
}

export default function App() {
  const [dbPrete, setDbPrete] = useState(false)
  const pretAuDemarrage = useAuthStore((s) => s.pretAuDemarrage)
  const estConnecte = useAuthStore((s) => s.estConnecte())
  const restaurerSession = useAuthStore((s) => s.restaurerSession)

  useEffect(() => {
    Promise.all([initialiserDb(), restaurerSession()]).then(() => setDbPrete(true))
  }, [restaurerSession])

  if (!pretAuDemarrage || !dbPrete) {
    return <SplashScreen />
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {estConnecte ? (
          <>
            <Stack.Screen name="Accueil" component={AccueilScreen} />
            <Stack.Screen
              name="Inspections"
              component={InspectionsScreen}
              options={{ ...optionsEntete, title: 'Mes inspections' }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
