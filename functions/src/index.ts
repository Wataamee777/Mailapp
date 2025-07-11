import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Firebase初期化（1回だけでOK）
admin.initializeApp();
const db = admin.firestore();

// メール送信用トランスポーター（Gmailアカウントのアプリパスワード使用）
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.user,
    pass: functions.config().gmail.pass,
  },
});

// Cloud Functions（POST API）
export const sendMail = functions.https.onRequest(async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "Missing fields" });

  const now = admin.firestore.Timestamp.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Firestoreから「今日の送信履歴」を取得
  const logs = await db.collection("mailLogs")
    .where("
