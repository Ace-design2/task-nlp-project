import React, { useState, useEffect, useRef } from "react";
import "./AccountSettings.css";
import VuesaxIcon from "./VuesaxIcon";
import { db } from "../firebase"; // Removed storage imports
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

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
                 <button 
                    className="header-edit-btn-chat-style" 
                    onClick={() => setIsEditing(!isEditing)}
                 >
                    <VuesaxIcon 
                      name={isEditing ? "close-circle" : "edit"} 
                      variant="Linear" 
                      color="#ffffff" 
                      size={24} 
                    />
                 </button>
             </div>

             {/* Bottom Row: Info Group */}
             <div className="header-info-group">
                {!isEditing ? (
                    <>
                        <h2 className="header-name">{name || "User Name"}</h2>
                        <p className="header-email">{user?.email}</p>
                        <p className="header-phone">{phone || "+234 00 0000 0000"}</p>
                    </>
                ) : (
                     /* Edit Mode Inputs (Header) */
                    <div className="header-edit-fields">
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
                    </div>
                )}
             </div>
          </div>

          {/* --- DEPARTMENT & LEVEL CARD --- */}
          <div className="profile-section-card dark-card">
              <div className="card-row">
                  <div className="card-icon-box">
                      <VuesaxIcon name="book" variant="Linear" color={darkMode ? "#fff" : "#333"} />
                  </div>
                  <div className="card-col">
                      {!isEditing ? (
                           <>
                             <h3 className="card-title">{department || userProfile?.department || "No Department"}</h3>
                             <p className="card-subtitle">{level || userProfile?.level ? `Currently in ${level || userProfile?.level}` : "No Level Selected"}</p>
                           </>
                      ) : (
                           <div className="edit-row-inputs">
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
                           </div>
                      )}
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
          <div className="profile-menu-card">
              <div className="menu-item">
                  <div className="menu-left">
                      <div className="menu-icon">
                          <VuesaxIcon name="mobile" variant="Linear" color={darkMode? "#fff":"#333"} />
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
                      <span className="menu-label">Dark Mode</span>
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

    </div>
  );
};

export default AccountSettings;
