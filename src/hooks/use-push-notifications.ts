"use client";

import { useState, useEffect, useCallback } from "react";

interface PushNotificationOptions {
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  actions?: Array<{ action: string; title: string }>;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSupported("Notification" in window && "serviceWorker" in navigator);
      if (isSupported) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (options: PushNotificationOptions) => {
    if (permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        ...options,
      });
    } else {
      new Notification(options.title, {
        body: options.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: options.tag,
      });
    }
  }, [permission, requestPermission]);

  const scheduleReminder = useCallback((appointmentId: string, title: string, body: string, timestamp: number) => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((registration) => {
      (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } })
        .sync?.register(`reminder-${appointmentId}`)
        .catch(() => {
          setTimeout(() => {
            sendNotification({ title, body, tag: appointmentId });
          }, timestamp - Date.now());
        });
    });
  }, [sendNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    scheduleReminder,
  };
}
