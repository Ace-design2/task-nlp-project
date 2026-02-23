import React, { useState, useEffect, useRef } from "react";
import "./AccountSettings.css";
import VuesaxIcon from "./VuesaxIcon";
import { db } from "../firebase"; // Removed storage imports
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const AccountSettings = ({
  user,
  userProfile,
  darkMode,
  themePreference,
  setThemePreference,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [newPhotoBase64, setNewPhotoBase64] = useState(null);
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Connected Apps State
  const [showConnectedApps, setShowConnectedApps] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [twitterUsername, setTwitterUsername] = useState("");
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [isConnectingTwitter, setIsConnectingTwitter] = useState(false);
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      if (userProfile?.photoBase64) {
        setPhotoURL(userProfile.photoBase64);
      } else {
        setPhotoURL(user.photoURL || "");
      }
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (userProfile?.phone) setPhone(userProfile.phone);
    if (userProfile?.department) setDepartment(userProfile.department);
    if (userProfile?.level) setLevel(userProfile.level);
    
    // Connected apps defaults
    if (userProfile?.connectedApps) {
      if (userProfile.connectedApps.twitter?.connected) {
         setTwitterConnected(true);
         setTwitterUsername(userProfile.connectedApps.twitter.username || "");
      }
      if (userProfile.connectedApps.github?.connected) {
         setGithubConnected(true);
         setGithubUsername(userProfile.connectedApps.github.username || "");
      }
    }
  }, [userProfile]);

  // Force Red Status Bar
  useEffect(() => {
    const applyRedTheme = () => {
       const metaThemeColor = document.querySelector("meta[name='theme-color']");
       if (metaThemeColor) metaThemeColor.setAttribute("content", "#c1121f");
       document.body.style.backgroundColor = "#c1121f";
    };
    applyRedTheme();
    return () => {};
  }, [darkMode]);

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e) => {
    if (e.target.files[0]) {
      try {
        const base64 = await processImage(e.target.files[0]);
        setNewPhotoBase64(base64);
        setPhotoURL(base64);
      } catch (err) {
        console.error("Image processing error", err);
        alert("Could not process image.");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (user) {
        await updateProfile(user, { displayName: name });
      }

      if (user) {
        const userData = {
          phone: phone,
          email: user.email,
          updatedAt: new Date().toISOString(),
          displayName: name,
          department: department,
          level: level,
        };

        if (newPhotoBase64) {
          userData.photoBase64 = newPhotoBase64;
        }

        await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      }

      setIsEditing(false);
      setNewPhotoBase64(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save profile: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectTwitter = async () => {
    if (!twitterUsername.trim() && !twitterConnected) {
       alert("Please enter your X/Twitter username to connect.");
       return;
    }
    
    setIsConnectingTwitter(true);
    
    try {
      const newState = !twitterConnected;
      const appData = {
         connectedApps: {
           ...(userProfile?.connectedApps || {}),
           twitter: {
              connected: newState,
              username: newState ? twitterUsername : "",
              connectedAt: newState ? new Date().toISOString() : null
           }
         }
      };
      
      await setDoc(doc(db, "users", user.uid), appData, { merge: true });
      
      setTwitterConnected(newState);
      if (!newState) setTwitterUsername("");
      
    } catch (e) {
       console.error("Error updating X connection:", e);
       alert("Failed to update connection status.");
    } finally {
      setIsConnectingTwitter(false);
    }
  };

  const handleConnectGithub = async () => {
    if (!githubUsername.trim() && !githubConnected) {
       alert("Please enter your GitHub username to connect.");
       return;
    }
    
    setIsConnectingGithub(true);
    
    try {
      const newState = !githubConnected;
      const appData = {
         connectedApps: {
           ...(userProfile?.connectedApps || {}),
           github: {
              connected: newState,
              username: newState ? githubUsername : "",
              connectedAt: newState ? new Date().toISOString() : null
           }
         }
      };
      
      await setDoc(doc(db, "users", user.uid), appData, { merge: true });
      
      setGithubConnected(newState);
      if (!newState) setGithubUsername("");
      
    } catch (e) {
       console.error("Error updating GitHub connection:", e);
       alert("Failed to update connection status.");
    } finally {
      setIsConnectingGithub(false);
    }
  };

  return (
    <div className={`settings-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="settings-content-wrapper">
        <div className="profile-left-col">
          {/* --- RED HEADER CARD --- */}
          <div className="profile-header-card">
             {/* Top Row: Avatar and Edit Icon */}
             <div className="header-top-row">
                <div 
                  className={`avatar-container ${isEditing ? "editable" : ""}`}
                  onClick={() => isEditing && fileInputRef.current.click()}
                >
                    {photoURL ? (
                        <img src={photoURL} alt="Profile" className="avatar-img" />
                    ) : (
                        <div className="avatar-placeholder">
                            {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
                        </div>
                    )}
                    {isEditing && (
                        <div className="avatar-overlay">
                            <VuesaxIcon name="camera" variant="Bold" color="#fff" />
                        </div>
                    )}
                     <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                </div>

                 {/* Edit Icon Button (Chat Style) */}
                 <motion.button 
                    className="header-edit-btn-chat-style" 
                    onClick={() => setIsEditing(!isEditing)}
                    whileHover={{ scale: 1.1, rotate: 15 }}
                    whileTap={{ scale: 0.9, rotate: -15 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                 >
                    <VuesaxIcon 
                      name={isEditing ? "close-circle" : "edit"} 
                      variant="Linear" 
                      color="#ffffff" 
                      size={24} 
                    />
                 </motion.button>
             </div>

             {/* Bottom Row: Info Group */}
             <div className="header-info-group" style={{ position: "relative", minHeight: "80px" }}>
                <AnimatePresence mode="popLayout">
                  {!isEditing ? (
                      <motion.div
                          key="view-info"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      >
                          <h2 className="header-name">{name || "User Name"}</h2>
                          <p className="header-email">{user?.email}</p>
                          <p className="header-phone">{phone || "+234 00 0000 0000"}</p>
                      </motion.div>
                  ) : (
                       /* Edit Mode Inputs (Header) */
                      <motion.div
                          key="edit-info"
                          className="header-edit-fields"
                          initial={{ opacity: 0, y: -15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 15 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      >
                          <input 
                              className="header-input" 
                              value={name} 
                              onChange={(e) => setName(e.target.value)} 
                              placeholder="Name"
                          />
                           <input 
                              className="header-input" 
                              value={phone} 
                              onChange={(e) => setPhone(e.target.value)} 
                              placeholder="Phone"
                          />
                      </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>

          {/* --- DEPARTMENT & LEVEL CARD --- */}
          <div className="profile-section-card dark-card">
              <div className="card-row">
                  <div className="card-icon-box">
                      <VuesaxIcon name="book" variant="Linear" color={darkMode ? "#fff" : "#333"} />
                  </div>
                  <div className="card-col" style={{ position: "relative" }}>
                      <AnimatePresence mode="popLayout">
                        {!isEditing ? (
                             <motion.div
                                key="view-dept"
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 15 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                             >
                               <h3 className="card-title">{department || userProfile?.department || "No Department"}</h3>
                               <p className="card-subtitle">{level || userProfile?.level ? `Currently in ${level || userProfile?.level}` : "No Level Selected"}</p>
                             </motion.div>
                        ) : (
                             <motion.div
                                key="edit-dept"
                                className="edit-row-inputs"
                                initial={{ opacity: 0, x: 15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -15 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                             >
                                  <select className="card-input" value={department} onChange={(e) => setDepartment(e.target.value)}>
                                      <option value="" disabled>Select Dept</option>
                                      <option value="Computer Science">Computer Science</option>
                                      <option value="Chemistry">Chemistry</option>
                                      <option value="Physics">Physics</option>
                                      <option value="Mathematics">Mathematics</option>
                                      <option value="Statistics">Statistics</option>
                                  </select>
                                  <select className="card-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                                      <option value="" disabled>Select Level</option>
                                      <option value="100 Level">100 Level</option>
                                      <option value="200 Level">200 Level</option>
                                      <option value="300 Level">300 Level</option>
                                      <option value="400 Level">400 Level</option>
                                  </select>
                             </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
                  
                  {/* Save Button if Editing */}
                  {isEditing && (
                     <button className="save-mini-btn" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "..." : "Save"}
                     </button>
                  )}
              </div>
          </div>
        </div>

        <div className="profile-right-col">
          {/* --- MENU ITEM: CONNECTED APPS --- */}
          <div className="profile-menu-card" onClick={() => setShowConnectedApps(true)}>
              <div className="menu-item">
                  <div className="menu-left">
                      <div className="menu-icon">
                          <VuesaxIcon name="link" variant="Linear" color={darkMode? "#fff":"#333"} />
                      </div>
                      <span className="menu-label">Connected Apps</span>
                  </div>
                  <VuesaxIcon name="arrow-right" variant="Linear" color={darkMode? "#fff":"#333"} size={18} />
              </div>
          </div>

          {/* --- MENU ITEM: DARK MODE --- */}
          <div className="profile-menu-card">
              <div className="menu-item vertical-mobile">
                  <div className="menu-left">
                      <div className="menu-icon">
                          <VuesaxIcon name="moon" variant="Linear" color={darkMode? "#fff":"#333"} />
                      </div>
                      <span className="menu-label">App Theme</span>
                  </div>
                  
                  {/* Selector */}
                  <div className="theme-selector">
                      <button 
                        className={`theme-opt ${themePreference === 'system' ? 'active' : ''}`}
                        onClick={() => setThemePreference('system')}
                      >
                        System
                      </button>
                      <button 
                        className={`theme-opt ${themePreference === 'dark' ? 'active' : ''}`}
                        onClick={() => setThemePreference('dark')}
                      >
                        Dark
                      </button>
                      <button 
                        className={`theme-opt ${themePreference === 'light' ? 'active' : ''}`}
                        onClick={() => setThemePreference('light')}
                      >
                        Light
                      </button>
                  </div>
              </div>
          </div>

          {/* --- MENU ITEM: LOGOUT --- */}
          <div className="profile-menu-card" onClick={onLogout}>
              <div className="menu-item">
                  <div className="menu-left">
                      <div className="menu-icon">
                          <VuesaxIcon name="logout" variant="Linear" color={darkMode? "#fff":"#333"} />
                      </div>
                      <span className="menu-label">Log Out</span>
                  </div>
              </div>
          </div>

          <div
            className="version-info"
            style={{
              textAlign: "center",
              color: "#aaa",
              fontSize: "12px",
              paddingBottom: "20px",
              marginTop: "20px"
            }}
          >
            <p>Astra to-do v0.1.0</p>
          </div>
        </div>
      </div>

      {/* --- CONNECTED APPS MODAL --- */}
      <AnimatePresence>
        {showConnectedApps && (
          <motion.div
            className="connected-apps-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConnectedApps(false)}
          >
            <motion.div
              className={`connected-apps-modal ${darkMode ? "dark" : ""}`}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="connected-apps-header">
                <h2>Connected Apps</h2>
                <button onClick={() => setShowConnectedApps(false)} className="close-modal-btn">
                  <VuesaxIcon name="close-circle" variant="Linear" color={darkMode ? "#fff" : "#333"} size={24} />
                </button>
              </div>

              <div className="connected-apps-list">
                {/* Twitter / X */}
                <div className="connected-app-item">
                  <div className="app-info-row">
                    <div className="app-icon twitter-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <div className="app-details">
                      <h3>X (Twitter)</h3>
                      <p>{twitterConnected ? `Connected as @${twitterUsername}` : "Connect your X account"}</p>
                    </div>
                  </div>
                  
                  {!twitterConnected && (
                    <input 
                      type="text" 
                      className="app-username-input" 
                      placeholder="Username (e.g., elonmusk)"
                      value={twitterUsername}
                      onChange={(e) => setTwitterUsername(e.target.value)}
                    />
                  )}
                  
                  <button 
                    className={`app-connect-btn ${twitterConnected ? 'disconnect' : ''}`}
                    onClick={handleConnectTwitter}
                    disabled={isConnectingTwitter}
                  >
                    {isConnectingTwitter ? "..." : (twitterConnected ? "Disconnect" : "Connect")}
                  </button>
                </div>

                {/* GitHub */}
                <div className="connected-app-item">
                  <div className="app-info-row">
                    <div className="app-icon github-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 10 0 0 12 2z"/>
                      </svg>
                    </div>
                    <div className="app-details">
                      <h3>GitHub</h3>
                      <p>{githubConnected ? `Connected as ${githubUsername}` : "Connect your GitHub account"}</p>
                    </div>
                  </div>
                  
                  {!githubConnected && (
                    <input 
                      type="text" 
                      className="app-username-input" 
                      placeholder="Username (e.g., torvalds)"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                    />
                  )}
                  
                  <button 
                    className={`app-connect-btn ${githubConnected ? 'disconnect' : ''}`}
                    onClick={handleConnectGithub}
                    disabled={isConnectingGithub}
                  >
                    {isConnectingGithub ? "..." : (githubConnected ? "Disconnect" : "Connect")}
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AccountSettings;
