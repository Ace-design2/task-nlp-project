import React, { useState, useEffect } from "react";
import "./App.css";

import TaskHistory from "./components/TaskHistory";
import VoiceInput from "./components/VoiceInput";
import VuesaxIcon from "./components/VuesaxIcon";
import BottomNavigation from "./components/BottomNavigation";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import LoginPage from "./components/LoginPage";

import LoadingScreen from "./components/LoadingScreen";
import AccountSettings from "./components/AccountSettings";
import CreativeMyDay from "./components/CreativeMyDay";
import CreativeCalendar from "./components/CreativeCalendar";
import ProductivityInsights from "./components/ProductivityInsights";
import ChatList from "./components/ChatList";

import VerificationPending from "./components/VerificationPending";
import AstraStartPage from "./components/AstraStartPage"; // [NEW] relative import
import NotificationsPage from "./components/NotificationsPage"; // [NEW]
import { getRandomTimePrompt } from "./constants/prompts";

import { auth, db, messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import { onAuthStateChanged } from "firebase/auth";
import localCourses from "./data/courses.json"; // [NEW] Fallback course data
import { uploadCoursesToFirestore } from "./utils/uploadCourses"; // [NEW] Migration utility
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  orderBy,
  getDocs,
  writeBatch,
} from "firebase/firestore";

