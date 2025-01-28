import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const PrivacyPolicyScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.updatedText}>Updated on: 12/12/2024</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.paragraph}>
          Welcome to GlobalConnect. We are committed to protecting your privacy
          and ensuring the security of your personal information. This Privacy
          Policy outlines how we collect, use, and safeguard your data.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Personal Information:</Text> When you
          register, we collect information such as your name, email address,
          and location.{"\n"}
          • <Text style={styles.bold}>Usage Data:</Text> We collect data on how
          you interact with our app, including features used and content
          viewed.{"\n"}
          • <Text style={styles.bold}>Device Information:</Text> Information
          about your device, including IP address, browser type, and operating
          system.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>To Provide Services:</Text> We use your
          information to operate and maintain the app.{"\n"}
          • <Text style={styles.bold}>To Improve our Services:</Text>{" "}
          Understanding how users interact with GlobalConnect helps us enhance
          user experience.{"\n"}
          • <Text style={styles.bold}>To Communicate with You:</Text> We may
          send updates, newsletters, or promotional materials.
        </Text>

        <Text style={styles.sectionTitle}>
          4. Information Sharing and Disclosure
        </Text>
        <Text style={styles.paragraph}>
          GlobalConnect does not sell, trade, or rent your personal information
          to third parties. We may share information with service providers who
          assist in operating our app, provided they agree to keep this
          information confidential.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your data.
          However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>6. User Rights</Text>
        <Text style={styles.paragraph}>
          • <Text style={styles.bold}>Access:</Text> You can request access to
          your personal data.{"\n"}
          • <Text style={styles.bold}>Correction:</Text> You can request
          corrections to any inaccurate or incomplete data.{"\n"}
          • <Text style={styles.bold}>Deletion:</Text> You can request the
          deletion of your personal data, subject to certain legal obligations.
        </Text>

        <Text style={styles.sectionTitle}>7. Changes to This Privacy Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy periodically. We will notify you of
          any changes by posting the new Privacy Policy on this page.
        </Text>

        <Text style={styles.sectionTitle}>8. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy, please contact us
          at <Text style={styles.email}>support@globalconnect.com</Text>.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    padding: 16,
  },
  updatedText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  email: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});

export default PrivacyPolicyScreen;
