import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Image,
  Alert,
} from "react-native";
import moment from "moment";
import RenderHtml from "react-native-render-html";
import { theme } from "../constants/theme";
import Avator from "./Avator";
import Icon from "../assets/icons"; // Ensure this is correctly imported elsewhere.
import VerifiedIcon from "../assets/icons/verifiedIcon";
import { hp } from "../helpers/common";
import config from "../constants/config";
import { userAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useFetchFollowing } from "../services/followFetchService";

// A mapping of many country names to their ISO alpha-2 codes
const countryNameToCode = {
  Afghanistan: "af",
  Albania: "al",
  Algeria: "dz",
  Andorra: "ad",
  Angola: "ao",
  Argentina: "ar",
  Armenia: "am",
  Australia: "au",
  Austria: "at",
  Azerbaijan: "az",
  Bahamas: "bs",
  Bahrain: "bh",
  Bangladesh: "bd",
  Barbados: "bb",
  Belarus: "by",
  Belgium: "be",
  Belize: "bz",
  Benin: "bj",
  Bhutan: "bt",
  Bolivia: "bo",
  Bosnia: "ba",
  Botswana: "bw",
  Brazil: "br",
  Brunei: "bn",
  Bulgaria: "bg",
  Burkina: "bf",
  Burundi: "bi",
  Cambodia: "kh",
  Cameroon: "cm",
  Canada: "ca",
  "Central African Republic": "cf",
  Chad: "td",
  Chile: "cl",
  China: "cn",
  Colombia: "co",
  Comoros: "km",
  Congo: "cg",
  "Costa Rica": "cr",
  Croatia: "hr",
  Cuba: "cu",
  Cyprus: "cy",
  Czechia: "cz",
  Denmark: "dk",
  Djibouti: "dj",
  Dominica: "dm",
  "Dominican Republic": "do",
  Ecuador: "ec",
  Egypt: "eg",
  "El Salvador": "sv",
  "Equatorial Guinea": "gq",
  Eritrea: "er",
  Estonia: "ee",
  Eswatini: "sz",
  Ethiopia: "et",
  Fiji: "fj",
  Finland: "fi",
  France: "fr",
  Gabon: "ga",
  Gambia: "gm",
  Georgia: "ge",
  Germany: "de",
  Ghana: "gh",
  Greece: "gr",
  Grenada: "gd",
  Guatemala: "gt",
  Guinea: "gn",
  "Guinea-Bissau": "gw",
  Guyana: "gy",
  Haiti: "ht",
  Honduras: "hn",
  Hungary: "hu",
  Iceland: "is",
  India: "in",
  Indonesia: "id",
  Iran: "ir",
  Iraq: "iq",
  Ireland: "ie",
  Israel: "il",
  Italy: "it",
  Jamaica: "jm",
  Japan: "jp",
  Jordan: "jo",
  Kazakhstan: "kz",
  Kenya: "ke",
  Kiribati: "ki",
  Kosovo: "xk", // Unofficial code
  Kuwait: "kw",
  Kyrgyzstan: "kg",
  Laos: "la",
  Latvia: "lv",
  Lebanon: "lb",
  Lesotho: "ls",
  Liberia: "lr",
  Libya: "ly",
  Liechtenstein: "li",
  Lithuania: "lt",
  Luxembourg: "lu",
  Madagascar: "mg",
  Malawi: "mw",
  Malaysia: "my",
  Maldives: "mv",
  Mali: "ml",
  Malta: "mt",
  Mauritania: "mr",
  Mauritius: "mu",
  Mexico: "mx",
  Moldova: "md",
  Monaco: "mc",
  Mongolia: "mn",
  Montenegro: "me",
  Morocco: "ma",
  Mozambique: "mz",
  Myanmar: "mm",
  Namibia: "na",
  Nauru: "nr",
  Nepal: "np",
  Netherlands: "nl",
  "New Zealand": "nz",
  Nicaragua: "ni",
  Niger: "ne",
  Nigeria: "ng",
  "North Korea": "kp",
  "North Macedonia": "mk",
  Norway: "no",
  Oman: "om",
  Pakistan: "pk",
  Palau: "pw",
  Panama: "pa",
  "Papua New Guinea": "pg",
  Paraguay: "py",
  Peru: "pe",
  Philippines: "ph",
  Poland: "pl",
  Portugal: "pt",
  Qatar: "qa",
  Romania: "ro",
  Russia: "ru",
  Rwanda: "rw",
  "Saint Kitts and Nevis": "kn",
  "Saint Lucia": "lc",
  "Saint Vincent and the Grenadines": "vc",
  Samoa: "ws",
  "San Marino": "sm",
  "Sao Tome and Principe": "st",
  "Saudi Arabia": "sa",
  Senegal: "sn",
  Serbia: "rs",
  Seychelles: "sc",
  "Sierra Leone": "sl",
  Singapore: "sg",
  Slovakia: "sk",
  Slovenia: "si",
  Solomon: "sb",
  Somalia: "so",
  "South Africa": "za",
  "South Korea": "kr",
  "South Sudan": "ss",
  Spain: "es",
  "Sri Lanka": "lk",
  Sudan: "sd",
  Suriname: "sr",
  Sweden: "se",
  Switzerland: "ch",
  Syria: "sy",
  Taiwan: "tw",
  Tajikistan: "tj",
  Tanzania: "tz",
  Thailand: "th",
  Togo: "tg",
  Tonga: "to",
  "Trinidad and Tobago": "tt",
  Tunisia: "tn",
  Turkey: "tr",
  Turkmenistan: "tm",
  Tuvalu: "tv",
  Uganda: "ug",
  Ukraine: "ua",
  "United Arab Emirates": "ae",
  "United Kingdom": "gb",
  "United States": "us",
  Uruguay: "uy",
  Uzbekistan: "uz",
  Vanuatu: "vu",
  Vatican: "va",
  Venezuela: "ve",
  Vietnam: "vn",
  Yemen: "ye",
  Zambia: "zm",
  Zimbabwe: "zw",
};

