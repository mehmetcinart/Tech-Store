import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(form.email, form.password);
    if (result.success) navigate("/");
    else setError(result.message);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>⚡</div>
          <h1 style={styles.title}>Giriş Yap</h1>
          <p style={styles.sub}>TechStore hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">E-posta Adresi</label>
            <input className="form-input" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="ornek@email.com" required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input className="form-input" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" required />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div style={styles.hint}>
          <p style={{ color: "#8AADA4", fontSize: ".8rem", marginBottom: ".5rem" }}>Demo hesaplar:</p>
          <p style={styles.demoAccount}>Admin: admin@techstore.com / admin123</p>
          <p style={styles.demoAccount}>Kullanıcı: test@techstore.com / test123</p>
        </div>

        <p style={styles.footer}>
          Hesabınız yok mu?{" "}
          <Link to="/register" style={{ color: "#2C7A5E", fontWeight: 600 }}>Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1rem" },
  card:    { background: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(44,122,94,.12)", padding: "2.5rem", width: "100%", maxWidth: "420px" },
  header:  { textAlign: "center", marginBottom: "2rem" },
  logo:    { fontSize: "2.5rem", marginBottom: ".5rem" },
  title:   { fontSize: "1.5rem", fontWeight: 800, color: "#111F1C" },
  sub:     { color: "#8AADA4", marginTop: ".375rem", fontSize: ".9rem" },
  form:    { display: "flex", flexDirection: "column", gap: "1rem" },
  hint:    { background: "#F7F9F8", borderRadius: "8px", padding: ".875rem", marginTop: "1.25rem", textAlign: "center" },
  demoAccount: { fontSize: ".8rem", color: "#2C4F48", fontFamily: "monospace" },
  footer:  { textAlign: "center", marginTop: "1.25rem", fontSize: ".875rem", color: "#8AADA4" },
};
