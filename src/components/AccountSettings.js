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
      // 1. Update Auth Profile (Display Name only)
      if (user) {
        await updateProfile(user, {
          displayName: name,
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
      {/* --- HEADER --- */}
      <div className="profile-header">
        <div
          className={`profile-avatar-wrapper ${isEditing ? "editable" : ""}`}
          onClick={() => isEditing && fileInputRef.current.click()}
        >
          {photoURL ? (
            <img src={photoURL} alt="Profile" className="profile-avatar" />
          ) : (
            <div
              className="profile-avatar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                color: "#c1121f",
                fontSize: "32px",
                fontWeight: "bold",
              }}
            >
              {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
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
        <h2 className="profile-name">{name || "User Name"}</h2>
        <p className="profile-email">{user?.email || "user@example.com"}</p>
      </div>

      {/* --- FLOATING ACTION CARD --- */}
      {!isEditing ? (
        <div className="profile-action-card">
          <div className="card-content">
            <div style={{ fontSize: "28px" }}>🎓</div>
            <div className="card-text">
              <h3>
                {department || userProfile?.department || "Complete Profile"}
              </h3>
              <p>
                {level || userProfile?.level
                  ? `Currently in ${level || userProfile?.level}`
                  : "Add your department and level to get better suggestions."}
              </p>
            </div>
          </div>
          <div className="card-actions">
            <button
              className="card-btn primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        /* EDIT FORM (Replaces Card Area) */
        <div className="edit-form-container">
          <div className="edit-input-group">
            <label className="edit-label">Full Name</label>
            <input
              className="edit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          <div className="edit-input-group">
            <label className="edit-label">Department</label>
            <select
              className="edit-input"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="" disabled>
                Select Department
              </option>
              <option value="Computer Science">Computer Science</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Statistics">Statistics</option>
            </select>
          </div>
          <div className="edit-input-group">
            <label className="edit-label">Level</label>
            <select
              className="edit-input"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="" disabled>
                Select Level
              </option>
              <option value="100 Level">100 Level</option>
              <option value="200 Level">200 Level</option>
              <option value="300 Level">300 Level</option>
              <option value="400 Level">400 Level</option>
            </select>
          </div>
          <div className="edit-input-group">
            <label className="edit-label">Phone</label>
            <input
              className="edit-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div className="card-actions" style={{ marginTop: "10px" }}>
            <button
              className="card-btn secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              className="card-btn primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* --- SETTINGS LIST --- */}
      {/* --- SETTINGS GROUP 1 --- */}
      <div className="section-title">Content</div>
      <div className="settings-list">
        <div className="settings-item">
          <div className="item-left">
            <div className="item-icon">
              <VuesaxIcon name="mobile" variant="Bold" darkMode={darkMode} />
            </div>
            <div className="item-label">Connected Apps</div>
          </div>
          <div className="item-right">
            <VuesaxIcon
              name="arrow-right"
              variant="Linear"
              darkMode={darkMode}
              size={16}
            />
          </div>
        </div>

        <div className="settings-item">
          <div className="item-left">
            <div className="item-icon">
              <VuesaxIcon name="moon" variant="Bold" darkMode={darkMode} />
            </div>
            <div className="item-label">Dark Mode</div>
          </div>
          <div className="item-right">
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
      </div>

      {/* --- SETTINGS GROUP 2 (Logout) --- */}
      <div className="settings-list" style={{ marginTop: "24px" }}>
        <div className="settings-item" onClick={onLogout}>
          <div className="item-left">
            <div className="item-icon logout-text">
              <VuesaxIcon
                name="logout"
                variant="Bold"
                darkMode={darkMode}
                style={{ color: "#ff4b4b" }}
              />
            </div>
            <div className="item-label logout-text">Log Out</div>
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
        }}
      >
        <p>Astra to-do v0.1.0</p>
      </div>
    </div>
  );
};

export default AccountSettings;