const PostCard = ({ item, verifiedStatus, router }) => {
  const { authToken } = userAuth();
  const ip = config.API_IP;

  // States for like, fullscreen image, and share modal
  const [liked, setLiked] = useState(item.liked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [fullScreenVisible, setFullScreenVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Fetch following list for share modal
  const { following, loading: loadingFollowing } = useFetchFollowing();

  const profileImageURL = item?.user?.profile_image
    ? `http://${ip}:3000/${item.user.profile_image}`
    : "https://via.placeholder.com/100";

  const createdAt = moment(item?.time).format("MMM D");
  const contentWidth = Dimensions.get("window").width - 32;


// Helper function to get the flag URL for a country name
const getCountryFlagUrl = (countryName) => {
  if (!countryName) return null;
  const countryKey = Object.keys(countryNameToCode).find(
    (key) => key.toLowerCase() === countryName.trim().toLowerCase()
  );
  if (countryKey) {
    const code = countryNameToCode[countryKey].toLowerCase();
    const url = `https://flagcdn.com/48x36/${code}.png`;
    console.log("Country short code:", code);
    console.log("Generated flag URL:", url);
    return url;
  }
  console.log("No matching country found for:", countryName);
  return null;
};


  const destinationRaw = item.user?.destination || "";
  console.log("checking destinaiton name ", destinationRaw);
  
  let displayDestination = "";
  let flagCountry = "";
  if (destinationRaw) {
    const destinationParts = destinationRaw.split(",");
    flagCountry = destinationParts[0] ? destinationParts[0].trim() : "";
    displayDestination = destinationRaw.trim();
  } else {
    // Fallback to using city if destination is not provided.
    displayDestination = item.user.city ? item.user.city : "";
    flagCountry = "";
  }
  // --- End destination handling ---

  // Handle user press with error handling for missing user ID
  const handleUserPress = async () => {
    try {
      if (!item?.user?.id) {
        console.error("Profile navigation error: User ID is missing", {
          postData: item,
          userId: item?.user?.id,
        });
        return;
      }
      await router.push({
        pathname: "/userProfile",
        params: { userId: item.user.id },
      });
    } catch (error) {
      console.error("Profile navigation error:", {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        userId: item?.user?.id,
        postData: item,
      });
      Alert.alert("Error", "Unable to view profile at this time.");
    }
  };

  // Other handlers remain unchanged
  const openFullScreen = (imageUrl) => {
    if (!imageUrl) return;
    const fullMediaUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `http://${ip}:3000${imageUrl}`;
    setSelectedImage(fullMediaUrl);
    setFullScreenVisible(true);
  };

  const closeFullScreen = () => {
    setFullScreenVisible(false);
    setSelectedImage(null);
  };

  const onLike = async () => {
    const prevLiked = liked;
    const prevLikeCount = likeCount;
    const newLiked = !liked;
    const newLikeCount = likeCount + (liked ? -1 : 1);

    // Optimistic UI update
    setLiked(newLiked);
    setLikeCount(newLikeCount);

    try {
      const url = `http://${ip}:3000/api/post/like-unlike/${item.id}`;
      await axios.put(url, {}, { headers: { Authorization: `Bearer ${authToken}` } });
    } catch (error) {
      console.error(
        "Error toggling like:",
        error.response ? error.response.data : error.message
      );
      setLiked(prevLiked);
      setLikeCount(prevLikeCount);
    }
  };

  const onShare = async () => {
    setShareModalVisible(true);
  };

  const sharePostToUser = async (user) => {
    try {
      const url = `http://${ip}:3000/api/post/share`;
      await axios.post(
        url,
        { postId: item.id, recipientId: user._id },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("Post shared successfully with", user.name);
    } catch (error) {
      console.error(
        "Error sharing post:",
        error.response ? error.response.data : error.message
      );
    }
    setShareModalVisible(false);
  };

  return (
    <View style={[styles.container, styles.shadow]} key={item.id}>
      {/* Header with user info and navigation icon */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={handleUserPress}>
          <Avator size={hp(4.5)} uri={profileImageURL} rounded={theme.radius.md} />
          <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={styles.userNameText}>{item.user.name}</Text>
              {item.user.verified && (
                <VerifiedIcon
                  size={16}
                  color="#1877F2"
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            {/* New location block */}
            <View style={styles.locationContainer}>
              {flagCountry && getCountryFlagUrl(flagCountry) && (
                <Image
                  source={{ uri: getCountryFlagUrl(flagCountry) }}
                  style={styles.flagIcon}
                />
              )}
              <Text style={styles.locationText}>{displayDestination}</Text>
            </View>
            <Text style={styles.postTime}>{createdAt}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/postDetails?postId=${item.id}`)}>
          <Icon
            name="threeDotsHorizontal"
            size={hp(3.4)}
            strokeWidth={3}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Post content */}
      <View style={styles.content}>
        <RenderHtml contentWidth={contentWidth} source={{ html: item.content }} />
      </View>

      {/* Media images */}
      {item.media && item.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {item.media.slice(0, 4).map((mediaUrl, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openFullScreen(mediaUrl)}
              style={styles.mediaItem}
            >
              <Image source={{ uri: mediaUrl }} style={styles.mediaImage} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Fullscreen Modal for images */}
      <Modal visible={fullScreenVisible} transparent={true}>
        <View style={styles.fullScreenContainer}>
          <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} />
          <TouchableOpacity style={styles.closeIcon} onPress={closeFullScreen}>
            <Icon name="cross" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Footer with Like, Comment, and Share buttons */}
      <View style={styles.footer}>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onLike}>
            <Icon
              name="heart"
              size={24}
              fill={liked ? theme.colors.heart : "transparent"}
              color={liked ? theme.colors.heart : theme.colors.textLight}
            />
          </TouchableOpacity>
          <Text style={styles.count}>{likeCount}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={() => router.push(`/postDetails?postId=${item.id}`)}>
            <Icon name="comment" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
          <Text style={styles.count}>{item.commentCount}</Text>
        </View>
        <View style={styles.footerButton}>
          <TouchableOpacity onPress={onShare}>
            <Icon name="share" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Modal */}
      <Modal visible={shareModalVisible} transparent={true} animationType="slide">
        <View style={styles.shareModalContainer}>
          <View style={styles.shareModalContent}>
            <Text style={styles.shareModalTitle}>Share Post With</Text>
            <View style={styles.shareUserList}>
              {loadingFollowing ? (
                <Text style={styles.messageText}>Loading...</Text>
              ) : following.length > 0 ? (
                following.map((user) => (
                  <TouchableOpacity
                    key={user._id}
                    style={styles.shareUserItem}
                    onPress={() => sharePostToUser(user)}
                  >
                    <Text style={styles.shareUserName}>{user.name}</Text>
                    <Text style={styles.shareUserEmail}>{user.email}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.messageText}>No users found</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 15,
    padding: 10,
    borderRadius: theme.radius.xxl * 1.1,
    borderCurve: "continuous",
    backgroundColor: "white",
    elevation: 2,
    borderColor: theme.colors.gray,
    borderWidth: 0.5,
    shadowColor: "#000",
  },
  shadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 10,
    flexDirection: "column",
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userNameText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  flagIcon: {
    width: 20,
    height: 15,
    resizeMode: "contain",
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.gray,
  },
  content: {
    marginTop: 10,
  },
  mediaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    justifyContent: "space-between",
  },
  mediaItem: {
    width: "48%",
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
  },
  closeIcon: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    marginLeft: 5,
    fontSize: 16,
    color: theme.colors.text,
  },
  shareModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  shareModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    padding: 20,
    width: "100%",
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  shareUserItem: {
    paddingVertical: 10,
    borderBottomColor: theme.colors.gray,
    borderBottomWidth: 0.5,
  },
  shareUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  shareUserEmail: {
    fontSize: 14,
    color: theme.colors.gray,
  },
  cancelButton: {
    marginTop: 15,
    alignSelf: "flex-end",
  },
  cancelButtonText: {
    color: theme.colors.textLight,
    fontSize: 16,
  },
});
