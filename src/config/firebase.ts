import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBWmY5zR2R7xyMuL1cZEnXS7JL1fbfJ2KY",
  authDomain: "omniapihomedomotic.firebaseapp.com",
  projectId: "omniapihomedomotic",
  storageBucket: "omniapihomedomotic.firebasestorage.app",
  messagingSenderId: "341304629590",
  appId: "1:341304629590:web:6a652c2feb23f70508def7",
  measurementId: "G-C5KC6N5ZR8"
};

const VAPID_KEY = "BGxPCFAPcfhftj2c3LwuzmoEgIA8Ey6nXlZZPOwU4iF6eNseNTv5n6UcPrvlqGzW5keO3Tq2GY3OAca8QQvSbYQ";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Messaging (only in browser)
let messaging: Messaging | null = null;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

// Request permission and get token
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    if (!messaging) {
      console.warn('Firebase messaging not supported');
      return null;
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    return token;
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback: (payload: any) => void): void {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    callback(payload);
  });
}

export { app, messaging };
