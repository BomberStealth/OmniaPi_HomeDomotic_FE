import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBQ0Sus1favmoE4RU-ysHstq0fn5qNx6t4",
  authDomain: "omniapihomedomotic.firebaseapp.com",
  projectId: "omniapihomedomotic",
  storageBucket: "omniapihomedomotic.firebasestorage.app",
  messagingSenderId: "341304629590",
  appId: "1:341304629590:web:6a652c2feb23f70508def7",
  measurementId: "G-C5KC6N5ZR8"
};

const VAPID_KEY = "BHdu4cn-TUV6FwTnBASdkRFzLELq00mrwZWXLAKlm8W7-LiLIKPmM7pVxqo_FskJ55_8tOESvQ3ZxSkGB_ih69I";

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
    console.log('FCM Token:', token);
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
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

export { app, messaging };
