import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

export default function useNotificationResponse() {
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 Notification Response Hook Mounted");

    // Handle when user taps on a notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      console.log('🔔 User tapped notification:', data);

      if (data?.screen === 'Chat' && data?.userId) {
        router.push(`/chat?userId=${data.userId}`);
      } else if (data?.screen) {
        router.push(`/${data.screen}`);
      } else {
        console.log("⚠️ No navigation data found in notification.");
      }
    });

    // Log background notifications
    const notificationSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("📩 Background Notification Received:", notification);
    });

    // Cleanup subscriptions on unmount
    return () => {
      console.log("🔄 Cleaning up notification listeners...");
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, []);
}
