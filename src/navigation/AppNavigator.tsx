import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../store/AuthContext'
import LoginScreen from '../screens/LoginScreen'
import AgendaScreen from '../screens/AgendaScreen'
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen'

const Stack = createStackNavigator()

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#050816', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#4fc3f7" size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: '#050816' } }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Agenda" component={AgendaScreen} />
            <Stack.Screen
              name="Detail"
              component={AppointmentDetailScreen}
              options={{
                presentation: 'card',
                gestureEnabled: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
