import React, { createContext, useContext, useState, ReactNode } from "react";

export type Notification = {
  id: string;
  message: string;
  read: boolean;
};

interface NotificationContextType {
  notifications: Notification[];
  hasUnread: boolean;
  markAllAsRead: () => void;
  addNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotificationContext must be used within NotificationProvider");
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

  const hasUnread = notifications.some((n) => !n.read);

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function addNotification(message: string) {
    setNotifications((prev) => [
      ...prev,
      { id: String(Date.now()), message, read: false },
    ]);
  }

  return (
    <NotificationContext.Provider value={{ notifications, hasUnread, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

