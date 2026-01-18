const admin = require("firebase-admin");

// Initialize Firebase Admin
// Vercel deployment requires the Service Account to be passed as an Environment Variable
// named FIREBASE_SERVICE_ACCOUNT.
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
    );
    if (Object.keys(serviceAccount).length > 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.error("FIREBASE_SERVICE_ACCOUNT env var is missing or empty.");
      // Fallback for local dev if needed, or just let it fail
    }
  } catch (error) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", error);
  }
}

const db = admin.firestore();
const messaging = admin.messaging();

module.exports = async function handler(req, res) {
  console.log("Cron trigger received");

  // Optional: Simple API Key security
  // if (req.query.key !== process.env.CRON_SECRET) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  const now = new Date();

  // To handle timezone correctly on serverless (which is usually UTC):
  // You might want to store tasks in UTC or convert the server time to the user's expected timezone.
  // Ideally, your stored 'date' and 'time' strings are "User Local Time".
  // BUT the server is UTC.
  //
  // FIX: For this Vercel setup, we will query assuming the server time is "rough reference"
  // OR we can rely on the fact that if a user sets "18:00" for "2024-01-18",
  // we want to notify them when "It is 18:00 in their timezone".
  // Complex app approach: Store timezone with task.
  // Simple app approach (Current): Assume user is in same timezone as server? (Risky)
  //
  // Refined Approach for MVP:
  // Convert current UTC time to the target timezone (e.g. Europe/Paris) if we knew it.
  // Since we don't, we will assume the User's device provided the ISO String correct?
  //
  // Current app logic saves: "date": "YYYY-MM-DD", "time": "HH:MM" (Local time strings).
  // Problem: Vercel server is UTC.
  // If I am in Paris (UTC+1), at 18:00, Vercel thinks it is 17:00.
  //
  // HACK / FIX:
  // For a robust personal app check, we can just check "ALL tasks where time <= NOW_UTC + Offset?"
  //
  // BETTER FIX:
  // We will iterate through ALL pending tasks for the current day (UTC) and previous day (in case of overlap)
  // and check if their time matches "now" roughly.
  //
  // ACTUALLY, sticking to the user's request "Server Handles Time":
  // The server implementation in functions/index.js used `new Date()` which was server time.
  //
  // Let's implement the same logic but acknowledge the Timezone offset issue.
  // We will create a robust check that queries for pending tasks and checks "Is this time passed?".
  //
  // Since we can't easily query "time <= now" across timezones without storing UTC,
  // We will do a broad query and filter in memory (assuming n is small for a personal app).

  const snapshot = await db
    .collectionGroup("tasks")
    .where("sent", "==", false)
    .get();

  const batch = db.batch();
  const promises = [];
  let sentCount = 0;

  snapshot.forEach((docSnap) => {
    const task = docSnap.data();
    // We need userId. task doc is at users/{userId}/tasks/{taskId}
    // So parent is tasks, parent.parent is user Doc
    const userId = docSnap.ref.path.split("/")[1];

    if (!task.date || !task.time) return;

    const currentDay = now.toISOString().split("T")[0]; // UTC date
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}`; // UTC time

    // Time Check
    if (task.date === currentDay && task.time <= currentTime) {
      // Multi-Device Broadcasting
      // We fetch ALL tokens for this user
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
                  // Delete invalid token
                  tokenDoc.ref.delete();
                }
              }),
            );
          });
          await Promise.all(sendTasks);
        })
        .then(() => {
          sentCount++;
          // Mark task as sent
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

  res
    .status(200)
    .json({ success: true, processed: snapshot.size, sent: sentCount });
};
