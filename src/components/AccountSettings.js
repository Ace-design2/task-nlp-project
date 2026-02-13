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
  setDarkMode,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [newPhotoBase64, setNewPhotoBase64] = useState(null); // Changed to Base64
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      // Prefer Firestore base64 photo if available, else Auth photo
      if (userProfile?.photoBase64) {
        setPhotoURL(userProfile.photoBase64);
      } else {
        setPhotoURL(user.photoURL || "");
      }
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (userProfile?.phone) {
      setPhone(userProfile.phone);
    }
    if (userProfile?.department) {
      setDepartment(userProfile.department);
    }
    if (userProfile?.level) {
      setLevel(userProfile.level);
    }
  }, [userProfile]);

  // Helper to resize and convert to Base64
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300; // Small size for Firestore limit (1MB doc max)
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
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Minimize quality
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
        setPhotoURL(base64); // Preview
      } catch (err) {
        console.error("Image processing error", err);
        alert("Could not process image.");
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Update Auth Profile (Display Name only, or photoURL if we want to try setting data URI - optional but often fails length)
      if (user) {
        await updateProfile(user, {
          displayName: name,
          // photoURL: newPhotoBase64 // Often too long for Auth photoURL (2048 chars limit). We rely on Firestore.
        });
      }

      // 2. Save Phone & Photo to Firestore
      if (user) {
        const userData = {
          phone: phone,
          email: user.email,
          updatedAt: new Date().toISOString(),
          displayName: name,
          department: department,
          level: level
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
      <div className="settings-header">
        <h2>Account</h2>
        {!isEditing && (
          <button
            className="edit-profile-text-btn"
            onClick={() => setIsEditing(true)}
            aria-label="Edit Profile"
          >
            Edit profile
          </button>
        )}
      </div>

      <div className="settings-section">
        <div className="user-profile">
          <div
            className={`avatar-wrapper ${isEditing ? "editable" : ""}`}
            onClick={() => isEditing && fileInputRef.current.click()}
          >
            {photoURL ? (
              <img src={photoURL} alt="Profile" className="avatar-image" />
            ) : (
              <div className="avatar-placeholder">
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
            )}
            {isEditing && (
              <div className="avatar-overlay">
                <VuesaxIcon
                  name="camera"
                  variant="Bold"
                  darkMode={true}
                  style={{ color: "#fff" }}
                />
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

          <div className="user-info">
            {isEditing ? (
              <div className="edit-fields">
                <input
                  className="edit-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                />
                <input
                  className="edit-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number"
                />
                
                <select 
                   className="edit-input" 
                   value={department} 
                   onChange={(e) => setDepartment(e.target.value)}
                >
                   <option value="" disabled>Select Department</option>
                   <option value="Computer Science">Computer Science</option>
                   <option value="Chemistry">Chemistry</option>
                   <option value="Physics">Physics</option>
                   <option value="Mathematics">Mathematics</option>
                   <option value="Statistics">Statistics</option>
                </select>

                <select 
                   className="edit-input" 
                   value={level} 
                   onChange={(e) => setLevel(e.target.value)}
                >
                   <option value="" disabled>Select Level</option>
                   <option value="100 Level">100 Level</option>
                   <option value="200 Level">200 Level</option>
                   <option value="300 Level">300 Level</option>
                   <option value="400 Level">400 Level</option>
                </select>
              </div>
            ) : (
              <>
                <h3 className="user-name">{user?.displayName || "User"}</h3>
                <p className="user-email">{user?.email || "Anonymous"}</p>
                {phone && <p className="user-phone">{phone}</p>}
                {department && <p className="user-detail">Department: {department}</p>}
                {level && <p className="user-detail">Level: {level}</p>}
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="edit-actions">
            <button
              className="cancel-btn"
              onClick={() => {
                setIsEditing(false);
                setName(user?.displayName || "");
                setPhone(userProfile?.phone || "");
                setDepartment(userProfile?.department || "");
                setLevel(userProfile?.level || "");
                setPhotoURL(user?.photoURL || "");
                setNewPhotoBase64(null);
              }}
            >
              Cancel
            </button>
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <div className="settings-item">
          <div className="item-label">
            <VuesaxIcon name="moon" variant="Bold" darkMode={darkMode} />
            <span>Dark Mode</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <button className="logout-button" onClick={onLogout}>
          <VuesaxIcon
            name="logout"
            variant="Bold"
            darkMode={darkMode}
            style={{ color: "#FF4B4B" }}
          />
          <span>Log Out</span>
        </button>
      </div>

      <div className="version-info">
        <p>Astra to-do v0.1.0</p>
      </div>
    </div>
  );
};

export default AccountSettings;
