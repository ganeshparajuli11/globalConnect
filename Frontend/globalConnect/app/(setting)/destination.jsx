import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../constants/config';
import Button from '../../components/Button';
import BackButton from '../../components/BackButton';
import ScreenWrapper from '../../components/ScreenWrapper';

const Destination = () => {
  const ip = config.API_IP;
  const router = useRouter();

  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // Fetch countries from public API
  useEffect(() => {
    setLoading(true);
    fetch('https://restcountries.com/v3.1/all')
      .then((response) => response.json())
      .then((data) => {
        const countryList = data.map((country) => ({
          name: country.name.common,
          code: country.cca2,
        }));
        // Sort alphabetically for a better UX
        countryList.sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
        setFilteredCountries(countryList);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching countries:', error);
        setLoading(false);
      });
  }, []);

  // Fetch cities based on the selected country
  const fetchCities = (countryName) => {
    setLoading(true);
    fetch('https://countriesnow.space/api/v0.1/countries/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country: countryName }),
    })
      .then((response) => response.json())
      .then((data) => {
        const cityList = data.data || [];
        // Add a "None" option and sort cities
        const sortedCities = ['None', ...cityList.sort()];
        setCities(sortedCities);
        setFilteredCities(sortedCities);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching cities:', error);
        setLoading(false);
      });
  };

  // Handle country selection
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setCountrySearch(country); // Update search box with selected country
    setFilteredCountries([]); // Collapse country suggestions
    setSelectedCity(''); // Reset city selection
    setCitySearch('');
    fetchCities(country);
  };

  // Handle city selection
  const handleCityChange = (city) => {
    setSelectedCity(city);
    setCitySearch(city); // Update search box with selected city
    setFilteredCities([]); // Collapse city suggestions
  };

  // Filter countries based on user input
  const filterCountries = (text) => {
    setCountrySearch(text);
    if (text.length > 0) {
      setFilteredCountries(
        countries.filter((country) =>
          country.name.toLowerCase().includes(text.toLowerCase())
        )
      );
    } else {
      setFilteredCountries([]);
    }
  };

  // Filter cities based on user input
  const filterCities = (text) => {
    setCitySearch(text);
    if (text.length > 0) {
      setFilteredCities(
        cities.filter((city) =>
          city.toLowerCase().includes(text.toLowerCase())
        )
      );
    } else {
      setFilteredCities([]);
    }
  };

  // Handle destination submission
  const handleSubmit = async () => {
    if (!selectedCountry) {
      alert('Please select a country.');
      return;
    }
    const accessToken = await AsyncStorage.getItem('authToken');
    const destination = {
      destination_country: `${selectedCountry}${
        selectedCity && selectedCity !== 'None' ? `, ${selectedCity}` : ''
      }`,
    };

    axios
      .put(`http://${ip}:3000/api/users/update-destination`, destination, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        alert('Destination updated successfully!');
        router.replace('/home');
      })
      .catch((error) => {
        console.error('Error updating destination:', error);
        alert('Failed to update destination.');
      });
  };

  return (
    <ScreenWrapper>
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton size={24} />
        <Text style={styles.headerTitle}>Select Destination</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : (
        <>
          {/* Country Search Section */}
          <View style={styles.section}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.searchBox}
              placeholder="Search country..."
              value={countrySearch}
              onChangeText={filterCountries}
              placeholderTextColor="#999"
            />
            {/* Show suggestions only when user has started typing */}
            {countrySearch.length > 0 && filteredCountries.length > 0 && (
              <View style={styles.list}>
                {filteredCountries.slice(0, 10).map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => handleCountryChange(item.name)}
                  >
                    <Text style={styles.listItem}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* City Search Section (display only when a country is selected) */}
          {selectedCountry && (
            <View style={styles.section}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.searchBox}
                placeholder="Search city..."
                value={citySearch}
                onChangeText={filterCities}
                placeholderTextColor="#999"
              />
              {citySearch.length > 0 && filteredCities.length > 0 && (
                <View style={styles.list}>
                  {filteredCities.slice(0, 10).map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => handleCityChange(item)}
                    >
                      <Text style={styles.listItem}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Next Button using custom Button component */}
          <Button
            title="Next"
            onPress={handleSubmit}
            buttonStyle={styles.nextButton}
            textStyle={styles.nextButtonText}
          />
        </>
      )}
    </ScrollView>
    </ScreenWrapper>
  );
};

export default Destination;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginRight: 32, // Leaves space for the back button
  },
  loader: {
    marginTop: 50,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  searchBox: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  list: {
    maxHeight: 150,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    fontSize: 16,
    color: '#555',
  },
  nextButton: {
    marginTop: 30,
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 20, // Ensure horizontal padding is sufficient
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flexShrink: 1, // Allow the text to shrink instead of being clipped
  },
});
