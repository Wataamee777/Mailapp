import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.user,
    pass: functions.config().gmail.pass,
  },
});

export const sendMail = functions.https.onRequest(async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "Missing fields" });

  const now = admin.firestore.Timestamp.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await db.collection("mailLogs")
    .where("email", "==", to)
    .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(today))
    .get();

  if (logs.size >= 10) {
    return res.status(429).json({ error: "送信制限（1日10通）を超えています" });
  }

  try {
    await transporter.sendMail({
      from: `"わたあめえサービス" <${functions.config().gmail.user}>`,
      to,
      subject: "📩 新しいメッセージがあります",
      text: message,
    });

    await db.collection("mailLogs").add({
      email: to,
      timestamp: now,
    });

    return res.json({ status: "success", message: "送信完了！" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "送信失敗" });
  }
});
