import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { theme } from '../constants/theme';
import { Image } from 'expo-image';

const Avator = ({
  uri, size = hp(4.5),
  rounded = theme.radius.md,
  style = {},
}) => {
//   console.log('checking image here uri', uri);

  return (
    <Image
      source={{ uri }}
      transition={100}
      style={[styles.avator, { height: size, width: size, borderRadius: rounded }, style]}  // Changed 'styles' to 'style'
    />
  );
};

export default Avator;

const styles = StyleSheet.create({
  avator: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: theme.colors.darkGray,
  },
});
