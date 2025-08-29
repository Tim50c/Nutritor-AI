import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type Notification = {
  id: string;
  message: string;
  read: boolean;
};

export type NotificationPreferences = {
  mealReminders: boolean;
  goalMilestones: boolean;
  planRecommendations: boolean;
};

interface NotificationContextType {
  notifications: Notification[];
  hasUnread: boolean;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (message: string) => void;
  preferences: NotificationPreferences;
  setPreference: (key: keyof NotificationPreferences, value: boolean) => void;
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
  // Demo: initial notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      message: "It's time for your Lunch – Don't forget to log your meal.",
      read: false,
    },
    {
      id: "2",
      message: "It's time for your Lunch – Don't forget to log your meal.",
      read: false,
    },
    {
      id: "3",
      message: "It's time for your Lunch – Don't forget to log your meal.",
      read: false,
    },
    {
      id: "4",
      message: "It's time for your Lunch – Don't forget to log your meal.",
      read: false,
    },
    {
      id: "5",
      message: "It's time for your Lunch – Don't forget to log your meal.",
      read: false,
    },
    {
      id: "6",
      message: "It's time for your Lunch – Don't forget to log your meal.",
      read: false,
    },
  ]);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    mealReminders: true,
    goalMilestones: false,
    planRecommendations: true,
  });

  const hasUnread = notifications.some((n) => !n.read);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [
      ...prev,
      { id: String(Date.now()), message, read: false },
    ]);
  }, []);

  const setPreference = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        hasUnread,
        markAllAsRead,
        addNotification,
        removeNotification,
        preferences,
        setPreference,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
