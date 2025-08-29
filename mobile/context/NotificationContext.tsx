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
import { db } from "../config/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  DocumentChange,
} from "firebase/firestore";

// Configure notification behavior
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
  startListening: (uid: string) => void;
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

  // Request notification permissions
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.warn("Notification permissions not granted");
      }
    };
    requestPermissions();
  }, []);

  // Trigger local notification
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
  const startListening = useCallback(
    (uid: string) => {
      if (!uid) {
        console.warn("Cannot start listening: UID is required");
        return;
      }

      // Stop existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      console.log("🔥 Starting Firestore listener for user:", uid);

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
    },
    [triggerLocalNotification]
  );

  // Stop listening to Firestore
  const stopListening = useCallback(() => {
    if (unsubscribeRef.current) {
      console.log("🛑 Stopping Firestore listener");
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  // Auto-start listener when app loads and cleanup on unmount
  useEffect(() => {
    // For demo/testing - use a fixed UID
    // In a real app, this would come from authentication
    const demoUID = "sFbSZufUl4ecSLDfRys4pdm4lbo1";

    console.log("🚀 Auto-starting Firestore listener on app load");
    startListening(demoUID);

    // Cleanup on unmount
    return () => {
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
