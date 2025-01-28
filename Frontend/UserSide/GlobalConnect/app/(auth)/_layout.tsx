import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

export default function _layout() {
  return (
    <Stack screenOptions={{headerShown:false}}>
        <Stack.Screen name = "index"/>
        <Stack.Screen name = "login"/>
        <Stack.Screen name = "signup"/>
        <Stack.Screen name = "destination"/>
        <Stack.Screen name = "SendEmail"/>
        <Stack.Screen name = "EnterOTP"/>
        <Stack.Screen name = "ConfirmPassword"/>


    </Stack>
  )
}