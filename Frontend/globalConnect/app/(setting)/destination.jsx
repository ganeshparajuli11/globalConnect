import React, { useState, useEffect } from 'react';
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
import { theme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Popular countries to show initially with ISO code included (in lowercase)
const POPULAR_COUNTRIES = [
  { name: 'United States', code: 'us', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'gb', flag: '🇬🇧' },
  { name: 'Canada', code: 'ca', flag: '🇨🇦' },
  { name: 'Australia', code: 'au', flag: '🇦🇺' },
  { name: 'Germany', code: 'de', flag: '🇩🇪' },
  { name: 'France', code: 'fr', flag: '🇫🇷' },
];

const Destination = () => {
  const ip = config.API_IP;
  const router = useRouter();

  // countries: full list of countries from API (each with { name, code, flag })
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  // Cities remain as strings
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  // selectedCountry is now an object rather than a string
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showPopularCountries, setShowPopularCountries] = useState(true);

  // Fetch countries from public API
  useEffect(() => {
    setLoading(true);
    fetch('https://restcountries.com/v3.1/all')
      .then((response) => response.json())
      .then((data) => {
        // Map API response to our desired format: name, code (cca2), and flag emoji
        const countryList = data.map((country) => ({
          name: country.name.common,
          code: country.cca2 ? country.cca2.toLowerCase() : '', // ensure lowercase
          flag: country.flag || '🏳️',
        }));
        // Sort countries alphabetically by name
        countryList.sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching countries:', error);
        setLoading(false);
      });
  }, []);

  // Fetch cities based on the selected country (using country name)
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
        // Add a "None" option at the beginning and sort the list
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

  // Handle country selection: store the entire country object and update UI
  const handleCountryChange = (countryObj) => {
    setSelectedCountry(countryObj);
    setCountrySearch(countryObj.name); // Update search box with selected country name
    setFilteredCountries([]); // Collapse suggestions
    setSelectedCity(''); // Reset city selection
    setCitySearch('');
    fetchCities(countryObj.name);
  };

  // Handle city selection
  const handleCityChange = (city) => {
    setSelectedCity(city);
    setCitySearch(city); // Update search box with selected city
    setFilteredCities([]); // Collapse suggestions
  };

  // Filter countries based on user input
  const filterCountries = (text) => {
    setCountrySearch(text);
    setShowPopularCountries(text.length === 0);
    if (text.length > 0) {
      const filtered = countries
        .filter((country) =>
          country.name.toLowerCase().includes(text.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 results
      setFilteredCountries(filtered);
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

  // Handle destination submission by sending both the country name and ISO code to the backend.
  const handleSubmit = async () => {
    if (!selectedCountry) {
      alert('Please select a country.');
      return;
    }
    const accessToken = await AsyncStorage.getItem('authToken');
    const destination = {
      destination_country: `${selectedCountry.name}${
        selectedCity && selectedCity !== 'None' ? `, ${selectedCity}` : ''
      }`,
      destination_flag: selectedCountry.code, // ISO code from the selected country
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

  // Render a country item (for both popular countries and search results)
  const renderCountryItem = (item) => (
    <TouchableOpacity
      key={item.name}
      style={styles.countryItem}
      onPress={() => handleCountryChange(item)}
    >
      <Text style={styles.flagEmoji}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton size={24} />
          <Text style={styles.headerTitle}>Select Destination</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* Country Selection Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Where would you like to go?</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChangeText={filterCountries}
                  placeholderTextColor={theme.colors.textLight}
                />
              </View>

              {/* Popular Countries or Search Results */}
              <View style={styles.resultsContainer}>
                {showPopularCountries ? (
                  <>
                    <Text style={styles.sectionSubtitle}>Popular Destinations</Text>
                    {POPULAR_COUNTRIES.map((country) => renderCountryItem(country))}
                  </>
                ) : (
                  filteredCountries.map((country) => renderCountryItem(country))
                )}
              </View>
            </View>

            {/* City Selection Section */}
            {selectedCountry && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select a City</Text>
                <View style={styles.searchContainer}>
                  <Ionicons name="location" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search cities..."
                    value={citySearch}
                    onChangeText={filterCities}
                    placeholderTextColor={theme.colors.textLight}
                  />
                </View>

                {citySearch.length > 0 && (
                  <View style={styles.resultsContainer}>
                    {filteredCities.slice(0, 5).map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={styles.cityItem}
                        onPress={() => handleCityChange(city)}
                      >
                        <Ionicons name="location-outline" size={20} color={theme.colors.textLight} />
                        <Text style={styles.cityName}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Next Button */}
            <Button
              title={selectedCountry ? 'Continue' : 'Select a Country'}
              onPress={handleSubmit}
              buttonStyle={styles.nextButton}
              textStyle={styles.nextButtonText}
              loading={false}
              hasShadow={true}
              disabled={!selectedCountry}
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
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginRight: 32,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textDark,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.gray,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: '500',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray,
  },
  cityName: {
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.textDark,
    fontWeight: '500',
  },
  nextButton: {
    margin: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loader: {
    marginTop: 50,
  },
});
