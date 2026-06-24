import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatPrice } from "../utils/formatters";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: "", address: "", city: "", zip: "", cardNumber: "", cardExpiry: "", cardCvc: "" });

  if (!user) return (
    <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2>Ödeme yapmak için giriş yapmalısınız</h2>
      <Link to="/login" className="btn btn-primary btn-lg" style={{ marginTop: "1.5rem" }}>Giriş Yap</Link>
    </div>
  );

  if (items.length === 0) return (
    <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2>Sepetiniz boş</h2>
      <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: "1.5rem" }}>Alışverişe Başla</Link>
    </div>
  );

  const shipping = totalPrice >= 200 ? 0 : 29.99;
  const grandTotal = totalPrice + shipping;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/orders", {
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        shippingAddress: { name: form.name, phone: form.phone, address: form.address, city: form.city, zip: form.zip },
        paymentMethod: "Kredi Kartı",
        total: grandTotal,
      });
      clearCart();
      navigate("/orders?success=true");
    } catch (err) {
      setError(err.response?.data?.message || "Sipariş oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <h1 style={styles.pageTitle}>Ödeme</h1>
      <form onSubmit={handleSubmit}>
        <div style={styles.layout}>
          <div>
            {/* Teslimat Bilgileri */}
            <div className="card" style={styles.section}>
              <h2 style={styles.sectionTitle}>📦 Teslimat Bilgileri</h2>
              <div style={styles.grid2}>
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="05XX XXX XX XX" required />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: ".875rem" }}>
                <label className="form-label">Adres</label>
                <textarea className="form-input" name="address" value={form.address} onChange={handleChange} rows={3} required style={{ resize: "vertical" }} />
              </div>
              <div style={{ ...styles.grid2, marginTop: ".875rem" }}>
                <div className="form-group">
                  <label className="form-label">Şehir</label>
                  <input className="form-input" name="city" value={form.city} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Posta Kodu</label>
                  <input className="form-input" name="zip" value={form.zip} onChange={handleChange} />
                </div>
              </div>
            </div>

            {/* Ödeme Bilgileri */}
            <div className="card" style={styles.section}>
              <h2 style={styles.sectionTitle}>💳 Ödeme Bilgileri</h2>
              <div className="form-group">
                <label className="form-label">Kart Numarası</label>
                <input className="form-input" name="cardNumber" value={form.cardNumber} onChange={handleChange} placeholder="XXXX XXXX XXXX XXXX" maxLength={19} required />
              </div>
              <div style={{ ...styles.grid2, marginTop: ".875rem" }}>
                <div className="form-group">
                  <label className="form-label">Son Kullanma Tarihi</label>
                  <input className="form-input" name="cardExpiry" value={form.cardExpiry} onChange={handleChange} placeholder="AA/YY" maxLength={5} required />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input className="form-input" name="cardCvc" value={form.cardCvc} onChange={handleChange} placeholder="XXX" maxLength={4} required />
                </div>
              </div>
              <p style={{ fontSize: ".75rem", color: "#6b7280", marginTop: ".875rem" }}>🔒 Ödeme bilgileriniz 256-bit SSL ile şifrelenmektedir. Bu bir demo sitedir, gerçek kart bilgisi girmeyin.</p>
            </div>
          </div>

          {/* Özet */}
          <div>
            <div className="card" style={{ padding: "1.5rem" }}>
              <h2 style={styles.sectionTitle}>Sipariş Özeti</h2>
              {items.map((item) => (
                <div key={item.id} style={styles.orderItem}>
                  <span style={{ color: "#374151" }}>{item.name} x{item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div style={styles.divider} />
              <div style={styles.orderItem}><span>Kargo</span><span style={{ color: shipping === 0 ? "#10b981" : undefined }}>{shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}</span></div>
              <div style={styles.divider} />
              <div style={{ ...styles.orderItem, fontWeight: 700, fontSize: "1.1rem" }}>
                <span>Toplam</span>
                <span style={{ color: "#2563eb" }}>{formatPrice(grandTotal)}</span>
              </div>
              {error && <div className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</div>}
              <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%", justifyContent: "center", marginTop: "1.25rem" }} disabled={loading}>
                {loading ? "İşleniyor..." : "✓ Siparişi Tamamla"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  pageTitle: { fontSize: "1.375rem", fontWeight: 700, marginBottom: "1.5rem" },
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "flex-start" },
  section: { padding: "1.5rem", marginBottom: "1rem" },
  sectionTitle: { fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".875rem" },
  orderItem: { display: "flex", justifyContent: "space-between", fontSize: ".875rem", marginBottom: ".625rem" },
  divider: { height: "1px", background: "#e5e7eb", margin: ".75rem 0" },
};
