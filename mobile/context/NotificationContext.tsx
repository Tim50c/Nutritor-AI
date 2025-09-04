// mobile/context/NotificationContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentChange,
  updateDoc,
  doc,
} from "firebase/firestore";

// Configure local notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type Notification = {
  id: string;
  message: string;
  read: boolean;
  title?: string;
  body?: string;
  type?: any;
  createdAt?: any;
};

export type NotificationPreferences = {
  mealReminders: boolean;
  goalMilestones: boolean;
  planRecommendations: boolean;
};

interface NotificationContextType {
  notifications: Notification[];
  hasUnread: boolean;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => void;
  updatePreferences: (newPreferences: Partial<NotificationPreferences>) => void;
  startListening: () => void;
  stopListening: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isFirstLoadRef = useRef(true);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    mealReminders: true,
    goalMilestones: false,
    planRecommendations: true,
  });

  const hasUnread = notifications.some((n) => !n.read);

  // Register for push notifications with Expo
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }
      
      // Get Expo push token
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        console.log('✅ Expo push token:', token);
      } catch (e: any) {
        token = `${e}`;
      }
    } else {
      console.warn('Must use physical device for Push Notifications');
    }

    return token;
  };

  // Setup notification listeners
  useEffect(() => {
    let isMounted = true;

    // Register for push notifications
    registerForPushNotificationsAsync().then(async (token) => {
      if (token && auth.currentUser) {
        // Save token to user document
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          expoPushToken: token,
          platform: Platform.OS,
        });
      }
    });

    // Listen for notification responses (when user taps notification)
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification.request.content.title);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response.notification.request.content.title);
      // You can handle navigation here based on notification data
    });

    return () => {
      isMounted = false;
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Trigger local notification
  const triggerLocalNotification = useCallback(async (notification: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Nutritor AI",
          body: notification.body || "You have a new notification",
          data: notification.type || {},
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      console.log(`✅ Local notification triggered:`, notification.title);
    } catch (error) {
      console.error("❌ Error triggering local notification:", error);
    }
  }, []);

  // Start Firestore listener
  const startListening = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("Cannot start listening: No user is logged in");
      return;
    }

    const uid = currentUser.uid;
    console.log(`🔥 Starting Firestore listener for user:`, uid);
    console.log("📧 User email:", currentUser.email);

    // Stop existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      const notificationsRef = collection(db, "users", uid, "notifications");
      const q = query(notificationsRef, orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(`📱 Firestore snapshot received, changes:`, snapshot.docChanges().length);

          snapshot.docChanges().forEach((change: DocumentChange) => {
            const data = change.doc.data();
            const notification = {
              id: change.doc.id,
              title: data.title,
              body: data.body,
              message: data.message || `${data.title}: ${data.body}`,
              read: data.read || false,
              type: data.type,
              createdAt: data.createdAt,
            };

            if (change.type === "added") {
              console.log("➕ New notification added:", notification.title);

              // Trigger local notification for new notifications (not on first load)
              if (!isFirstLoadRef.current) {
                triggerLocalNotification(notification);
              }
            }
          });

          // Update state with all notifications
          const allNotifications = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              body: data.body,
              message: data.message || `${data.title}: ${data.body}`,
              read: data.read || false,
              type: data.type,
              createdAt: data.createdAt,
            };
          });

          console.log(`📋 Setting ${allNotifications.length} notifications in state`);
          setNotifications(allNotifications);
          isFirstLoadRef.current = false;
        },
        (error) => {
          console.error("❌ Firestore listener error:", error);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up Firestore listener:", error);
    }
  }, [triggerLocalNotification]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log(`🛑 Stopping Firestore listener`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Auto-start listener when user authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(`🚀 User authenticated, starting Firestore listener for:`, user.uid);
        console.log("📧 User email:", user.email);
        isFirstLoadRef.current = true;
        startListening();
      } else {
        console.log(`🚫 User not authenticated, stopping listener`);
        stopListening();
        setNotifications([]);
        isFirstLoadRef.current = true;
      }
    });

    return () => {
      unsubscribeAuth();
      stopListening();
    };
  }, [startListening, stopListening]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid, 'notifications', id), {
          read: true,
        });
      }
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        const user = auth.currentUser;
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            notificationPreferences: { ...preferences, ...newPreferences },
          });
        }
        
        setPreferences((prev) => ({ ...prev, ...newPreferences }));
      } catch (error) {
        console.error('❌ Error updating notification preferences:', error);
      }
    },
    [preferences]
  );

  const refreshNotifications = useCallback(async () => {
    try {
      console.log(`🔄 Refreshing notifications...`);
      stopListening();
      setTimeout(() => {
        startListening();
      }, 1000);
    } catch (error) {
      console.error("❌ Error refreshing notifications:", error);
    }
  }, [startListening, stopListening]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        hasUnread,
        preferences,
        markAsRead,
        updatePreferences,
        startListening,
        stopListening,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}