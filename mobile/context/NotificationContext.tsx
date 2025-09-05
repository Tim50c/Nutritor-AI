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
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,   // iOS specific
    shouldShowList: true,     // iOS specific
    ios: {
      _displayInForeground: true,
    },
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
  mealReminders: {
    enabled: boolean;
    breakfast: {
      enabled: boolean;
      time: { hour: number; minute: number }; // Updated to object
      days: string[]; // ['monday', 'tuesday', etc.]
    };
    lunch: {
      enabled: boolean;
      time: { hour: number; minute: number }; // Updated to object
      days: string[];
    };
    dinner: {
      enabled: boolean;
      time: { hour: number; minute: number }; // Updated to object
      days: string[];
    };
  };
  weeklyProgress: {
    enabled: boolean;
    time: { hour: number; minute: number }; // Updated to object
    day: string; // 'sunday', 'monday', etc.
  };
  goalAchievements: {
    enabled: boolean;
    time: { hour: number; minute: number }; // Updated to object
    days: string[]; // Days of week to check
  };
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
    mealReminders: {
      enabled: true,
      breakfast: {
        enabled: true,
        time: { hour: 8, minute: 0 }, // Updated to object
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      lunch: {
        enabled: true,
        time: { hour: 12, minute: 0 }, // Updated to object
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      dinner: {
        enabled: true,
        time: { hour: 18, minute: 0 }, // Updated to object
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
    },
    weeklyProgress: {
      enabled: true,
      time: { hour: 9, minute: 0 }, // Updated to object
      day: "sunday",
    },
    goalAchievements: {
      enabled: true,
      time: { hour: 21, minute: 0 }, // Updated to object
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },
  });

  const hasUnread = notifications.some((n) => !n.read);

  // Register for push notifications with Expo
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return null;
      }

      // Get Expo push token
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        if (!projectId) {
          console.error("❌ Project ID not found in config");
          return null;
        }

        console.log("🔑 Getting Expo push token with project ID:", projectId);

        // Try to get push token, but don't fail if Firebase isn't initialized
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenData.data;
        console.log(
          "✅ Expo push token obtained:",
          token.substring(0, 50) + "..."
        );
      } catch (e: any) {
        console.error("❌ Error getting Expo push token:", e);
        // If it's a Firebase initialization error, return a mock token for development
        if (e.message.includes("FirebaseApp is not initialized")) {
          console.warn("⚠️ Using development mode - Firebase not initialized");
          return "development-token-" + Date.now();
        }
        return null;
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
      return null;
    }

    return token;
  };

  // Setup notification listeners
  useEffect(() => {
    let isMounted = true;

    // Register for push notifications when user is authenticated
    const setupPushNotifications = async () => {
      try {
        if (auth.currentUser) {
          console.log(
            "🚀 Setting up push notifications for user:",
            auth.currentUser.uid
          );
          const token = await registerForPushNotificationsAsync();

          if (token && token !== "undefined") {
            console.log(
              "💾 Saving push token to Firestore:",
              token.substring(0, 50) + "..."
            );
            // Save token to user document
            await updateDoc(doc(db, "users", auth.currentUser.uid), {
              expoPushToken: token,
              platform: Platform.OS,
              lastTokenUpdate: new Date(),
            });
            console.log("✅ Push token saved successfully");
          } else {
            console.warn("⚠️ No valid push token received");
          }
        }
      } catch (error) {
        console.error("❌ Error setting up push notifications:", error);
      }
    };

    setupPushNotifications();

    // Listen for notification responses (when user taps notification)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "📱 Notification received:",
          notification.request.content.title
        );
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "👆 Notification tapped:",
          response.notification.request.content.title
        );
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
          sound: "default",
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
          console.log(
            `📱 Firestore snapshot received, changes:`,
            snapshot.docChanges().length
          );

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

          console.log(
            `📋 Setting ${allNotifications.length} notifications in state`
          );
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
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(
          `🚀 User authenticated, starting Firestore listener for:`,
          user.uid
        );
        console.log("📧 User email:", user.email);

        // Load user's notification preferences from backend
        try {
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/preferences`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${await user.getIdToken()}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.preferences) {
              console.log("📋 Loaded notification preferences from backend");
              setPreferences(data.data.preferences);
            }
          } else {
            console.warn(
              "⚠️ Failed to load notification preferences from backend"
            );
          }
        } catch (error) {
          console.error("❌ Error loading notification preferences:", error);
        }

        // Register for push notifications for the new user
        try {
          const token = await registerForPushNotificationsAsync();
          if (token && token !== "undefined") {
            console.log("💾 Updating push token for authenticated user");
            await updateDoc(doc(db, "users", user.uid), {
              expoPushToken: token,
              platform: Platform.OS,
              lastTokenUpdate: new Date(),
            });
            console.log("✅ Push token updated for user:", user.uid);
          }
        } catch (error) {
          console.error("❌ Error updating push token:", error);
        }

        isFirstLoadRef.current = true;
        startListening();
      } else {
        console.log(`🚫 User not authenticated, stopping listener`);
        stopListening();
        setNotifications([]);
        setPreferences({
          mealReminders: {
            enabled: true,
            breakfast: {
              enabled: true,
              time: { hour: 8, minute: 0 }, // Updated to object
              days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
            lunch: {
              enabled: true,
              time: { hour: 12, minute: 0 }, // Updated to object
              days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
            dinner: {
              enabled: true,
              time: { hour: 18, minute: 0 }, // Updated to object
              days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
            },
          },
          weeklyProgress: {
            enabled: true,
            time: { hour: 9, minute: 0 }, // Updated to object
            day: "sunday",
          },
          goalAchievements: {
            enabled: true,
            time: { hour: 21, minute: 0 }, // Updated to object
            days: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
        });
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
        await updateDoc(doc(db, "users", user.uid, "notifications", id), {
          read: true,
        });
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }
  }, []);

  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("❌ No authenticated user found");
          return;
        }

        const updatedPreferences = { ...preferences, ...newPreferences };

        // Update backend via API
        const response = await fetch(
          `https://nutritor-ai.onrender.com/api/v1/notifications/preferences`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${await user.getIdToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedPreferences),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log("✅ Notification preferences updated on backend");
            setPreferences(updatedPreferences);
          } else {
            console.error(
              "❌ Failed to update preferences on backend:",
              data.message
            );
          }
        } else {
          console.error(
            "❌ Failed to update preferences - HTTP error:",
            response.status
          );
        }

        // Also update Firestore directly as backup
        await updateDoc(doc(db, "users", user.uid), {
          notificationPreferences: updatedPreferences,
        });
      } catch (error) {
        console.error("❌ Error updating notification preferences:", error);
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
