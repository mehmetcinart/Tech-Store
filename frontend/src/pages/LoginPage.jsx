import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const ERROR_MESSAGES = {
  "auth/user-not-found":       "Bu e-posta ile kayıtlı hesap bulunamadı",
  "auth/wrong-password":       "Şifre hatalı",
  "auth/invalid-credential":   "E-posta veya şifre hatalı",
  "auth/email-already-in-use": "Bu e-posta zaten kullanımda",
  "auth/weak-password":        "Şifre en az 6 karakter olmalı",
  "auth/invalid-email":        "Geçersiz e-posta adresi",
  "auth/popup-closed-by-user": "Giriş penceresi kapatıldı",
  "auth/cancelled-popup-request": "Giriş iptal edildi",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [error, setError]     = useState("");
  const [busy, setBusy]       = useState(false);

  const handleGoogle = async () => {
    setError(""); setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || "Google girişi başarısız");
    } finally { setBusy(false); }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      if (mode === "register") {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={s.logo}>⚡</div>
          <h1 style={s.title}>Tech<strong>Store</strong></h1>
          <p style={s.sub}>{mode === "login" ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}</p>
        </div>

        {/* Google */}
        <button style={s.googleBtn} onClick={handleGoogle} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google ile {mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
        </button>

        <div style={s.divider}><span>veya</span></div>

        {error && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <form onSubmit={handleEmail} style={s.form}>
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Ad Soyad</label>
              <input className="form-input" type="text" placeholder="Adınız" value={name}
                onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">E-posta</label>
            <input className="form-input" type="email" placeholder="ornek@email.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus={mode === "login"} />
          </div>
          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={busy}>
            {busy ? "Lütfen bekleyin..." : mode === "login" ? "Giriş Yap" : "Kayıt Ol"}
          </button>
        </form>

        <p style={s.toggle}>
          {mode === "login" ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
          <button type="button" style={s.toggleBtn}
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </p>
      </div>
    </div>
  );
}

const s = {
  wrapper:   { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  card:      { background: "#fff", borderRadius: "20px", boxShadow: "0 8px 32px rgba(44,122,94,.13)", padding: "2.5rem", width: "100%", maxWidth: "420px" },
  header:    { textAlign: "center", marginBottom: "1.75rem" },
  logo:      { fontSize: "2.25rem", marginBottom: ".25rem" },
  title:     { fontSize: "1.625rem", color: "#111F1C", margin: 0 },
  sub:       { color: "#8AADA4", marginTop: ".375rem", fontSize: ".875rem" },
  googleBtn: {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    gap: ".75rem", padding: ".75rem 1rem", border: "1.5px solid #D9E4E0",
    borderRadius: "10px", background: "#fff", fontSize: ".9rem", fontWeight: 600,
    color: "#2C4F48", cursor: "pointer", transition: "background .15s, box-shadow .15s",
    boxShadow: "0 1px 3px rgba(0,0,0,.07)",
  },
  divider: {
    display: "flex", alignItems: "center", gap: ".875rem",
    margin: "1.25rem 0", color: "#B8CFC8", fontSize: ".8rem",
    "& span": { whiteSpace: "nowrap" },
  },
  form:    { display: "flex", flexDirection: "column", gap: ".875rem" },
  toggle:  { textAlign: "center", marginTop: "1.25rem", fontSize: ".875rem", color: "#8AADA4" },
  toggleBtn: { background: "none", border: "none", color: "#2C7A5E", fontWeight: 700, cursor: "pointer", fontSize: ".875rem" },
};
