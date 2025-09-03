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
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentChange,
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

  // Request notification permissions (local only)
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          const { status: newStatus } =
            await Notifications.requestPermissionsAsync({
              ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
              },
            });
          if (newStatus !== "granted") {
            console.warn("Local notification permissions not granted");
          } else {
            console.log("✅ Local notification permissions granted");
          }
        } else {
          console.log("✅ Local notification permissions already granted");
        }
      } catch (error) {
        console.error("❌ Error requesting notification permissions:", error);
      }
    };
    requestPermissions();
  }, []);

  // Trigger local notification only (no push notifications)
  const triggerLocalNotification = useCallback(async (notification: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title || "Nutritor AI",
          body: notification.body || "You have a new notification",
          data: notification.type || {},
        },
        trigger: null, // Show immediately
      });
      console.log("✅ Local notification triggered:", notification.title);
    } catch (error) {
      console.error("❌ Error triggering local notification:", error);
    }
  }, []);

  // Start listening to Firestore notifications
  const startListening = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("Cannot start listening: No user is logged in");
      return;
    }

    const uid = currentUser.uid;
    console.log("🔥 Starting Firestore listener for logged-in user:", uid);
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
            "📱 Firestore snapshot received, changes:",
            snapshot.docChanges().length
          );

          const newNotifications: Notification[] = [];

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
              newNotifications.push(notification);

              // Only trigger local notification for new docs (not on initial load)
              if (!isFirstLoadRef.current) {
                triggerLocalNotification(notification);
              }
            }
          });

          // Update state with all notifications (filter for specific types if needed)
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

          // Show all notifications without filtering since backend sends object types
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

  // Stop listening to Firestore
  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log("🛑 Stopping Firestore listener");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Auto-start listener when user authentication state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(
          "🚀 User authenticated, starting Firestore listener for:",
          user.uid
        );
        console.log("📧 User email:", user.email);
        // Reset first load flag when new user logs in
        isFirstLoadRef.current = true;
        startListening();
      } else {
        console.log("� User not authenticated, stopping Firestore listener");
        stopListening();
        setNotifications([]);
        isFirstLoadRef.current = true;
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeAuth();
      stopListening();
    };
  }, [startListening, stopListening]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const updatePreferences = useCallback(
    (newPreferences: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
    },
    []
  );

  // Refresh notifications from API (fallback)
  const refreshNotifications = useCallback(async () => {
    try {
      console.log("Refreshing notifications...");
      // API fallback can be implemented here if needed
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  }, []);

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
