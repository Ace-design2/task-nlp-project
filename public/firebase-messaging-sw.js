/* eslint-disable no-restricted-globals */
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDenrwvRbAAizsaIkJk9QEF69TVTVT2FLI",
  authDomain: "task-nlp-project.firebaseapp.com",
  projectId: "task-nlp-project",
  storageBucket: "task-nlp-project.firebasestorage.app",
  messagingSenderId: "814428224322",
  appId: "1:814428224322:web:f7c60aa614b4b56b4c66db",
  measurementId: "G-YFTRR9Y3Q3"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
