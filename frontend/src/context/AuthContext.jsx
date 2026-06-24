import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",").map((e) => e.trim()).filter(Boolean);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Register/upsert user in backend
        try {
          const res = await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: fbUser.uid, email: fbUser.email, name: fbUser.displayName, photoURL: fbUser.photoURL }),
          });
          const data = await res.json();
          const backendRole = data.role;
          setUser({
            id:     fbUser.uid,
            name:   fbUser.displayName || fbUser.email?.split("@")[0] || "Kullanıcı",
            email:  fbUser.email,
            avatar: fbUser.photoURL,
            role:   backendRole || (ADMIN_EMAILS.includes(fbUser.email) ? "admin" : "user"),
          });
        } catch {
          setUser({
            id:     fbUser.uid,
            name:   fbUser.displayName || fbUser.email?.split("@")[0] || "Kullanıcı",
            email:  fbUser.email,
            avatar: fbUser.photoURL,
            role:   ADMIN_EMAILS.includes(fbUser.email) ? "admin" : "user",
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const logout = () => signOut(auth);

  const isAdmin = !!user && (user.role === "admin" || ADMIN_EMAILS.includes(user.email));

  return (
    <AuthContext.Provider value={{ user, loading, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
