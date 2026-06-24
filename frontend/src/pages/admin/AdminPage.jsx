import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { formatPrice, formatDate } from "../../utils/formatters";

const TABS = ["Ürünler", "Siparişler"];
const STATUS_OPTIONS = ["Hazırlanıyor", "Kargoya Verildi", "Teslim Edildi", "İptal Edildi"];

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Ürünler");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", brand: "", price: "", originalPrice: "", stock: "", description: "", image: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) { navigate("/"); return; }
    Promise.all([api.get("/products"), api.get("/orders")])
      .then(([pRes, oRes]) => { setProducts(pRes.data.products); setOrders(oRes.data); })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStatusChange = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const { data } = await api.post("/products", form);
      setProducts((prev) => [...prev, data]);
      setShowForm(false);
      setForm({ name: "", category: "", brand: "", price: "", originalPrice: "", stock: "", description: "", image: "" });
    } catch (err) {
      setFormError(err.response?.data?.message || "Ürün eklenemedi");
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ Admin Panel</h1>
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Ürünler Tab */}
      {tab === "Ürünler" && (
        <div>
          <div style={styles.tabHeader}>
            <p style={{ color: "#6b7280" }}>{products.length} ürün</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>+ Yeni Ürün</button>
          </div>

          {showForm && (
            <div className="card" style={styles.formCard}>
              <h3 style={{ marginBottom: "1.25rem", fontWeight: 700 }}>Yeni Ürün Ekle</h3>
              {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}
              <form onSubmit={handleAddProduct} style={styles.formGrid}>
                {[
                  { name: "name", label: "Ürün Adı", required: true },
                  { name: "brand", label: "Marka" },
                  { name: "category", label: "Kategori" },
                  { name: "price", label: "Fiyat (₺)", type: "number", required: true },
                  { name: "originalPrice", label: "Orijinal Fiyat (₺)", type: "number" },
                  { name: "stock", label: "Stok", type: "number", required: true },
                ].map((f) => (
                  <div key={f.name} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <input className="form-input" type={f.type || "text"} name={f.name} value={form[f.name]} onChange={(e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))} required={f.required} />
                  </div>
                ))}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Görsel URL</label>
                  <input className="form-input" name="image" value={form.image} onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Açıklama</label>
                  <textarea className="form-input" name="description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} style={{ resize: "vertical" }} />
                </div>
                <div style={{ gridColumn: "1/-1", display: "flex", gap: ".75rem" }}>
                  <button className="btn btn-primary" type="submit">Ekle</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>İptal</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ overflow: "hidden" }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Ürün</th>
                  <th style={styles.th}>Kategori</th>
                  <th style={styles.th}>Fiyat</th>
                  <th style={styles.th}>Stok</th>
                  <th style={styles.th}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                    <td style={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                        <img src={p.image} alt={p.name} style={{ width: "44px", height: "44px", objectFit: "contain", background: "#fff", borderRadius: "6px", padding: "2px" }} />
                        <div>
                          <p style={{ fontWeight: 600, fontSize: ".875rem" }}>{p.name}</p>
                          <p style={{ color: "#6b7280", fontSize: ".75rem" }}>{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}><span className="badge badge-primary">{p.category}</span></td>
                    <td style={styles.td}><span style={{ fontWeight: 700, color: "#2563eb" }}>{formatPrice(p.price)}</span></td>
                    <td style={styles.td}><span style={{ color: p.stock <= 5 ? "#ef4444" : "#10b981", fontWeight: 600 }}>{p.stock}</span></td>
                    <td style={styles.td}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Siparişler Tab */}
      {tab === "Siparişler" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Sipariş ID</th>
                <th style={styles.th}>Tarih</th>
                <th style={styles.th}>Ürünler</th>
                <th style={styles.th}>Toplam</th>
                <th style={styles.th}>Durum</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#6b7280" }}>Henüz sipariş yok</td></tr>
              ) : orders.map((o, i) => (
                <tr key={o.id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                  <td style={styles.td}><code style={{ fontSize: ".8rem" }}>#{o.id.slice(0, 8).toUpperCase()}</code></td>
                  <td style={styles.td}><span style={{ fontSize: ".8rem", color: "#6b7280" }}>{formatDate(o.createdAt)}</span></td>
                  <td style={styles.td}><span style={{ fontSize: ".8rem" }}>{o.items.map((i) => i.name).join(", ")}</span></td>
                  <td style={styles.td}><span style={{ fontWeight: 700, color: "#2563eb" }}>{formatPrice(o.total)}</span></td>
                  <td style={styles.td}>
                    <select className="form-input" style={{ padding: ".3rem .5rem", fontSize: ".8rem" }} value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" },
  title: { fontSize: "1.375rem", fontWeight: 700 },
  tabs: { display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: ".25rem", gap: ".25rem" },
  tab: { padding: ".5rem 1.25rem", border: "none", borderRadius: "8px", background: "transparent", fontWeight: 600, fontSize: ".875rem", cursor: "pointer", color: "#6b7280" },
  tabActive: { background: "#fff", color: "#2563eb", boxShadow: "0 1px 4px rgba(0,0,0,.1)" },
  tabHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  formCard: { padding: "1.5rem", marginBottom: "1.25rem" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".875rem" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f3f4f6" },
  th: { padding: ".875rem 1rem", textAlign: "left", fontSize: ".8rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".04em" },
  td: { padding: ".875rem 1rem", fontSize: ".875rem", verticalAlign: "middle" },
};
