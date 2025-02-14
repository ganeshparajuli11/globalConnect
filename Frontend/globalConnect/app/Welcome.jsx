import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import React, { useEffect, useReducer, useState } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import { hp, wp } from "../helpers/common";
import Button from "../components/Button";
import { theme } from "../constants/theme";
import { useRouter } from "expo-router";

const Welcome = () => {
    const router = useRouter();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 200);

    return () => clearInterval(dotsInterval);
  }, []);

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />

      <View style={styles.container}>
        {/* Welcome Image */}
        <Image
          source={require("../assets/images/welcome.png")}
          style={styles.welcomeImage}
          resizeMode="contain"
        />

        {/* App Title */}
        <Text style={styles.title}>
          <Text style={styles.global}>Global</Text>
          <Text style={styles.connect}>Connect</Text>
        </Text>

        {/* Tagline with animated dots */}
        <Text style={styles.tagline}>No more stress{dots}</Text>
      </View>

      {/* Footer Button */}
      <View style={styles.footer}>
        <Button
          title="Get Started"
          buttonStyle={{ marginHorizontal: wp(3) }}
          onPress={() => router.push('signUp')}
        />
      </View>

      <View style={styles.bottomTextContainer}>
        <Text style={styles.loginText}>Already have an account !</Text>
        <Pressable onPress={() => router.push('login')}>
          <Text style={[styles.loginText, {color: theme.colors.primary, fontWeight:theme.fonts.semibold}]}>Login</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: wp(5),
  },
  welcomeImage: {
    width: wp(80),
    height: hp(30),
    marginBottom: hp(3),
  },
  title: {
    fontSize: wp(7),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: hp(1), // Added margin for spacing
  },
  global: {
    color: "#4F46E5",
  },
  connect: {
    color: "#000",
  },
  tagline: {
    marginTop: hp(2),
    fontSize: wp(4),
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: wp(5), // Added horizontal padding to prevent text squishing
  },
  footer: {
    position: "absolute",
    bottom: hp(10),
    width: "100%",
    alignItems: "center",
  },
  bottomTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
  },
  loginText: {
    textAlign: "center",
    color: theme.colors.text,
    fontSize: hp(1.6),
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default Welcome;
