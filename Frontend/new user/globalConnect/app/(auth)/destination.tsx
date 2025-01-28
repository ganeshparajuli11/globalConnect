import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ScrollView,
    ActivityIndicator,
    FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import Toast from "react-native-toast-message";

const Destination = () => {
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [loading, setLoading] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [citySearch, setCitySearch] = useState("");
    const router = useRouter();

    const accessToken = localStorage.getItem("authToken");

    // Fetch the list of countries
    useEffect(() => {
        setLoading(true);
        fetch("https://restcountries.com/v3.1/all")
            .then((response) => response.json())
            .then((data) => {
                const countryList = data.map((country) => ({
                    name: country.name.common,
                    code: country.cca2,
                }));
                setCountries(countryList);
                setFilteredCountries(countryList);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching countries:", error);
                setLoading(false);
            });
    }, []);

    // Fetch cities based on selected country
    const fetchCities = (countryName) => {
        setLoading(true);
        fetch("https://countriesnow.space/api/v0.1/countries/cities", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ country: countryName }),
        })
            .then((response) => response.json())
            .then((data) => {
                const cityList = data.data || [];
                setCities(["None", ...cityList]); // Add "None" option
                setFilteredCities(["None", ...cityList]);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching cities:", error);
                setLoading(false);
            });
    };

    // Handle country change
    const handleCountryChange = (country) => {
        setSelectedCountry(country);
        setCountrySearch(country); // Set country name in search box
        setFilteredCountries([]); // Clear country list
        setSelectedCity(""); // Reset city selection
        setCitySearch(""); // Clear city search box
        fetchCities(country);
    };

    // Handle city change
    const handleCityChange = (city) => {
        setSelectedCity(city);
        setCitySearch(city); // Set city name in search box
        setFilteredCities([]); // Clear city list
    };

    // Handle destination submission
    const handleSubmit = () => {
        if (!selectedCountry) {
            Toast.show({
                type: 'success',
                position: 'bottom',
                text1: "updated successfully",
            });
            return;
        }

        const destination = {
            destination_country: `${selectedCountry}, ${selectedCity === "None" ? "" : selectedCity
                }`,
        };

        axios
            .put("http://192.168.18.105:3000/api/users/update-destination", destination, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                toast.success("Destination updated successfully!");
                router.replace("/(tab)");
            })
            .catch((error) => {
                console.error("Error updating destination:", error);
                toast.error("Failed to update destination.");
            });
    };

    // Filter countries based on search
    const filterCountries = (text) => {
        setCountrySearch(text);
        setFilteredCountries(
            countries.filter((country) =>
                country.name.toLowerCase().includes(text.toLowerCase())
            )
        );
    };

    // Filter cities based on search
    const filterCities = (text) => {
        setCitySearch(text);
        setFilteredCities(
            cities.filter((city) => city.toLowerCase().includes(text.toLowerCase()))
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Select Destination</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#000" />
            ) : (
                <>
                    {/* Country Search Box */}
                    <View style={styles.dropdownContainer}>
                        <Text style={styles.label}>Search Country:</Text>
                        <TextInput
                            style={styles.searchBox}
                            placeholder="Type to search country"
                            value={countrySearch}
                            onChangeText={filterCountries}
                        />
                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => handleCountryChange(item.name)}>
                                    <Text style={styles.listItem}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    {/* City Search Box */}
                    {selectedCountry && (
                        <View style={styles.dropdownContainer}>
                            <Text style={styles.label}>Search City:</Text>
                            <TextInput
                                style={styles.searchBox}
                                placeholder="Type to search city"
                                value={citySearch}
                                onChangeText={filterCities}
                            />
                            <FlatList
                                data={filteredCities}
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity onPress={() => handleCityChange(item)}>
                                        <Text style={styles.listItem}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleSubmit}
                        disabled={!selectedCountry}
                    >
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: "#F8F9FA",
        alignItems: "center",
    },
    heading: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    dropdownContainer: {
        width: "100%",
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    searchBox: {
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    listItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    nextButton: {
        marginTop: 20,
        backgroundColor: "#000",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        width: "100%",
    },
    buttonText: {
        fontSize: 16,
        color: "#FFF",
    },
});

export default Destination;
