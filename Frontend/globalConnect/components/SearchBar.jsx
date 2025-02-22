import { StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';

const SearchBar = ({ searchQuery, setSearchQuery }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={theme.colors.gray} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search..."
        placeholderTextColor={theme.colors.gray}
        value={searchQuery}
        onChangeText={setSearchQuery}
        clearButtonMode="always"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color={theme.colors.gray} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    marginHorizontal: wp(4),
    marginBottom: hp(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    marginRight: wp(2),
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.black,
  },
  clearIcon: {
    marginLeft: wp(2),
  },
});
