import { View, StyleSheet, Platform, StatusBar } from 'react-native'
import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ScreenWrapper = ({ children, bg = '#F7F8FA' }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
        }
      ]}
    >
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <View
        style={[
          styles.content,
          {
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }
        ]}
      >
        {children}
      </View>
    </View>
  )
}

export default ScreenWrapper

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  }
});