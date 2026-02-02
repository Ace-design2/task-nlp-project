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

    // DEBUG: Log current server time
    const currentDay = now.toISOString().split("T")[0]; // UTC date
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}`; // UTC time

    console.log(`Server Time (UTC): ${currentDay} ${currentTime}`);

    const snapshot = await db
      .collectionGroup("tasks")
      .where("sent", "==", false)
      .get();

    console.log(`Found ${snapshot.size} pending tasks.`);

    const batch = db.batch();
    const promises = [];
    let sentCount = 0;
    const logs = []; // Collection of decision logs

    snapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const userId = docSnap.ref.path.split("/")[1];

      if (!task.date || !task.time) return;

      const logEntry = `Task ${docSnap.id} (User ${userId}): Date=${task.date}, Time=${task.time} vs Server=${currentDay} ${currentTime}`;
      logs.push(logEntry);

      // Time Check
      // NOTE: This comparison assumes task.time is in UTC or User is in UTC.
      // If user is UTC+1, 18:00 Local is 17:00 UTC.
      // Server (17:00) sees Task (18:00) -> 18:00 <= 17:00 is FALSE. Skipped.
      const isDateMatch = task.date === currentDay;
      const isTimeDue = task.time <= currentTime;

      if (isDateMatch && isTimeDue) {
        logs.push(`   -> MATCH! Condition Met.`);

        // Multi-Device Broadcasting
        const sendPromise = db
          .collection("users")
          .doc(userId)
          .collection("fcm_tokens")
          .get()
          .then(async (tokenSnapshot) => {
            if (tokenSnapshot.empty) {
              logs.push(`   -> No tokens found for user ${userId}`);
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
                messaging
                  .send(message)
                  .then(() => {
                    logs.push(
                      `   --> Sent to token ending in ...${tokenData.token.slice(-6)}`,
                    );
                  })
                  .catch((err) => {
                    console.error("Failed to send to device", err);
                    logs.push(`   --> Failed to send: ${err.message}`);
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
      } else {
        logs.push(
          `   -> SKIPPED. DateMatch: ${isDateMatch}, TimeDue: ${isTimeDue}`,
        );
      }
    });

    await Promise.all(promises);
    await batch.commit();
    console.log(
      `Processed ${snapshot.size} tasks, sent ${sentCount} notifications.`,
    );

    res
      .status(200)
      // Return logs in the response so the user can debug via browser
      .json({
        success: true,
        serverTimeUTC: `${currentDay} ${currentTime}`,
        processed: snapshot.size,
        sent: sentCount,
        logs: logs,
      });
  } catch (error) {
    console.error("Critical Error in Cron Handler:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
      stack: error.stack,
    });
  }
};
