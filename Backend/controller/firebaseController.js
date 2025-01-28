const admin = require('firebase-admin');
const User = require('../models/userSchema')
admin.initializeApp({
  credential: admin.credential.cert(require('../service-account-key.json')),
});

const sendFirebaseNotification = async (userId, title, body) => {
    const user = await User.findById(userId);
  
    if (!user || !user.firebaseToken) {
      console.log('User does not have a Firebase token.');
      return;
    }
  
    const message = {
      token: user.firebaseToken,
      notification: {
        title,
        body,
      },
    };
  
    try {
      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  

module.exports = { sendFirebaseNotification };
