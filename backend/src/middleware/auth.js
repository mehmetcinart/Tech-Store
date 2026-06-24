import { users } from "../data/users.js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",").map((e) => e.trim()).filter(Boolean);

// Decode Firebase ID token payload without signature verification (demo mode)
function decodeFirebaseToken(token) {
  const [, payloadB64] = token.split(".");
  if (!payloadB64) throw new Error("invalid token");
  const json = Buffer.from(payloadB64, "base64url").toString("utf8");
  return JSON.parse(json);
}

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Yetkilendirme gerekli" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const payload = decodeFirebaseToken(token);
    req.user = { uid: payload.sub || payload.user_id, email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: "Geçersiz token" });
  }
};

export const adminOnly = (req, res, next) => {
  const { uid, email } = req.user;
  const stored = users.get(uid);
  if (!ADMIN_EMAILS.includes(email) && stored?.role !== "admin") {
    return res.status(403).json({ message: "Admin yetkisi gerekli" });
  }
  next();
};
