import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import Icon from "../assets/icons/index";
import { theme } from "../constants/theme";
import { userAuth } from "../contexts/AuthContext";
import Avator from "./Avator";
import config from "../constants/config";

const navItems = [
  { label: "Home", icon: "home", route: "/home" },
  { label: "Notification", icon: "heart", route: "/notification" },
  { label: "Add Post", icon: "plus", route: "/addPost" },
  { label: "Message", icon: "mail", route: "/message" },
  { label: "Profile", icon: "user", route: "/profile" },
];

const BottomNav = () => {
  const ip = config.API_IP;
  const router = useRouter();
  const pathname = usePathname();
  const { user } = userAuth();

  // console.log('user: ',user)
  // Check if user has a profile image
  const profileImageURL = user?.profile_image ? `http://${ip}:3000/${user.profile_image}` : null;
  // console.log('checking profile image', profileImageURL);

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.navItem}
          onPress={() => router.push(item.route)}
        >
          {item.label === "Profile" && profileImageURL ? (
            // If the user has a profile image, use the Avator component with the profile image URL
            <Avator uri={profileImageURL} size={28} />
          ) : (
            // If no profile image, show the default user icon
            <Icon
              name={item.icon}
              size={28}
              color={pathname === item.route ? theme.colors.primary : theme.colors.gray}
            />
          )}
          <Text
            style={[
              styles.navItemText,
              {
                color: pathname === item.route
                  ? theme.colors.primary
                  : 'black', // Set the color to black for non-selected items
              },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  bottomNav: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray,
    backgroundColor: theme.colors.white,
  },
  navItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  navItemText: {
    fontSize: 10,
    marginTop: 2,
  },
});
