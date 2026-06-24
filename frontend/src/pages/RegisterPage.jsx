import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]   = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("Şifreler eşleşmiyor");
    if (form.password.length < 6) return setError("Şifre en az 6 karakter olmalı");
    const result = await register(form.name, form.email, form.password);
    if (result.success) navigate("/");
    else setError(result.message);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>⚡</div>
          <h1 style={styles.title}>Kayıt Ol</h1>
          <p style={styles.sub}>Yeni bir TechStore hesabı oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Ad Soyad</label>
            <input className="form-input" type="text" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Adınız Soyadınız" required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">E-posta Adresi</label>
            <input className="form-input" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="ornek@email.com" required />
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <input className="form-input" type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="En az 6 karakter" required />
          </div>

          <div className="form-group">
            <label className="form-label">Şifre Tekrar</label>
            <input className="form-input" type="password" value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              placeholder="Şifrenizi tekrar girin" required />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p style={styles.footer}>
          Zaten hesabınız var mı?{" "}
          <Link to="/login" style={{ color: "#2C7A5E", fontWeight: 600 }}>Giriş Yap</Link>
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
  footer:  { textAlign: "center", marginTop: "1.25rem", fontSize: ".875rem", color: "#8AADA4" },
};