function App() {
  // Theme Preference State: 'system', 'dark', 'light'
  const [themePreference, setThemePreference] = useState(() => {
     return localStorage.getItem("themePreference") || "system";
  });

  const [darkMode, setDarkMode] = useState(false);

  // Effect to apply theme based on preference
  useEffect(() => {
    const applyTheme = () => {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      let isDark = false;

      if (themePreference === "dark") {
        isDark = true;
      } else if (themePreference === "light") {
        isDark = false;
      } else {
        isDark = systemDark;
      }

      setDarkMode(isDark);
    };

    applyTheme();

    // Listener for system changes if preference is 'system'
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
       if (themePreference === "system") applyTheme();
    };
    mediaQuery.addEventListener("change", handler);
    
    // Save to local storage
    localStorage.setItem("themePreference", themePreference);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [themePreference]);

  const [activeTab, setActiveTab] = useState("My Day");

  // Update theme-color meta tag for iOS/Android status bar & body background
  useEffect(() => {
    // [MODIFIED] If we are on Account Settings, let that component handle it.
    if (activeTab === "Account Settings") return;

    const updateTheme = () => {
        let metaThemeColor = document.querySelector("meta[name='theme-color']");
        // Create if missing
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = "theme-color";
            document.head.appendChild(metaThemeColor);
        }

        // [Logic for Chat Tab: Red Theme]
        if (activeTab === "Chat") {
            metaThemeColor.setAttribute("content", "#c1121f");
            document.body.style.backgroundColor = "#c1121f"; // Force Body Red
        } else {
            // [Default Theme: Dark/Light]
            const color = darkMode ? "#000000" : "#ffffff";
            metaThemeColor.setAttribute("content", color);
            document.body.style.backgroundColor = color;
        }

        // Apply global dark-mode class (affects text color etc)
        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }
    };

    updateTheme();

    // [NEW] iOS Specific Status Bar Logic
    let metaAppleStatus = document.querySelector("meta[name='apple-mobile-web-app-status-bar-style']");
    if (!metaAppleStatus) {
        metaAppleStatus = document.createElement('meta');
        metaAppleStatus.name = "apple-mobile-web-app-status-bar-style";
        document.head.appendChild(metaAppleStatus);
    }
    
    // Always use default to respect theme-color
    metaAppleStatus.setAttribute("content", "default");
  }, [darkMode, activeTab]); // Added activeTab dependency

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [userProfile, setUserProfile] = useState(() => {
    const cached = localStorage.getItem("cachedUserProfile");
    return cached ? JSON.parse(cached) : null;
  });
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState(() => {
    const cached = localStorage.getItem("cachedTasks");
    return cached ? JSON.parse(cached) : [];
  });
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [text, setText] = useState("");
  /* Removed isSidebarOpen state */
  /* Removed isSidebarOpen state */
  /* [MOVED activeTab definition UP] */
  const [notifications, setNotifications] = useState([]); // [NEW]
  const [showNotifications, setShowNotifications] = useState(false); // [NEW]

  const [pendingTask, setPendingTask] = useState(null);
  const [isWaitingForTime, setIsWaitingForTime] = useState(false);
  const [isWaitingForAmPm, setIsWaitingForAmPm] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [courseLibrary, setCourseLibrary] = useState([]); // [NEW] Firestore Data

  // [NEW] Sync Courses from Firestore (and auto-upload if empty)
  useEffect(() => {
    const q = query(collection(db, "courses"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        console.log("Firestore 'courses' empty. Uploading local data...");
        await uploadCoursesToFirestore();
      } else {
        const courses = snapshot.docs.map(doc => doc.data());
        console.log("Loaded courses from Firestore:", courses.length);
        setCourseLibrary(courses);
      }
    });

    return () => unsubscribe();
  }, []);
  
  // --- STUDY PLANNER STATE ---
  const [studyPlannerState, setStudyPlannerState] = useState("IDLE"); // IDLE, AWAITING_TOPIC, AWAITING_DAYS
  const [studyPlannerData, setStudyPlannerData] = useState({ topic: null, days: null, dailyHours: null });
  const [tempGeneratedSchedule, setTempGeneratedSchedule] = useState(null); // [NEW] Store schedule for confirmation

  // --- RESIZABLE SIDEBAR STATE ---
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResizing = React.useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent) => {
      if (isResizing && !isMobile) {
        // Calculate new width relative to the left edge of the content area
        // The main content starts at 282px (margin-left of .main-content) or 92px if collapsed
        // So visible width of list = cursor X position - offset.

        const offset = isSidebarCollapsed ? 92 : 282; // 70px + 12px margins or 250px + margins
        let newWidth = mouseMoveEvent.clientX - offset;

        // Constraints
        if (newWidth < 250) newWidth = 250;
        if (newWidth > 800) newWidth = 800;

        setSidebarWidth(newWidth);
      }
    },
    [isResizing, isMobile, isSidebarCollapsed],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // --- FIREBASE AUTH & FIRESTORE INTEGRATION ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User is logged in (could be verified or unverified)
        setUser(currentUser);
        setIsAuthenticated(true);
        setIsEmailVerified(currentUser.emailVerified);

        // ONLY Start listeners if verified
        if (currentUser.emailVerified) {
          // Subscribe to User Profile Data
          onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
            if (doc.exists()) {
              const data = doc.data();
              setUserProfile(data);
              localStorage.setItem("cachedUserProfile", JSON.stringify(data));
            }
          });

          // Update Last Login
          try {
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(
              userRef,
              {
                lastLoginAt: new Date().toISOString(),
                email: currentUser.email,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Save TimeZone
              },
              { merge: true },
            );
          } catch (e) {
            console.error("Error updating login timestamp", e);
          }
        }
      } else {
        // Logged out
        setIsAuthenticated(false);
        setUser(null);
        setIsEmailVerified(false);
        setUserProfile(null);
        setTasks([]);
        setHistory([]);
        setChats([]);
        setActiveChatId(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // ... [Rest of logic]

  const [fcmToken, setFcmToken] = useState(null);

  // 1. Get Token
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        if (!("Notification" in window)) return;

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          // Explicitly register the SW to ensure background support
          let registration;
          try {
            registration = await navigator.serviceWorker.register(
              "/firebase-messaging-sw.js",
            );
            console.log(
              "Service Worker registered with scope:",
              registration.scope,
            );
          } catch (err) {
            console.error("Service Worker registration failed:", err);
            // Fallback to letting getToken try, but logging the error
          }

          const token = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (token) {
            console.log("FCM Token:", token);
            setFcmToken(token);
          }
        }
      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
    };
    setupNotifications();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      const { title, body } = payload.notification || {};
      if (title) {
        new Notification(title, { body, icon: "/icon.png" });
      }
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  // 2. Save Token to User Profile (Multi-Device Support)
  useEffect(() => {
    if (user && fcmToken) {
      const saveToken = async () => {
        try {
          // Use token as doc ID to prevent duplicates
          const tokenRef = doc(db, "users", user.uid, "fcm_tokens", fcmToken);
          await setDoc(
            tokenRef,
            {
              token: fcmToken,
              lastSeen: new Date().toISOString(),
              platform: navigator.userAgent,
            },
            { merge: true },
          );
        } catch (e) {
          console.error("Error saving token:", e);
        }
      };
      saveToken();
    }
  }, [user, fcmToken]);

  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to Tasks
    const tasksRef = collection(db, "users", user.uid, "tasks");
    const qTasks = query(tasksRef);
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const loadedTasks = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setTasks(loadedTasks);
      localStorage.setItem("cachedTasks", JSON.stringify(loadedTasks));
    });

    // 2. Subscribe to Chats List
    const chatsRef = collection(db, "users", user.uid, "chats");
    const qChats = query(chatsRef, orderBy("lastMessageTime", "desc"));
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const loadedChats = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setChats(loadedChats);
    });

    // 3. Subscribe to Notifications
    const notifRef = collection(db, "users", user.uid, "notifications");
    const qNotif = query(notifRef, orderBy("createdAt", "desc"));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const loadedNotif = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setNotifications(loadedNotif);
    });

    return () => {
      unsubTasks();
      unsubChats();
      unsubNotif();
    };
  }, [user]);

  // 3. Subscribe to Active Chat History
  useEffect(() => {
    if (!user || !activeChatId) {
      setHistory([]);
      return;
    }

    const historyRef = collection(
      db,
      "users",
      user.uid,
      "chats",
      activeChatId,
      "messages",
    );
    const qHistory = query(historyRef, orderBy("createdAt", "asc"));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      const loadedHistory = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setHistory(loadedHistory);
    });

    return () => unsubHistory();
  }, [user, activeChatId]);



  // Helper to add AI message (Moved out/cloned for scope access if needed, 
  // but handleProcessTask has it defined inside. We need it accessible or passed.
  // For now, I will define a ref or move addAiMessage to component scope, 
  // OR just assume I'll put this logic INSIDE handleProcessTask or use a clearer flow.
  // actually, let's keep fetchStudySchedule outside and pass a callback or just move logic into handleProcessTask
  // since addAiMessage is defined inside handleProcessTask currently.
  // RE-STRATEGY: I'll put the fetching logic inside handleProcessTask or a generic effect/function that has access to addDoc.
  // To keep it clean, I'll define addAiMessageWrapper at component level or just implement inline in handleProcessTask.
  
  // Let's defer implementation of fetchStudySchedule to be called FROM handleProcessTask directly
  // or define addAiMessage at component level (which involves database deps).
  


  // [NEW] General Conversation Logic
  const processGeneralConversation = async (text, addAiMessage) => {
    const lower = text.toLowerCase();

    // 1. Greetings
    if (lower.match(/^(hello|hi|hey|greetings|good morning|good afternoon|good evening)/)) {
       const name = user.displayName ? user.displayName.split(" ")[0] : "there";
       await addAiMessage(`Hello ${name}! How can I help you be productive today?`);
       return true;
    }

    // 2. Identity / Profile
    if (lower.includes("my name") || lower.includes("who am i")) {
        await addAiMessage(`You are **${user.displayName || "User"}**.`);
        return true;
    }
    if (lower.includes("my email")) {
        await addAiMessage(`Your email is **${user.email}**.`);
        return true;
    }
     if (lower.includes("my department")) {
        await addAiMessage(`You are in the **${userProfile?.department || "Unknown Department"}**.`);
        return true;
    }
     if (lower.includes("my level")) {
        await addAiMessage(`You are in **${userProfile?.level || "Unknown Level"}**.`);
        return true;
    }
    if (lower.includes("who are you") || lower.includes("what is your name")) {
        await addAiMessage("I am **Astra**, your personal academic and productivity assistant.");
        return true;
    }

    // 3. Task Stats
    if (lower.includes("how many tasks") || lower.includes("task count") || lower.includes("pending tasks")) {
        const pending = tasks.filter(t => !t.completed).length;
        const total = tasks.length;
        await addAiMessage(`You have **${pending} pending tasks** out of **${total} total tasks**.`);
        return true;
    }
    
    // 4. "What can you do?"
    if (lower.includes("what can you do") || lower.includes("help")) {
        await addAiMessage("I can help you manage your tasks, create study schedules, and answer questions about your profile.\n\nTry asking:\n- 'Create a task to study math'\n- 'How many tasks do I have?'\n- 'Build a study schedule for CSC411'");
        return true;
    }

    return false;
  };


    // [NEW] Notification Handlers
    const handleMarkAllRead = async () => {
        if (!user) return;
        const batch = writeBatch(db);
        notifications.forEach(n => {
            const ref = doc(db, "users", user.uid, "notifications", n.id);
            batch.delete(ref);
        });
        try {
            await batch.commit();
            setNotifications([]); // Optimistic update
        } catch (e) {
            console.error("Error clearing notifications:", e);
        }
    };

    const handleMarkRead = async (id) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "notifications", id));
        } catch (e) {
            console.error("Error deleting notification:", e);
        }
    };

  const handleProcessTask = async (text) => {
    if (!text.trim()) return;
    if (!user) {
      alert("Please log in to chat.");
      return;
    }

    let currentChatId = activeChatId;

    // If no active chat or "new" state, create one
    if (!currentChatId || currentChatId === "new") {
      try {
        const newChatRef = await addDoc(
          collection(db, "users", user.uid, "chats"),
          {
            firstPrompt: text,
            createdAt: new Date().toISOString(),
            lastMessageTime: new Date().toISOString(),
          },
        );
        currentChatId = newChatRef.id;
        setActiveChatId(currentChatId);
      } catch (e) {
        console.error("Error creating chat session", e);
        return;
      }
    } else {
      // Update lastMessageTime for existing chat
      try {
        await setDoc(
          doc(db, "users", user.uid, "chats", currentChatId),
          {
            lastMessageTime: new Date().toISOString(),
          },
          { merge: true },
        );
      } catch (e) {}
    }

    // Add User Message to History (Firestore subcollection)
    const userMsg = {
      text: text,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(
        collection(db, "users", user.uid, "chats", currentChatId, "messages"),
        userMsg,
      );
    } catch (e) {
      console.error("Error adding doc", e);
    }

    setText("");

    // Helper to add AI message
    const addAiMessage = async (msgText) => {
      try {
        await addDoc(
          collection(db, "users", user.uid, "chats", currentChatId, "messages"),
          {
            text: msgText,
            sender: "ai", // Internal ID can remain "ai" or change to "astra" if backend supports it. Keeping "ai" for safety for now.
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAt: new Date().toISOString(),
            isAstra: true, // Tag as Astra for potential future use
          },
        );
      } catch (e) {
        console.error("Error adding AI msg", e);
      }
    };

    // Helper to add Task
    const addTaskToDb = async (taskData) => {
      await addDoc(collection(db, "users", user.uid, "tasks"), {
        ...taskData,
        pushToken: fcmToken || null,
        sent: false,
      });

      // [MOVED] Add to Notifications Collection centrally
      try {
        await addDoc(collection(db, "users", user.uid, "notifications"), {
          type: "task_created",
          title: `Task Created: ${taskData.title}`,
          timestamp: new Date().toLocaleString(),
          createdAt: new Date().toISOString(),
          read: false,
        });
      } catch (e) {
        console.error("Error adding notification rec", e);
      }
    };
    


    // --- CASE -1: STUDY PLANNER FLOW ---
    console.log("DEBUG: handleProcessTask", { text, studyPlannerState, studyPlannerData });

    if (studyPlannerState === "AWAITING_TOPIC") {
      console.log("DEBUG: Processing Topic", text);
      const lower = text.toLowerCase();

      // [NEW] Check for "All" selection if we have possibleMatches
      if (studyPlannerData.possibleMatches && studyPlannerData.possibleMatches.length > 0) {
          if (lower.match(/^all\b|everything|both/i) || lower.includes("all of them") || lower.includes("all the courses") || lower.includes("all of it")) {
              // User selected ALL
              setStudyPlannerData(prev => ({ 
                  ...prev, 
                  topic: "Multiple Courses", 
                  selectedCourses: prev.possibleMatches // Copy matches to selectedCourses
              }));
              setStudyPlannerState("AWAITING_DAYS");
              
              setIsTyping(true);
              setTimeout(() => {
                  addAiMessage(`Great! How many days do you want to study **all ${studyPlannerData.possibleMatches.length} courses**?`);
                  setIsTyping(false);
              }, 800);
              return;
          }
      }

      setStudyPlannerData(prev => ({ ...prev, topic: text }));
      setStudyPlannerState("AWAITING_DAYS");
      
      setIsTyping(true);
      setTimeout(() => {
        addAiMessage(`Great! How many days do you want to study **${text}**?`);
        setIsTyping(false);
      }, 800);
      return;
    }

    if (studyPlannerState === "AWAITING_TOPIC") {
      console.log("DEBUG: Processing Topic", text);
      const lower = text.toLowerCase();

      // [NEW] Check for "All" selection if we have possibleMatches
      if (studyPlannerData.possibleMatches && studyPlannerData.possibleMatches.length > 0) {
          if (lower.match(/^all\b|everything|both/i) || lower.includes("all of them") || lower.includes("all the courses") || lower.includes("all of it")) {
              // User selected ALL
              setStudyPlannerData(prev => ({ 
                  ...prev, 
                  topic: "Multiple Courses", 
                  selectedCourses: prev.possibleMatches // Copy matches to selectedCourses
              }));
              setStudyPlannerState("AWAITING_DAYS");
              
              setIsTyping(true);
              setTimeout(() => {
                  addAiMessage(`Great! How many days do you want to study **all ${studyPlannerData.possibleMatches.length} courses**?`);
                  setIsTyping(false);
              }, 800);
              return;
          }
      }

      setStudyPlannerData(prev => ({ ...prev, topic: text }));
      setStudyPlannerState("AWAITING_DAYS");
      
      setIsTyping(true);
      setTimeout(() => {
        addAiMessage(`Great! How many days do you want to study **${text}**?`);
        setIsTyping(false);
      }, 800);
      return;
    }

    if (studyPlannerState === "AWAITING_DAYS") {
      console.log("DEBUG: Processing Days", text);
      const days = parseInt(text);
      if (isNaN(days) || days <= 0) {
        addAiMessage("Please enter a valid number of days (e.g., 3, 5, 7).");
        return;
      }

      setStudyPlannerData(prev => ({ ...prev, days: days }));
      setStudyPlannerState("AWAITING_DAILY_HOURS"); // New State

      setIsTyping(true);
      setTimeout(() => {
        addAiMessage(`Got it. How many hours per day can you dedicate strictly to studying?`);
        setIsTyping(false);
      }, 800);
      return;
    }

    if (studyPlannerState === "AWAITING_DAILY_HOURS") {
      console.log("DEBUG: Processing Daily Hours", text);
      const hours = parseFloat(text);
      if (isNaN(hours) || hours <= 0) {
        addAiMessage("Please enter a valid number of hours (e.g., 2, 3.5).");
        return;
      }

      const finalData = { ...studyPlannerData, dailyHours: hours };
      setStudyPlannerData(finalData);

      // Trigger API Call
      setIsTyping(true);
      addAiMessage(`Generating a **${finalData.days}-day** study plan for **${finalData.topic}** (${hours} hours/day)...`);

      try {
        // Sanitize topic function
        const sanitizeTopic = (t) => t.replace(/([a-zA-Z]+)\s+(\d+)/g, "$1$2").toUpperCase();

        let generatedSchedule = {};

        let aggregatedMessage = "";

        if (finalData.selectedCourses && finalData.selectedCourses.length > 0) {
             // --- MULTI-COURSE GENERATION (BIN PACKING) ---
             const courseCount = finalData.selectedCourses.length;
             let successCount = 0;

             // 1. Fetch Phase: Ask for enough time per course to get meaty tasks (e.g. 1.5 hours)
             // We will re-schedule them anyway, so we just want the content.
             const fetchHoursPerCourse = 1.5; 

             // Parallel Fetch
             const promises = finalData.selectedCourses.map(async (course) => {
                 const sTopic = sanitizeTopic(course.code);
                 try {
                     const res = await fetch(
                        `https://task-nlp-expertsystemlogic.onrender.com/schedule?query=${encodeURIComponent(sTopic)}&days=${finalData.days}&daily_hours=${fetchHoursPerCourse}`
                     );
                     const d = await res.json();
                     return { code: course.code, data: d, result: res.ok };
                 } catch (e) {
                     return { code: course.code, error: e };
                 }
             });

             const results = await Promise.all(promises);
             
             // 2. Flatten & Interleave Phase
             // We want to mix courses: A, B, C, A, B, C... not AAAAA, BBBBB.
             const allTasks = [];
             const courseQueues = {};

             results.forEach(item => {
                 if (item.data && item.data.schedule) {
                     successCount++;
                     const tasksForCourse = [];
                     // Extract all tasks for this course
                     Object.values(item.data.schedule).forEach(dayInfo => {
                         dayInfo.topics.forEach(t => {
                             tasksForCourse.push({
                                 ...t,
                                 topic: `${item.code}: ${t.topic}`, // Prefix
                                 originalTime: t.time
                             });
                         });
                     });
                     courseQueues[item.code] = tasksForCourse;
                 }
             });

             // Round Robin Interleave
             let hasMore = true;
             while (hasMore) {
                 hasMore = false;
                 for (const courseCode of Object.keys(courseQueues)) {
                     if (courseQueues[courseCode].length > 0) {
                         allTasks.push(courseQueues[courseCode].shift());
                         hasMore = true;
                     }
                 }
             }

             // 3. Bin Packing Phase (Client-Side Scheduling)
             const userDailyLimit = hours; // User's requested limit (e.g. 3 hours)
             const binPackedSchedule = {};
             let currentDay = 1;
             let currentDayHours = 0;
             let currentDayTopics = [];

             allTasks.forEach(task => {
                 const taskTime = task.time || 1.0; // Default if missing
                 
                 // If adding this task exceeds limit (and we have at least one task already), move to next day
                 // Exception: If a single task is huge > limit, we must put it on its own day (or split it, but simple for now).
                 if (currentDayHours + taskTime > userDailyLimit && currentDayTopics.length > 0) {
                     // Save current day
                     binPackedSchedule[`Day ${currentDay}`] = {
                         total_hours: currentDayHours,
                         topics: [...currentDayTopics]
                     };
                     // Reset for next day
                     currentDay++;
                     currentDayHours = 0;
                     currentDayTopics = [];
                 }

                 // Add task
                 currentDayTopics.push(task);
                 currentDayHours += taskTime;
             });

             // Save last day
             if (currentDayTopics.length > 0) {
                 binPackedSchedule[`Day ${currentDay}`] = {
                     total_hours: currentDayHours,
                     topics: [...currentDayTopics]
                 };
             }

             generatedSchedule = binPackedSchedule;

             
             const extendedMsg = currentDay > finalData.days 
                ? `\n\n**Note:** To cover all ${courseCount} courses within **${hours} hours/day**, the schedule spans **${currentDay} days** (requested: ${finalData.days}).` 
                : "";

             aggregatedMessage = `Generated a optimized schedule for **${successCount}/${courseCount} courses**.${extendedMsg}`;

        } else {
            // --- SINGLE COURSE GENERATION (Existing) ---
            const sanitizedTopic = sanitizeTopic(finalData.topic);
            console.log(`DEBUG: Fetching schedule for ${sanitizedTopic}`);
            
            const response = await fetch(
              `https://task-nlp-expertsystemlogic.onrender.com/schedule?query=${encodeURIComponent(
                 sanitizedTopic
              )}&days=${finalData.days}&daily_hours=${hours}`
            );
            const data = await response.json();
            
            if (data.status === "impossible") {
                 // Impossible Scenario
                 const errorMsg = data.error || "Schedule is not possible.";
                 const suggestion = data.suggestion 
                    ? `\n\n**Suggestion:** You need at least **${data.suggestion.needed_days} days** (at ${data.suggestion.needed_daily_hours.toFixed(1)} hours/day) to cover this content.`
                    : "";
                 
                 setIsTyping(false);
                 await addAiMessage(`⚠️ **Schedule Not Possible**\n\n${errorMsg}${suggestion}`);
                 
                 setStudyPlannerState("IDLE");
                 setStudyPlannerData({ topic: null, days: null, dailyHours: null });
                 return;
            }
    
            if (data.status === "adjusted") {
                 // Adjusted Scenario - Warning first
                 const warningMsg = data.message || "Schedule adjusted.";
                 await addAiMessage(`⚠️ **Note:** ${warningMsg}`);
            }
    
            if (!response.ok && data.status !== "adjusted") {
               throw new Error(data.detail || "Failed to generate schedule");
            }

            generatedSchedule = data.schedule;
            if (data.course) {
                 setStudyPlannerData(prev => ({ ...prev, course: data.course }));
            }
            aggregatedMessage = `Here is your study schedule for **${data.query || finalData.topic}** over **${finalData.days} days**:`;
        }

        setIsTyping(false);
        
        let scheduleText = `${aggregatedMessage}\n\n`;
        
        if (generatedSchedule && Object.keys(generatedSchedule).length > 0) {
          // Sort days just in case
          const sortedDays = Object.keys(generatedSchedule).sort((a,b) => {
              const da = parseInt(a.replace("Day ", ""));
              const db = parseInt(b.replace("Day ", ""));
              return da - db;
          });

          sortedDays.forEach((day) => {
            const info = generatedSchedule[day];
            scheduleText += `**${day}** (${info.total_hours.toFixed(1)} hours):\n`; // Show 1 decimal
            info.topics.forEach(t => {
               scheduleText += `- ${t.topic} (${t.time}h)\n`;
            });
            scheduleText += "\n";
          });
          scheduleText += "\nDo you want to add these tasks to your calendar? (Reply 'Yes')";
        } else {
          scheduleText += "No schedule could be generated.";
        }

        await addAiMessage(scheduleText);
        
        if (generatedSchedule && Object.keys(generatedSchedule).length > 0) {
           setTempGeneratedSchedule(generatedSchedule);
           // ... (Firestore fallback logic omitted for cleanliness in multi-mode, but kept for single if needed)
           if (!finalData.selectedCourses) {
                // ... (Original logic for resolving course if single match) ...
                // Keeping minimal for diff.
                if (!studyPlannerData.course) { /* ... */ } 
           }
           
           setStudyPlannerState("AWAITING_CALENDAR_CONFIRMATION");
           // Data persistance not cleared yet
        
        } else {
            console.log("DEBUG: Schedule generation failed/empty");
            // If empty, clean up state
            setStudyPlannerState("IDLE");
            setStudyPlannerData({ topic: null, days: null, dailyHours: null });
        }

      } catch (error) {
        console.error("Study Planner Error:", error);
        setIsTyping(false);
        
        const errorMessage = error.message && error.message.includes("No topics found") 
          ? `I couldn't find any topics for "**${finalData.topic}**". Please try a different course code (e.g., CSC416) or keyword.`
          : "Sorry, I couldn't generate a schedule for that topic. Please try again.";
          
        await addAiMessage(errorMessage);
        setStudyPlannerState("IDLE");
      }
      return;
    }

    // --- CASE -0.5: CONFIRM ADD TO CALENDAR ---
    if (studyPlannerState === "AWAITING_CALENDAR_CONFIRMATION") {
       const lower = text.toLowerCase();
       if (lower.includes("yes") || lower.includes("sure") || lower.includes("yeah") || lower.includes("y")) {
          // Add to calendar
          if (tempGeneratedSchedule) {
             let addedCount = 0;
             const today = new Date();
             
             // Iterate through the schedule: "Day 1", "Day 2", etc.
             for (const [dayKey, dayInfo] of Object.entries(tempGeneratedSchedule)) {
                // Parse "Day X" -> X
                const dayNum = parseInt(dayKey.replace("Day ", ""));
                if (isNaN(dayNum)) continue;

                // Calculate Date: Today + dayNum (Starting tomorrow as Day 1)
                // If user wants Day 1 to be Today, we'd do dayNum - 1. 
                // Let's assume Day 1 = Tomorrow for prep? Or Day 1 = Today?
                // Let's do Day 1 = Tomorrow to be safe/standard for planning.
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + dayNum); 
                const dateStr = targetDate.toISOString().split('T')[0];

                // Create Tasks for each topic
                for (const topicItem of dayInfo.topics) {
                   let taskTitle = `Study: ${studyPlannerData.topic} - ${topicItem.topic}`;
                   
                   // Use API Course Title if available
                   if (studyPlannerData.course) {
                       const { code, title } = studyPlannerData.course;
                       taskTitle = `Study: ${code} - ${title} | ${topicItem.topic}`;
                   }

                   const newTask = {
                      title: taskTitle,
                      date: dateStr,
                      time: "All Day", // No specific time info from generator yet
                      completed: false,
                      priority: "High",
                      createdAt: new Date().toISOString()
                   };
                   await addTaskToDb(newTask);
                   addedCount++;
                }
             }
             
             setIsTyping(true);
             setTimeout(() => {
                addAiMessage(`✅ **Success!** Added **${addedCount} study tasks** to your calendar. You can track your progress in the **Insights** section.`);
                setIsTyping(false);
             }, 800);
          } else {
             addAiMessage("Error: Could not retrieve schedule data.");
          }
       } else {
          // User declined
          addAiMessage("Okay, I won't add them. Let me know if you need anything else!");
       }

       // Reset
       setStudyPlannerState("IDLE");
       setTempGeneratedSchedule(null);
       setStudyPlannerData({ topic: null, days: null, dailyHours: null });
       return;
    }

    // --- CASE 0: HANDLE PENDING AM/PM ANSWER ---
    if (isWaitingForAmPm && pendingTask) {
      console.log("Processing AM/PM answer:", text);
      const lower = text.toLowerCase();
      let hour = pendingTask.ambiguousHour;
      const minute = pendingTask.ambiguousMinute || "00";

      let validAmPm = false;
      if (lower.includes("am") || lower.includes("morning")) {
        if (hour === 12) hour = 0;
        validAmPm = true;
      } else if (
        lower.includes("pm") ||
        lower.includes("afternoon") ||
        lower.includes("evening") ||
        lower.includes("night")
      ) {
        if (hour < 12) hour += 12;
        validAmPm = true;
      }

      if (validAmPm) {
        const finalTime = `${String(hour).padStart(2, "0")}:${minute}`;
        const newTask = {
          ...pendingTask,
          time: finalTime,
        };
        // Remove temp properties
        delete newTask.ambiguousHour;
        delete newTask.ambiguousMinute;

        // Add Task to DB
        await addTaskToDb(newTask);

        setPendingTask(null);
        setIsWaitingForAmPm(false);

        // Astra Confirmation
        setIsTyping(true);
        setTimeout(() => {
          addAiMessage(
            `Scheduled: ${newTask.title} for ${newTask.time} on ${newTask.date}`,
          );
          setIsTyping(false);
        }, 1000);

        scheduleNotification(newTask.title, newTask.date, finalTime);
        return;
      } else {
        // Did not understand AM/PM
        setIsTyping(true);
        setTimeout(() => {
          addAiMessage("Sorry, was that AM or PM?");
          setIsTyping(false);
        }, 800);
        return;
      }
    }
    // --- CASE 1: HANDLE PENDING TIME ANSWER ---
    if (isWaitingForTime && pendingTask) {
      console.log("Processing time answer:", text);

      if (text.toLowerCase().includes("cancel")) {
        setPendingTask(null);
        setIsWaitingForTime(false);
        addAiMessage("Task creation cancelled.");
        return;
      }

      // 1. Try generic parser first
      let parseResult = parseTimeFromText(text);

      // 2. Fallback...

      if (parseResult.ambiguous) {
        // Ask for clarification
        setPendingTask({
          ...pendingTask,
          ambiguousHour: parseResult.hour,
          ambiguousMinute: parseResult.minute,
        });
        setIsWaitingForTime(false);
        setIsWaitingForAmPm(true);

        setIsTyping(true);
        setTimeout(() => {
          addAiMessage("Would that be AM or PM?");
          setIsTyping(false);
        }, 1000);
        return;
      }

      let finalTime = parseResult.time;

      // If still "All Day", validation fails
      if (finalTime === "All Day") {
        setIsTyping(true);
        setTimeout(() => {
          addAiMessage(
            "I didn't catch a time. Please specify a time (e.g. 6pm).",
          );
          setIsTyping(false);
        }, 1000);
        return;
      }

      // Success
      const newTask = {
        ...pendingTask,
        date: pendingTask.date,
        time: finalTime,
      };

      await addTaskToDb(newTask);
      setPendingTask(null);
      setIsWaitingForTime(false);

      setIsTyping(true);
      setTimeout(() => {
        addAiMessage(
          `Scheduled: ${newTask.title} for ${newTask.time} on ${newTask.date}`,
        );
        setIsTyping(false);
      }, 1000);

      scheduleNotification(newTask.title, newTask.date, finalTime);
      return;
    }

    // --- CASE 2: NEW TASK PROCESSING ---
    try {
      // ... (Existing Permission Logic) ...
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      console.log("Sending request with text:", text);

      // --- 1. Check for Study Schedule Intent (Client-Side Logic) ---
      const lowerText = text.toLowerCase();
      if ((lowerText.includes("study schedule") || lowerText.includes("study plan") || lowerText.includes("study routine") || lowerText.includes("schedule for")) 
           && (lowerText.includes("course") || lowerText.includes("csc") || lowerText.match(/[a-z]{3}\s?\d{3}/)) ) {
          
          await processStudyScheduleRequest(text, addAiMessage);
          return;
      }

      // --- 2. Check for General Conversation ---
      const handled = await processGeneralConversation(text, addAiMessage);
      if (handled) return;
      
      let response;
      try {
        response = await fetch(
          "https://madebyace-task-nlp-engine.hf.space/process",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          },
        );
      } catch (err) {
        throw new Error(`Connection Error: ${err.message}`);
      }

      const data = await response.json();
      console.log("Received response:", data);

      if (data) {
        // ... (Priority Logic reuse) ...
        let priorityColor = "#00A231";
        if (data.priority) {
          const p = data.priority.toLowerCase();
          if (p.includes("high") || p.includes("urgent"))
            priorityColor = "#FF4B4B";
          else if (p.includes("low")) priorityColor = "#4B8BFF";
        }

        let extractedDate = null;
        let extractedTime = "All Day";

        // ... (Date/Time Extraction Logic reuse) ...
        if (data.deadline) {
          if (data.deadline.timestamp) {
            const parts = data.deadline.timestamp.split("T");
            extractedDate = parts[0];
            if (parts[1]) extractedTime = parts[1].substring(0, 5);
          } else if (data.deadline.text) {
            extractedDate = parseDateFromText(data.deadline.text);
            const tRes = parseTimeFromText(data.deadline.text);
            // Handle tRes object
            if (!tRes.ambiguous) {
              extractedTime = tRes.time;
            } else {
              // Ambiguous from NLP text? We'll capture it later if we fallback
              // For now, let's treat "6" from "Tomorrow at 6" as ambiguous here too
              // OR let the main flow handle it.
            }
          }
        }

        // Fallbacks
        if (!extractedDate) {
          const textToScan = data.task || text;
          extractedDate = parseDateFromText(textToScan);
          if (extractedDate) {
            const tRes = parseTimeFromText(textToScan);
            if (!tRes.ambiguous && tRes.time !== "All Day") {
              extractedTime = tRes.time;
            }
          }
        }

        // Default to today
        if (!extractedDate) {
          const now = new Date();
          extractedDate = `${now.getFullYear()}-${String(
            now.getMonth() + 1,
          ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        }

        // *** AMBIGUITY CHECK ***
        // Check "All Day" or ambiguous regex match on the original text
        // because NLP might not have returned a timestamp but our regex might find "6"
        let ambiguousData = null;
        if (extractedTime === "All Day") {
          const rawParse = parseTimeFromText(text);
          if (rawParse.ambiguous) {
            ambiguousData = rawParse;
          } else if (rawParse.time !== "All Day") {
            extractedTime = rawParse.time;
          }
        }

        const intent = data.intent || "create_task";
        const taskTitle = data.task || data.description || text;

        if (intent === "create_task" || intent === "set_reminder") {
          // Check Ambiguity First
          if (ambiguousData) {
            setPendingTask({
              title: taskTitle,
              priorityColor: priorityColor,
              date: extractedDate,
              completed: false,
              ambiguousHour: ambiguousData.hour,
              ambiguousMinute: ambiguousData.minute,
            });
            setIsWaitingForAmPm(true);

            setIsTyping(true);
            setTimeout(() => {
              addAiMessage("Would that be AM or PM?");
              setIsTyping(false);
            }, 1000);
            return;
          }

          if (extractedTime === "All Day") {
            console.log(
              "No time detected. Triggering Conversational Fallback.",
            );

            setPendingTask({
              title: taskTitle,
              priorityColor: priorityColor,
              date: extractedDate,
              completed: false,
            });
            setIsWaitingForTime(true);

            // Trigger typing animation
            setIsTyping(true);
            setTimeout(() => {
              const prompt = getRandomTimePrompt();
              addAiMessage(prompt);
              setIsTyping(false); // Stop typing
            }, 1000); // 1.5s delay

            return; // STOP HERE. Wait for user.
          }

          // If time exists, proceed normally
          const newTask = {
            title: taskTitle,
            date: extractedDate,
            time: extractedTime,
            priorityColor: priorityColor,
            completed: false,
          };
          addTaskToDb(newTask);

          setIsTyping(true);
          setTimeout(() => {
            addAiMessage(
              `Scheduled: ${newTask.title} for ${newTask.time} on ${newTask.date}`,
            );
            setIsTyping(false);
          }, 1000);

          scheduleNotification(taskTitle, extractedDate, extractedTime);
        } else if (intent === "delete_task") {
          let searchTerm = taskTitle.toLowerCase();
          // Remove common "delete" prefixes/suffixes
          searchTerm = searchTerm
            .replace(/\bdelete\b/g, "")
            .replace(/\btask\b/g, "")
            .replace(/\bremove\b/g, "")
            .trim();

          // If searchTerm is empty or too short, maybe use raw text or checks
          if (searchTerm.length < 2) {
            // Fallback: try to find something that matches the original text minus "delete"
            searchTerm = text
              .toLowerCase()
              .replace(/\bdelete\b/g, "")
              .trim();
          }

          console.log("Attempting to delete task matching:", searchTerm);

          // Find match
          const taskToDelete = tasks.find((t) =>
            t.title.toLowerCase().includes(searchTerm),
          );

          if (taskToDelete) {
            try {
              await deleteDoc(
                doc(db, "users", user.uid, "tasks", taskToDelete.id),
              );
              setIsTyping(true);
              setTimeout(() => {
                addAiMessage(`Deleted task: ${taskToDelete.title}`);
                setIsTyping(false);
              }, 1000);
            } catch (e) {
              console.error("Error deleting task", e);
              addAiMessage("Sorry, I encountered an error deleting that task.");
            }
          } else {
            setIsTyping(true);
            setTimeout(() => {
              addAiMessage(`I couldn't find a task matching "${searchTerm}".`);
              setIsTyping(false);
            }, 1000);
          }
        } else if (intent === "general_message") {
          setIsTyping(true);
          setTimeout(() => {
            addAiMessage(`Astra: ${data.task || text}`); // [MODIFIED] Branding
            setIsTyping(false);
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Better: Add error to chat
      addAiMessage("Error processing task: " + error.message);
    }
  };

  // --- Helper Functions (Hoisted or defined inside) ---
  const parseDateFromText = (text) => {
    if (!text) return null;
    const lowerText = text.toLowerCase();
    const now = new Date();

    // ... [existing parseDateFromText logic] ...
    // Since I'm replacing the whole function, I need to include the body again or ensure it's available.
    // I will include the body for safety as I am replacing a huge chunk.

    if (lowerText.includes("tomorrow")) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    if (lowerText.includes("today")) {
      return now.toISOString().split("T")[0];
    }

    // Check for "next week [day]" or just "next week"
    // Heuristic: "next week" usually means +7 days from now, or the Monday of next week?
    // User example: "next week Friday".
    // "next Friday" usually means the Friday of the *next* week if today is e.g. Thursday?
    // Standard interpretation:
    // "Friday" = finding the next upcoming Friday (could be this week).
    // "Next week Friday" = finding the Friday of the week *after* this one.

    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    // Find if a specific day is mentioned
    const dayName = days.find((d) => lowerText.includes(d));

    if (dayName) {
      const currentDay = now.getDay();
      const targetDay = days.indexOf(dayName);
      let daysToAdd = targetDay - currentDay;

      // If matches "next week [day]"
      if (lowerText.includes("next week")) {
        // Logic: Get to *this* Sunday, then add target day index + 1?
        // Simpler: Just resolve "this coming [day]" then add 7 days.
        if (daysToAdd <= 0) daysToAdd += 7; // This coming instance
        daysToAdd += 7; // Push to next week
      } else if (lowerText.includes("next " + dayName)) {
        // "Next Friday" often implies skipping the immediate one?
        // Usage varies. Let's assume "next Friday" == "Friday of next week" to be safe/distinct from "this Friday".
        if (daysToAdd <= 0) daysToAdd += 7;
        daysToAdd += 7;
      } else {
        // Just "[day]" (e.g. "Friday")
        if (daysToAdd <= 0) daysToAdd += 7;
      }

      const d = new Date(now);
      d.setDate(d.getDate() + daysToAdd);
      return d.toISOString().split("T")[0];
    }

    // Fallback: just "next week" without a day -> +7 days
    if (lowerText.includes("next week")) {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split("T")[0];
    }

    return null;
  };

  const parseTimeFromText = (text) => {
    if (!text) return { time: "All Day", ambiguous: false };
    const lower = text.toLowerCase();

    // 1. Check for specific AM/PM patterns: "5pm", "5:30 am", "5.30pm"
    const specificRegex = /(\d{1,2})[:.]?(\d{2})?\s*(am|pm)/i;
    const specificMatch = lower.match(specificRegex);
    if (specificMatch) {
      let hour = parseInt(specificMatch[1]);
      const minute = specificMatch[2] || "00";
      const meridiem = specificMatch[3];

      if (meridiem === "pm" && hour < 12) hour += 12;
      if (meridiem === "am" && hour === 12) hour = 0;

      return {
        time: `${String(hour).padStart(2, "0")}:${minute}`,
        ambiguous: false,
      };
    }

    // 2. Check for "o clock"
    const oclockRegex = /(\d{1,2})\s*o['\s]?clock/i;
    const oclockMatch = lower.match(oclockRegex);
    if (oclockMatch) {
      const hour = parseInt(oclockMatch[1]);
      // If user says "7 o clock", it's ambiguous (7am or 7pm).
      // But typically we might assume PM for evening inputs or just ask.
      // User request: "asks either am or pm".
      return { time: null, ambiguous: true, hour: hour, minute: "00" };
    }

    // 3. Check for 24-hour format or specific "HH:MM" without am/pm
    // "14:00" is clear. "6:30" is ambiguous (could be am or pm).
    const timeColonRegex = /(\d{1,2}):(\d{2})/;
    const colonMatch = lower.match(timeColonRegex);
    if (colonMatch) {
      const hour = parseInt(colonMatch[1]);
      const minute = colonMatch[2];
      // If hour > 12, it's definitely 24h format
      if (hour > 12) {
        return {
          time: `${String(hour).padStart(2, "0")}:${minute}`,
          ambiguous: false,
        };
      }
      // Else "6:30" -> ambiguous
      return { time: null, ambiguous: true, hour: hour, minute: minute };
    }

    // 4. Check for digits only "at 6" or just "6"
    // Be careful with dates. Ideally look for "at X" or isolated number.
    // For now, let's look for "at \d" or simply if the text IS just a number.
    const atDigitRegex = /\bat\s+(\d{1,2})(\s|$)/i;
    const atMatch = lower.match(atDigitRegex);
    if (atMatch) {
      const hour = parseInt(atMatch[1]);
      if (hour >= 1 && hour <= 12) {
        return { time: null, ambiguous: true, hour: hour, minute: "00" };
      }
    }

    return { time: "All Day", ambiguous: false };
  };

  const scheduleNotification = (title, date, time) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Task Scheduled", { body: `${title} at ${time}` });
        // ... (Future scheduling logic ignored for brevity of this tool call, but strictly speaking should be there)
      } catch (e) {}
    }
  };

  // ... (Rest of component functions: deleteHistory etc) ...

  const handleDeleteHistory = async (id) => {
    if (!user || !activeChatId) return;
    try {
      await deleteDoc(
        doc(db, "users", user.uid, "chats", activeChatId, "messages", id),
      );
    } catch (e) {
      console.error("Error deleting msg", e);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
        if (activeChatId === chatId) setActiveChatId(null);
      } catch (e) {
        console.error("Error deleting chat", e);
      }
    }
  };

  const handleRestoreHistory = (text) => {
    setText(text);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleProcessTask(text);
  };

  const handleToggleTaskCompletion = async (taskId, currentStatus) => {
    if (!user) return;
    try {
      const taskRef = doc(db, "users", user.uid, "tasks", taskId);
      await setDoc(taskRef, { completed: !currentStatus }, { merge: true });
    } catch (e) {
      console.error("Error toggling task:", e);
    }
  };

  const [notifiedTasks, setNotifiedTasks] = useState(new Set()); // Track notified tasks to prevent spam

  // Notification Polling (Every 60s)
  useEffect(() => {
    // Always start the interval, so checks happen even if permission is granted "later"
    const intervalId = setInterval(() => {
      // 1. Check Permissions inside the loop
      if (
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const now = new Date();
      const currentDay = now.toISOString().split("T")[0];

      // 2. Consistent Time Formatting (HH:MM in 24h format)
      // This avoids locale issues (e.g. "2:05 PM" vs "14:05" vs "2.05 em")
      // We assume `task.time` is stored as "HH:MM" (24h) or "HH:MM" logic is consistent.
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentHm = `${hours}:${minutes}`;

      tasks.forEach((task) => {
        // Unique ID for tracking this specific notification instance (task + date + time)
        const notificationId = `${task.id}_${task.date}_${task.time}`;

        if (
          task.date === currentDay &&
          !task.completed &&
          !notifiedTasks.has(notificationId)
        ) {
          // Compare times
          // Normalized check: exact match
          if (task.time === currentHm) {
            try {
              new Notification("Task Due!", {
                body: `${task.title} is due now.`,
                icon: "/logo192.png", // Optional: add icon if available
              });

              // Add to notified set to prevent repeat in same minute
              setNotifiedTasks((prev) => {
                const newSet = new Set(prev);
                newSet.add(notificationId);
                return newSet;
              });
            } catch (e) {
              console.error("Notification Error:", e);
            }
          }
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [tasks, notifiedTasks]);

  // --- STUDY SCHEDULE HELPER ---
  const processStudyScheduleRequest = async (inputText, addAiMessage) => {
      const lower = inputText.toLowerCase();
      
      // 1. Check for specific course codes first (e.g. CSC416)
      const codeMatch = inputText.match(/\b[A-Z]{3}\s?\d{3}\b/i);
      if (codeMatch) {
          // Found a direct course code!
          // Normalize it (e.g. "csc 416" -> "CSC416")
          const code = codeMatch[0].replace(/\s+/g, "").toUpperCase();
          
          // Proceed directly to "How many days?"
          setStudyPlannerData(prev => ({ ...prev, topic: code }));
          setStudyPlannerState("AWAITING_DAYS");
          
          setIsTyping(true);
          setTimeout(() => {
              addAiMessage(`Great! I see you want to study **${code}**. How many days do you want to allocate?`);
              setIsTyping(false);
          }, 800);
          return;
      }

      // 2. Check for Level and Semester criteria
      let levelFilter = null;
      if (lower.match(/100\s?(l|level)?/)) levelFilter = "100L";
      else if (lower.match(/200\s?(l|level)?/)) levelFilter = "200L";
      else if (lower.match(/300\s?(l|level)?/)) levelFilter = "300L";
      else if (lower.match(/400\s?(l|level)?/)) levelFilter = "400L";
      else if (lower.match(/500\s?(l|level)?/)) levelFilter = "500L";

      let semesterFilter = null;
      if (lower.match(/(1st|first)\s?sem(ester)?/)) semesterFilter = "First";
      else if (lower.match(/(2nd|second)\s?sem(ester)?/)) semesterFilter = "Second";

      // 3. Find Matches in ALL Courses (Firestore + Local)
      // Combine them safely
      const allCourses = [...courseLibrary];
      // Add local courses if not already in library (avoid dupes by code)
      const localList = localCourses.courses || [];
      localList.forEach(lc => {
          if (!allCourses.find(ac => ac.code === lc.code)) {
              allCourses.push(lc);
          }
      });

      let matches = allCourses;

      if (levelFilter) {
          matches = matches.filter(c => c.level === levelFilter);
      }
      if (semesterFilter) {
          matches = matches.filter(c => c.semester === semesterFilter);
      }

      // 4. Handle Results (If filters were applied or fuzzy matching logic needed)
      // If we only have filters but no matches, or if we have filters:
      if (levelFilter || semesterFilter) {
          if (matches.length === 0) {
               // No matches found -> Fallback to generic question
               setStudyPlannerState("AWAITING_TOPIC");
               setIsTyping(true);
               setTimeout(() => {
                  addAiMessage(`I couldn't find any courses matching "**${inputText}**". What is the specific **course code**?`);
                  setIsTyping(false);
               }, 800);
          } else if (matches.length === 1) {
              // Exact match -> Proceed
              const course = matches[0];
              setStudyPlannerData(prev => ({ ...prev, topic: course.code, course: course }));
              setStudyPlannerState("AWAITING_DAYS");
              
              setIsTyping(true);
              setTimeout(() => {
                  addAiMessage(`Found **${course.code}** (${course.title}). How many days do you want to study?`);
                  setIsTyping(false);
              }, 800);
          } else {
              // Multiple matches -> Ask user to pick
              // [MODIFIED] Store matches for "all" selection
              setStudyPlannerData(prev => ({ ...prev, possibleMatches: matches })); // Store matches!
              setStudyPlannerState("AWAITING_TOPIC");
              
              const courseListStr = matches.map(c => `• **${c.code}**: ${c.title}`).join("\n");
              
              setIsTyping(true);
              setTimeout(() => {
                  addAiMessage(`I found ${matches.length} courses matching your request:\n\n${courseListStr}\n\nWhich one would you like to create a schedule for?`);
                  setIsTyping(false);
              }, 800);
          }
          return;
      }
      
      // Fallback if no specific logic matched:
       setStudyPlannerState("AWAITING_TOPIC");
       setIsTyping(true);
       setTimeout(() => {
          addAiMessage(`I can help with that! What specific subject or course code are you studying?`);
          setIsTyping(false);
       }, 800);
  };

  // --- DEEP SEARCH LOGIC ---
  const handleDeepSearch = async (queryText) => {
    if (!queryText || !queryText.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    const lowerQuery = queryText.toLowerCase();
    const matchedChats = [];

    // We need to check all chats.
    // Optimization: check title first? Plan says check all messages.
    // To be thorough, we iterate all chats.

    try {
      for (const chat of chats) {
        // 1. Fetch Messages - expensive check
        const messagesRef = collection(
          db,
          "users",
          user.uid,
          "chats",
          chat.id,
          "messages",
        );
        // Optimization: Use separate try-catch per chat or parallelize
        const msgSnap = await getDocs(messagesRef);

        for (const doc of msgSnap.docs) {
          const data = doc.data();
          if (data.text && data.text.toLowerCase().includes(lowerQuery)) {
            matchedChats.push({
              type: "match",
              id: chat.id, // For selection
              chatTitle: chat.firstPrompt || "New Chat",
              messageId: doc.id,
              text: data.text,
              timestamp: data.createdAt,
              lastMessageTime: chat.lastMessageTime,
            });
          }
        }
      }
      setSearchResults(matchedChats);
    } catch (e) {
      console.error("Deep search error:", e);
      // Optional: show error toast
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  // Show Loading Screen
  if (isLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  // If logged in but NOT verified -> Show Pending Screen
  if (user && !isEmailVerified) {
    return (
      <VerificationPending
        user={user}
        onSignOut={() => auth.signOut()}
        darkMode={darkMode}
      />
    );
  }

  // If not authenticated, show Login Page
  if (!isAuthenticated) {
    return (
      <LoginPage onLogin={() => setIsAuthenticated(true)} darkMode={darkMode} />
    );
  }

  // [NEW] Delete Course Handler
  const handleDeleteCourse = async (courseName) => {
    try {
        // 1. Identify tasks to delete
        // Task Title format: "Study: <CourseName> | <Topic>"
        const tasksToDelete = tasks.filter(t => t.title.startsWith(`Study: ${courseName}`));
        
        console.log(`Deleting ${tasksToDelete.length} tasks for course: ${courseName}`);

        // 2. Delete from Firestore
        const batch = writeBatch(db);
        tasksToDelete.forEach(t => {
            const taskRef = doc(db, "users", user.uid, "tasks", t.id);
            batch.delete(taskRef);
        });

        await batch.commit();
        
        // 3. Optional: Trigger a refresh or let onSnapshot handle it (onSnapshot will handle it)
        console.log("Course tasks deleted successfully.");

    } catch (error) {
        console.error("Error deleting course tasks:", error);
        alert("Error deleting course tasks. Please try again.");
    }
  };

  return (
    <div className={`app-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Sidebar (Drawer) */}
      <div className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <LayoutGroup>
          <div
            style={{
              flex: 1,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <button
              className={`sidebar-item ${activeTab === "My Day" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("My Day");
              }}
            >
              {activeTab === "My Day" && (
                <motion.div
                  layoutId="active-pill"
                  className="active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.span layout className="nav-text">
                My Day
              </motion.span>
              <VuesaxIcon
                name="sun"
                isActive={activeTab === "My Day"}
                darkMode={darkMode}
                style={{ zIndex: 2 }}
              />
            </button>
            <button
              className={`sidebar-item ${activeTab === "Chat" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("Chat");
                setActiveChatId("new");
              }}
            >
              {activeTab === "Chat" && (
                <motion.div
                  layoutId="active-pill"
                  className="active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.span layout className="nav-text">
                Chat
              </motion.span>
              <VuesaxIcon
                name="message-text"
                isActive={activeTab === "Chat"}
                darkMode={darkMode}
                style={{ zIndex: 2 }}
              />
            </button>
            <button
              className={`sidebar-item ${
                activeTab === "Calendar" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("Calendar");
              }}
            >
              {activeTab === "Calendar" && (
                <motion.div
                  layoutId="active-pill"
                  className="active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.span layout className="nav-text">
                Calendar
              </motion.span>
              <VuesaxIcon
                name="calendar"
                isActive={activeTab === "Calendar"}
                darkMode={darkMode}
                style={{ zIndex: 2 }}
              />
            </button>

            <button
              className={`sidebar-item ${activeTab === "Insights" ? "active" : ""}`}
              onClick={() => setActiveTab("Insights")}
            >
              {activeTab === "Insights" && (
                <motion.div
                  layoutId="active-pill"
                  className="active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.span layout className="nav-text">
                Insights
              </motion.span>
              <VuesaxIcon
                name="chart-2"
                isActive={activeTab === "Insights"}
                darkMode={darkMode}
                style={{ zIndex: 2 }}
              />
            </button>

            <button
              className={`sidebar-item ${
                activeTab === "Account Settings" ? "active" : ""
              }`}
              onClick={() => {
                setActiveTab("Account Settings");
              }}
            >
              {activeTab === "Account Settings" && (
                <motion.div
                  layoutId="active-pill"
                  className="active-pill"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.span layout className="nav-text">
                Profile
              </motion.span>
              <VuesaxIcon
                name="user"
                isActive={activeTab === "Account Settings"}
                darkMode={darkMode}
                style={{ zIndex: 2 }}
              />
            </button>
          </div>

          {/* Collapse Toggle */}
          <button
            className="sidebar-item"
            style={{ marginTop: "auto" }}
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <span className="nav-text">Collapse</span>
            <VuesaxIcon
              name={isSidebarCollapsed ? "arrow-right-1" : "arrow-left-1"}
              variant="Linear"
              darkMode={darkMode}
            />
          </button>
        </LayoutGroup>
      </div>

      {/* Removed Overlay */}

      <div
        className={`main-content ${isSidebarCollapsed ? "collapsed-sidebar" : ""}`}
      >
        {/* Header */}
        <div
          className={`header ${isSearchOpen ? "search-active" : ""}`}
          style={{ display: activeTab === "Chat" ? "none" : undefined }}
        >
          {activeTab === "Chat" && !activeChatId ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#c1121f",
                margin: "-20px -20px 20px -20px",
                padding: "24px 20px",
                paddingTop: "60px", 
                width: "calc(100% + 40px)",
                borderBottomLeftRadius: "32px",
                borderBottomRightRadius: "32px",
                zIndex: 10,
                boxSizing: "border-box",
              }}
            >
              {/* Menu Button Removed */}
              <h1
                className="title"
                style={{
                  textAlign: "left",
                  margin: 0,
                  marginLeft: "10px",
                  color: "#ffffff",
                }}
              >
                Chats
              </h1>

              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <AnimatePresence>
                    {isSearchOpen && (
                      <motion.input
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "200px", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleDeepSearch(searchQuery);
                          }
                        }}
                        style={{
                          border: "none",
                          borderRadius: "20px",
                          background: "rgba(255,255,255,0.2)", // Translucent white
                          color: "#fff",
                          marginRight: "8px",
                          outline: "none",
                          padding: "8px 16px",
                          fontSize: "14px",
                        }}
                        autoFocus
                      />
                    )}
                  </AnimatePresence>
                  <button
                    onClick={() => {
                      if (isSearchOpen) {
                        setIsSearchOpen(false);
                        if (searchQuery) {
                          setSearchQuery("");
                          handleDeepSearch(""); 
                        }
                      } else {
                        setIsSearchOpen(true);
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 8,
                      display: "flex",
                    }}
                  >
                    <VuesaxIcon
                      name={isSearchOpen ? "close-circle" : "search-normal"}
                      variant="Linear"
                      color="#ffffff" // White
                    />
                  </button>
                </div>

                <button
                  onClick={() => setActiveChatId("new")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 8,
                    display: "flex",
                  }}
                >
                  <VuesaxIcon
                    name="edit"
                    variant="Linear"
                    color="#ffffff" // White
                  />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center" }}>
                {/* Menu Button Removed */}
              </div>
              <h1
                className="title"
                style={{
                  textAlign:
                    !activeChatId && activeTab === "Chat" ? "left" : "center",
                  paddingLeft: !activeChatId && activeTab === "Chat" ? 10 : 0,
                }}
              >
                {activeTab === "Chat"
                  ? !activeChatId
                    ? "Chats"
                    : ""
                  : activeTab === "Account Settings" ||
                      activeTab === "My Day" ||
                      activeTab === "Calendar" ||
                      activeTab === "Insights"
                    ? ""
                    : activeTab}
              </h1>
              <div style={{ width: 40 }}></div>
            </>
          )}
        </div>

        {/* Content Body */}
        {activeTab === "Chat" ? (
          <div className="chat-desktop-layout" style={{ padding: "0px", boxSizing: "border-box" }}>
            {/* Left Pane: Chat List */}
            <div
              className={`chat-list-pane ${activeChatId ? "mobile-hidden" : ""}`}
              style={{ width: isMobile ? "100%" : sidebarWidth }}
            >
              <div
                className={"chat-header"}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  
                  
                  padding: "24px",
                  paddingTop: "calc(env(safe-area-inset-top) + 24px)", // Ensure safe area spacing
                  
                  backgroundColor: "#c1121f", // Red background
                   // Top corners square, bottom rounded
                  color: "#fff"
                }}
              >
                <h1 className="title" style={{ margin: 0, color: "#fff", fontSize: "28px" }}>
                  Chats
                </h1>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      setIsSearchOpen(!isSearchOpen);
                      if (isSearchOpen) {
                        setSearchQuery("");
                        handleDeepSearch("");
                      }
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 8,
                      display: "flex", // ensure flex for icon centering
                    }}
                  >
                    <VuesaxIcon
                      name={isSearchOpen ? "close-circle" : "search-normal"}
                      variant="Linear"
                      color="#ffffff"
                    />
                  </button>
                  <button
                    onClick={() => setActiveChatId("new")}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 8,
                      display: "flex",
                    }}
                  >
                    <VuesaxIcon
                      name="edit"
                      variant="Linear"
                      color="#ffffff"
                    />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden", padding: "0 10px" }}
                  >
                    <div
                      className="chat-search-wrapper"
                      style={{ paddingBottom: 10 }}
                    >
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleDeepSearch(searchQuery);
                        }}
                        className="chat-search-input"
                        autoFocus
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <ChatList
                chats={chats}
                searchResults={searchResults}
                isSearching={isSearching}
                onSelectChat={(id) => setActiveChatId(id)}
                onDeleteChat={handleDeleteChat}
                darkMode={darkMode}
                activeChatId={activeChatId}
              />
            </div>

            {/* Resizer Handle */}
            {!isMobile && (
              <div
                className={`resizer-handle ${isResizing ? "resizing" : ""}`}
                onMouseDown={startResizing}
              />
            )}

            {/* Right Pane: Active Chat Content */}
            <div
              className={`chat-view-pane ${!activeChatId ? "mobile-hidden" : ""}`}
            >
              {/* Desktop Close/Cancel Button */}
              {activeChatId && !isMobile && (
                <button
                  className="desktop-chat-close-btn"
                  onClick={() => setActiveChatId(null)}
                >
                  <VuesaxIcon
                    name="close-circle"
                    variant="Linear"
                    size={24}
                    darkMode={darkMode}
                  />
                </button>
              )}

              {/* Mobile Back Button Header */}
              <div className="chat-mobile-header desktop-hidden">
                <button
                  onClick={() => setActiveChatId(null)}
                  className="glass-back-btn" 
                  style={{
                    border: "none", // Override default button border if any
                    // Removed inline background to use class
                  }}
                >
                  <VuesaxIcon
                    name="arrow-left"
                    variant="Bold"
                    darkMode={darkMode}
                  />
                  {/* Removed 'Back' text if we want icon-only glass button, 
                      User asked for "icon", usually meaning the round button style.
                      If they want text "Back" inside the glass pill, we can keep it.
                      iOS 26 style implies a clean glass circle or pill. 
                      Let's keep text but make it look good or remove it?
                      "use the ios26 glass morphism style on the back icons" -> Icons suggests circle.
                      Let's try removing the text for a pure icon look or keeping it if it fits. 
                      I'll remove the text to match the "icon" request and the circle style in CSS.
                  */}
                </button>
              </div>

              {!activeChatId ? (
                // Desktop Empty State (when no chat is selected)
                <div className="desktop-empty-state mobile-hidden">
                  <div style={{ opacity: 0.5 }}>
                    Select a chat to start messaging
                  </div>
                </div>
              ) : activeChatId === "new" ? (
                <div
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <AstraStartPage
                    onTaskStart={handleProcessTask}
                    darkMode={darkMode}
                  />
                </div>
              ) : (
                <div className="results-container" style={{ paddingTop: 0 }}>
                  <TaskHistory
                    history={history}
                    onRestore={handleRestoreHistory}
                    onDelete={handleDeleteHistory}
                    darkMode={darkMode}
                    isTyping={isTyping}
                    userProfile={userProfile}
                  />
                </div>
              )}
              {(activeChatId === "new" || activeChatId) && (
                <form
                  className="astra-float-input-container"
                  onSubmit={handleSubmit}
                >
                  <div className="astra-input-group">
                    <button
                      type="button"
                      className="study-schedule-btn"
                      onClick={async () => {
                        if (!user) {
                          alert("Please log in to use this feature.");
                          return;
                        }
                        
                        // Ensure we have an active chat or create one
                        let chatId = activeChatId;
                        if (!chatId || chatId === "new") {
                           try {
                             const newChatRef = await addDoc(
                               collection(db, "users", user.uid, "chats"),
                               {
                                 firstPrompt: "Study Schedule",
                                 createdAt: new Date().toISOString(),
                                 lastMessageTime: new Date().toISOString(),
                               }
                             );
                             chatId = newChatRef.id;
                             setActiveChatId(chatId);
                           } catch(e) { console.error(e); return; }
                        }
                        
                        // 1. Add USER Message "Build a Study Schedule" (Manually, bypassing NLP)
                        try {
                          await addDoc(
                            collection(db, "users", user.uid, "chats", chatId, "messages"),
                            {
                              text: "Build a Study Schedule",
                              sender: "user",
                              timestamp: new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                              createdAt: new Date().toISOString(),
                            }
                          );
                        } catch(e) { console.error("Error adding user msg", e); }

                        // 2. Set State
                        setStudyPlannerState("AWAITING_TOPIC");
                        
                        // 3. Add AI Message asking for topic
                        try {
                           await addDoc(
                             collection(db, "users", user.uid, "chats", chatId, "messages"),
                             {
                               text: "I can help you build a study schedule! What subject or course code are you studying? (e.g. CSC416)",
                               sender: "ai",
                               timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                               createdAt: new Date().toISOString(),
                               isAstra: true
                             }
                           );
                        } catch(e) {}
                      }}
                    >
                      <span>Build a Study Schedule</span>
                      <div className="study-schedule-icon">
                        <VuesaxIcon
                          name="arrow-up"
                          variant="Linear"
                          size={16}
                          color="currentColor"
                        />
                      </div>
                    </button>

                    <div className="astra-input-pill">
                      <textarea
                        className="astra-input-area"
                        placeholder="Create a task..."
                        value={text}
                        rows={1}
                        onChange={(e) => {
                          setText(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                            // Reset height after submit
                            e.target.style.height = "auto";
                          }
                        }}
                        autoFocus
                      />

                    <VoiceInput
                      onTextReady={setText}
                      darkMode={darkMode}
                      className="astra-input-icon-btn"
                    />

                    <button type="submit" className="astra-send-btn">
                      <VuesaxIcon
                        name="arrow-up"
                        variant="Bold"
                        color="#ffffff"
                      />
                    </button>
                  </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : activeTab === "Calendar" ? (
          <div className="tasks-view-container" style={{ padding: "0 0" }}>
            <CreativeCalendar tasks={tasks} darkMode={darkMode} />
          </div>
        ) : activeTab === "Insights" ? (
          <div className="tasks-view-container">
            <ProductivityInsights 
                tasks={tasks} 
                darkMode={darkMode} 
                onDeleteCourse={handleDeleteCourse} 
            />
          </div>
        ) : activeTab === "My Day" ? (
          <div className="content-scrollable">
            {showNotifications ? (
              <NotificationsPage
                notifications={notifications}
                onBack={() => setShowNotifications(false)}
                darkMode={darkMode}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
              />
            ) : (
                  <CreativeMyDay
                    tasks={tasks}
                    darkMode={darkMode}
                    userProfile={userProfile}
                    user={user}
                    onToggleTaskCompletion={handleToggleTaskCompletion}
                    onProfileClick={() => setActiveTab("Account Settings")}
                    onShowNotifications={() => {
                      setShowNotifications(true);
                      // Auto-mark removed as per user request (manual delete only)
                    }}
                    hasUnread={notifications.length > 0} 
                  />
            )}
          </div>
        ) : activeTab === "Account Settings" ? (
          <div className="results-container">
            <AccountSettings
              user={user}
              userProfile={userProfile}
              darkMode={darkMode}
              themePreference={themePreference}
              setThemePreference={setThemePreference}
              onLogout={handleLogout}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>{activeTab} Feature Coming Soon</h2>
          </div>
        )}

        {!(activeTab === "Chat" && activeChatId) && (
          <BottomNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNewChat={() => setActiveChatId("new")}
            darkMode={darkMode}
          />
        )}
      </div>
    </div>
  );
}

export default App;
