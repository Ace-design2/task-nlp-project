const admin = require("firebase-admin");

// Initialize Firebase Admin (lazy load)
// Vercel deployment requires the Service Account to be passed as an Environment Variable
// named FIREBASE_SERVICE_ACCOUNT.

module.exports = async function handler(req, res) {
  console.log("Cron trigger received");

  try {
    if (!admin.apps.length) {
      console.log("Initializing Firebase Admin...");
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;

      if (!serviceAccountStr) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing.");
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountStr);
      } catch (e) {
        throw new Error(
          "Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON: " + e.message,
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin initialized successfully.");
    }

    const db = admin.firestore();
    const messaging = admin.messaging();

    const now = new Date();
    // ... rest of logic ...

    // Note: To minimize diff size, I'm pasting the logic here,
    // but in a real refactor I might keep the logic separate.
    // However, to ensure scope access to `db` and `messaging` which are now local,
    // I need to include the rest of the file here or structure it differently.

    // Let's just inline the rest of functionality for safety in this tool call

    const snapshot = await db
      .collectionGroup("tasks")
      .where("sent", "==", false)
      .get();

    console.log(`Found ${snapshot.size} pending tasks.`);

    const batch = db.batch();
    const promises = [];
    let sentCount = 0;

    snapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const userId = docSnap.ref.path.split("/")[1];

      if (!task.date || !task.time) return;

      const currentDay = now.toISOString().split("T")[0]; // UTC date
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTime = `${hours}:${minutes}`; // UTC time

      // Time Check (Simplified for MVP as discussed)
      if (task.date === currentDay && task.time <= currentTime) {
        // Multi-Device Broadcasting
        const sendPromise = db
          .collection("users")
          .doc(userId)
          .collection("fcm_tokens")
          .get()
          .then(async (tokenSnapshot) => {
            if (tokenSnapshot.empty) {
              console.log(`No tokens for user ${userId}, marking sent anyway.`);
              return;
            }

            const sendTasks = [];
            tokenSnapshot.forEach((tokenDoc) => {
              const tokenData = tokenDoc.data();
              if (!tokenData.token) return;

              const message = {
                token: tokenData.token,
                notification: {
                  title: "Reminder: " + (task.title || "Task"),
                  body: `It is time! (${task.time})`,
                },
                data: {
                  taskId: docSnap.id,
                },
              };

              sendTasks.push(
                messaging.send(message).catch((err) => {
                  console.error("Failed to send to device", err);
                  if (
                    err.code === "messaging/registration-token-not-registered"
                  ) {
                    tokenDoc.ref.delete();
                  }
                }),
              );
            });
            await Promise.all(sendTasks);
          })
          .then(() => {
            sentCount++;
            batch.update(docSnap.ref, {
              sent: true,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });

        promises.push(sendPromise);
      }
    });

    await Promise.all(promises);
    await batch.commit();
    console.log(
      `Processed ${snapshot.size} tasks, sent ${sentCount} notifications.`,
    );

    res
      .status(200)
      .json({ success: true, processed: snapshot.size, sent: sentCount });
  } catch (error) {
    console.error("Critical Error in Cron Handler:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: error.stack,
    });
  }
};
