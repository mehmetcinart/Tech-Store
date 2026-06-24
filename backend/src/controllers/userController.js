import { users } from "../data/users.js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",").map((e) => e.trim()).filter(Boolean);

// Called from frontend after Firebase login — upserts user record
export const registerUser = (req, res) => {
  const { uid, email, name, photoURL } = req.body;
  if (!uid || !email) return res.status(400).json({ message: "uid ve email gerekli" });

  const existing = users.get(uid);
  const role = existing?.role || (ADMIN_EMAILS.includes(email) ? "admin" : "user");

  users.set(uid, { uid, email, name: name || email.split("@")[0], photoURL: photoURL || null, role, lastSeen: new Date().toISOString() });
  res.json({ uid, email, role });
};

// Admin: get all users
export const listUsers = (req, res) => {
  res.json([...users.values()]);
};

// Admin: change user role
export const updateUserRole = (req, res) => {
  const { uid } = req.params;
  const { role } = req.body;
  if (!["admin", "user"].includes(role)) return res.status(400).json({ message: "Geçersiz rol" });

  const user = users.get(uid);
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });

  // Prevent demoting super-admin
  if (ADMIN_EMAILS.includes(user.email) && role !== "admin") {
    return res.status(403).json({ message: "Bu kullanıcının rolü değiştirilemez" });
  }

  users.set(uid, { ...user, role });
  res.json({ ...user, role });
};
