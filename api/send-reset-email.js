// api/send-reset-email.js
// Vercel Serverless Function. Deploy path: POST /api/send-reset-email
//
// কেন এটা লাগলো: Firebase Console-এর "Customize action URL" UI বাগ করছিল,
// তাই সেই সেটিং console থেকে না করে সরাসরি কোডে actionCodeSettings দিয়ে
// দেওয়া হচ্ছে — generatePasswordResetLink() নিজেই secure link বানায়
// (Firebase-ই token verify করবে, এটা কোনো custom/insecure token না),
// শুধু email পাঠানোটা এখন আমরা নিজেরা Gmail SMTP দিয়ে করছি।
//
// প্রয়োজনীয় প্যাকেজ (project root এ):
//   npm install firebase-admin nodemailer
//
// প্রয়োজনীয় Environment Variables (Vercel Dashboard → Settings → Environment Variables):
//   FIREBASE_SERVICE_ACCOUNT   -> service account JSON-টা পুরোটা এক লাইনে (string) হিসেবে পেস্ট করুন
//   GMAIL_USER                 -> আপনার Gmail ঠিকানা
//   GMAIL_APP_PASSWORD          -> Google App Password (সাধারণ পাসওয়ার্ড না)

const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST ব্যবহার করুন' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'ইমেইল দেওয়া হয়নি' });
  }

  try {
    // এই url টাই Console-এর Action URL এর বদলি — এখানেই সরাসরি বসছে,
    // তাই buggy console UI স্পর্শ করারই দরকার নেই।
    const actionCodeSettings = {
      url: 'https://quranview.vercel.app/index.html',
      handleCodeInApp: false,
    };

    const link = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    await transporter.sendMail({
      from: `"কুরআন বাংলা" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'আপনার পাসওয়ার্ড রিসেট করুন',
      html: `
        <p>সালাম,</p>
        <p>আপনার কুরআন বাংলা অ্যাকাউন্টের পাসওয়ার্ড রিসেট করতে নিচের লিংকে ক্লিক করুন:</p>
        <p><a href="${link}">${link}</a></p>
        <p>আপনি যদি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন।</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (e) {
    // ইমেইল না থাকলেও একই সফল মেসেজ দিন (security best practice —
    // কোন ইমেইল রেজিস্টার্ড আছে সেটা বাইরের কেউ বুঝতে পারবে না)
    if (e.code === 'auth/user-not-found') {
      return res.status(200).json({ success: true });
    }
    console.error(e);
    return res.status(500).json({ error: 'পাঠাতে ব্যর্থ হয়েছে' });
  }
};
