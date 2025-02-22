import { StyleSheet, View, TouchableOpacity, FlatList, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import config from '../constants/config';

const ip = config.API_IP;

const SortCategory = ({ selectedCategory, setSelectedCategory }) => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`http://${ip}:3000/api/category/all`)
      .then((response) => response.json())
      .then((data) => {
        if (data.categories) {
          // Assume each category has an _id and name.
          // Prepend the "All" option manually.
          setCategories([{ _id: "All", name: "All" }, ...data.categories]);
        }
      })
      .catch((error) => console.error('Error fetching categories:', error));
  }, []);

  const handleCategoryPress = (category) => {
    if (category._id === 'All') {
      // Reset to "All" when "All" is tapped.
      setSelectedCategory("All");
    } else {
      // If "All" is currently selected, start a new array with the tapped category.
      if (selectedCategory === "All") {
        setSelectedCategory([category._id]);
      } else {
        // Toggle: remove if already selected, or add if not.
        if (selectedCategory.includes(category._id)) {
          const updated = selectedCategory.filter(id => id !== category._id);
          // If no category remains, revert to "All"
          setSelectedCategory(updated.length ? updated : "All");
        } else {
          setSelectedCategory([...selectedCategory, category._id]);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const isSelected =
            selectedCategory === "All"
              ? item._id === "All"
              : selectedCategory.includes(item._id);
          return (
            <TouchableOpacity
              style={[styles.categoryButton, isSelected && styles.selectedCategory]}
              onPress={() => handleCategoryPress(item)}
            >
              <Text style={[styles.categoryText, isSelected && styles.selectedText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default SortCategory;

const styles = StyleSheet.create({
  container: {
    marginVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  categoryButton: {
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 20,
    backgroundColor: theme.colors.lightGray,
    marginRight: wp(2),
  },
  selectedCategory: {
    backgroundColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.black,
  },
  selectedText: {
    color: theme.colors.white,
  },
});
