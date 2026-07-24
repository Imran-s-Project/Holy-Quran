// ---------- EmailJS config (for OTP emails) ----------
// Used only to email a 6-digit verification code before two sensitive
// actions: changing the password and permanently deleting the account.
// Everything else in the app works fine even if this is left unconfigured
// (the "পরিবর্তন করুন" / "মুছে ফেলুন" buttons will just show a toast saying
// OTP isn't set up yet).
//
// ---------- One-time setup (free, ~5 minutes) ----------
// 1) Go to https://www.emailjs.com and create a free account.
// 2) Email Services → Add New Service → connect Gmail (or any provider).
//    Copy the "Service ID" it gives you → paste below as serviceId.
// 3) Email Templates → Create New Template. Don't use the default plain
//    text editor — click the "</>" (Code Editor) icon top-right, then
//    paste the full HTML from email-templates/otp-template.html (it's
//    already themed to match this app and uses the exact variable names
//    below). Subject line: {{purpose}} — যাচাইকরণ কোড
//      {{to_email}}   — recipient address
//      {{to_name}}    — recipient's name
//      {{otp_code}}   — the 6-digit code
//      {{purpose}}    — e.g. "পাসওয়ার্ড পরিবর্তন" or "অ্যাকাউন্ট মুছে ফেলা"
//    Copy the "Template ID" → paste below as templateId.
// 4) Account → General → copy your "Public Key" → paste below as publicKey.
// 5) Save this file, redeploy. That's it — no server, no Cloud Functions.
//
// PRIVACY NOTE: the public key is safe to ship in client code by design
// (that's how EmailJS works) — but EmailJS's free tier is rate-limited
// per month, and anyone with your service/template IDs could technically
// trigger sends. For a personal/small-app project this is an acceptable
// tradeoff, same as the rest of this app's client-only Firebase setup.

const EMAILJS_CONFIG = {
  publicKey: "xZa-M7wzLohf1ciYM",
  serviceId: "service_iop4lfq",
  templateId: "template_m8kjuwq"
};
