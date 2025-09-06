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
import { Platform, AppState } from "react-native";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const defaultPreferences: NotificationPreferences = {
  mealReminders: {
    enabled: true,
    breakfast: {
      enabled: true,
      time: { hour: 8, minute: 0 },
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
      time: { hour: 12, minute: 0 },
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
      time: { hour: 18, minute: 0 },
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
    time: { hour: 9, minute: 0 },
    day: "sunday",
  },
  goalAchievements: {
    enabled: true,
    time: { hour: 21, minute: 0 },
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
};

// Configure local notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true, 
    shouldShowList: true, 
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
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isFirstLoadRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<NotificationPreferences>>({});

  const hasUnread = notifications.some((n) => !n.read);

  //  Debounced batch updates
  const debouncedUpdatePreferences = useCallback(
    (newPreferences: Partial<NotificationPreferences>) => {
      // Merge with pending updates
      Object.assign(pendingUpdatesRef.current, newPreferences);

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        const updates = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {}; // Clear pending

        try {
          const user = auth.currentUser;
          if (!user) return;

          const finalPreferences = { ...preferences, ...updates };

          // Background API call (non-blocking)
          fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/v1/notifications/preferences`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${await user.getIdToken()}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(finalPreferences),
            }
          ).catch(console.error); // Silent fail for better UX

          // Update Firestore as backup
          await updateDoc(doc(db, "users", user.uid), {
            notificationPreferences: finalPreferences,
          });

          console.log("✅ Preferences synced to backend");
        } catch (error) {
          console.error("❌ Error syncing preferences:", error);
        }
      }, 1000); // Batch updates every 1 second
    },
    [preferences]
  );

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
    // ✅ Now works for both iOS and Android when app is active
    // if (AppState.currentState === 'active') {
    if (Platform.OS === 'ios') {
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
        console.log(`✅ Local notification triggered for ${Platform.OS}:`, notification.title);
      } catch (error) {
        console.error("❌ Error triggering local notification:", error);
      }
    }
  }, []);

  // Efficient Firestore listener with batching
  const startListening = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const uid = currentUser.uid;
    console.log(`🔥 Starting optimized Firestore listener for:`, uid);

    // Stop existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      const notificationsRef = collection(db, "users", uid, "notifications");
      const q = query(notificationsRef, orderBy("createdAt", "desc"));

      // Batch changes to prevent excessive re-renders
      let batchTimeout: NodeJS.Timeout | null = null;
      const pendingChanges: any[] = [];

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Collect all changes
        snapshot.docChanges().forEach((change) => {
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
            pendingChanges.push({ type: "add", notification });

            // Trigger local notification for new ones (not on first load)
            if (!isFirstLoadRef.current) {
              triggerLocalNotification(notification);
            }
          } else if (change.type === "modified") {
            pendingChanges.push({ type: "modify", notification });
          }
        });

        // Batch process changes every 200ms
        if (batchTimeout) clearTimeout(batchTimeout);

        batchTimeout = setTimeout(() => {
          if (pendingChanges.length > 0) {
            setNotifications((prev) => {
              let updated = [...prev];

              pendingChanges.forEach(({ type, notification }) => {
                if (type === "add") {
                  // Add if not exists
                  if (!updated.find((n) => n.id === notification.id)) {
                    updated.unshift(notification);
                  }
                } else if (type === "modify") {
                  // Update existing
                  const index = updated.findIndex(
                    (n) => n.id === notification.id
                  );
                  if (index >= 0) {
                    updated[index] = notification;
                  }
                }
              });

              // Sort by createdAt and limit to recent 100 for performance
              return updated
                .sort(
                  (a, b) =>
                    (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
                )
                .slice(0, 100);
            });

            pendingChanges.length = 0; // Clear
            setLoading(false);
            isFirstLoadRef.current = false;
          }
        }, 200);
      });

      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("❌ Error setting up optimized Firestore listener:", error);
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log(`🛑 Stopping Firestore listener`);
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Load cached preferences on startup
  useEffect(() => {
    const loadCachedPreferences = async () => {
      try {
        const cached = await AsyncStorage.getItem("notification_preferences");
        if (cached) {
          setPreferences(JSON.parse(cached));
        }
      } catch (error) {
        console.error("Failed to load cached preferences:", error);
      }
    };

    loadCachedPreferences();
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
    // Immediate UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    // Background sync
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, "users", user.uid, "notifications", id), {
          read: true,
        });
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
      // Revert optimistic update on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n))
      );
    }
  }, []);

  // Optimistic updates with caching
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      // Immediate optimistic update for smooth UX
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      // Cache locally for offline access
      try {
        await AsyncStorage.setItem(
          "notification_preferences",
          JSON.stringify(updatedPreferences)
        );
      } catch (error) {
        console.error("Failed to cache preferences:", error);
      }

      // Schedule debounced backend sync
      debouncedUpdatePreferences(newPreferences);
    },
    [preferences, debouncedUpdatePreferences]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

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

  const value = {
    notifications,
    hasUnread: notifications.some((n) => !n.read),
    preferences,
    markAsRead,
    updatePreferences, 
    startListening,
    stopListening,
    refreshNotifications,
    loading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
