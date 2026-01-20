# Authentication System Design

## 1. High-Level Architecture

The system uses **Firebase Authentication** as the Identity Provider (IdP) for handling user credentials, session management, and security, integrated with a **React Frontend**.

- **Frontend (React)**: Handles user input, client-side validation (password strength), and state management.
- **Backend Service (Firebase Auth)**:
  - Stores credentials securely (hashed/salted).
  - Handles token generation (JWT).
  - Enforces email uniqueness.
  - manages rate limiting and account lockouts.
- **Database (Firestore)**: Stores additional user profile information (e.g., account creation dates, user preferences) separate from authentication credentials.

## 2. Database Schema

### Firebase Authentication (Internal)

Stores: `uid`, `email`, `emailVerified`, `passwordHash`, `lastLoginAt`.

### Firestore Collection: `users`

Documents are indexed by `uid` (matching Auth UID).

```json
{
  "uid": "string (PK)",
  "email": "string (unique)",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp",
  "role": "string (default: 'user')",
  "metadata": {
    "loginCount": "number",
    "lastPasswordReset": "timestamp"
  }
}
```

## 3. Implementation Logic (Pseudocode)

### Sign-Up Flow

```javascript
function handleSignUp(email, password) {
  // 1. Client-Side Validation
  if (!isValidEmail(email)) throw Error("Invalid Email");
  if (!isStrongPassword(password)) throw Error("Password too weak (min 8 chars, A-Z, 0-9, special)");

  // 2. Create Authentication Record
  try {
    user = await auth.createUser(email, password); // Hashes password automatically
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') alert("Account exists");
    return;
  }

  // 3. Send Verification
  await sendEmailVerification(user);

  // 4. Create User Profile in Firestore
  await db.collection('users').doc(user.uid).set({
    email: email,
    createdAt: serverTimestamp(),
    uid: user.uid
  });

  // 5. Force Logout (require verification before access)
  await auth.signOut();
  alert("Please verify your email.");
}
```

### Sign-In Flow

```javascript
function handleLogin(email, password) {
  // 1. Authenticate with IdP
  try {
    userCredential = await auth.signIn(email, password);
  } catch (error) {
    if (error.code === 'auth/too-many-requests') handleRateLimit();
    handleAuthError(error); // Generic error to prevent enumeration
    return;
  }

  // 2. Check Verification
  if (!userCredential.user.emailVerified) {
    await auth.signOut();
    throw Error("Email not verified");
  }

  // 3. Update Last Login
  await db.collection('users').doc(user.uid).update({
    lastLoginAt: serverTimestamp()
  });

  // 4. Session Established (handled by SDK via ID Tokens)
}
```

## 4. Security Enforcement

- **HTTPS**: Enforced by Vercel/Firebase hosting.
- **SQL Injection**: Prevented by using NoSQL (Firestore) and parameterized SDK methods.
- **XSS**: React automatically escapes content.
- **CSRF**: Firebase Auth uses ID tokens sent via headers, mitigating cookie-based CSRF.
- **Password Storage**: Uses scrypt (stronger than bcrypt) per Firebase standards.
- **Rate Limiting**: Built-in protection against brute-force IP attacks; implemented UI feedback for `auth/too-many-requests`.
