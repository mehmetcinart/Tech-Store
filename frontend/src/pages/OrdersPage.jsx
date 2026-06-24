import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { formatPrice, formatDate } from "../utils/formatters";

const STATUS_COLORS = {
  "Hazırlanıyor": "badge-warning",
  "Kargoya Verildi": "badge-primary",
  "Teslim Edildi": "badge-success",
  "İptal Edildi": "badge-danger",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");

  useEffect(() => {
    if (!user) return;
    api.get("/orders/my")
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return (
    <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
      <h2>Siparişleri görmek için giriş yapın</h2>
      <Link to="/login" className="btn btn-primary btn-lg" style={{ marginTop: "1.5rem" }}>Giriş Yap</Link>
    </div>
  );

  return (
    <div className="container" style={{ padding: "1.5rem 1rem", maxWidth: "800px" }}>
      <h1 style={{ fontSize: "1.375rem", fontWeight: 700, marginBottom: "1.5rem" }}>Siparişlerim</h1>

      {success && <div className="alert alert-success" style={{ marginBottom: "1rem" }}>✓ Siparişiniz başarıyla oluşturuldu!</div>}

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0" }}>
          <span style={{ fontSize: "3rem" }}>📦</span>
          <h3 style={{ marginTop: "1rem", marginBottom: ".5rem" }}>Henüz siparişiniz yok</h3>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>İlk alışverişinizi yapın!</p>
          <Link to="/products" className="btn btn-primary">Alışverişe Başla</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[...orders].reverse().map((order) => (
            <div key={order.id} className="card" style={{ padding: "1.25rem" }}>
              <div style={styles.orderHeader}>
                <div>
                  <p style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p style={styles.orderDate}>{formatDate(order.createdAt)}</p>
                </div>
                <span className={`badge ${STATUS_COLORS[order.status] || "badge-primary"}`}>{order.status}</span>
              </div>
              <div style={styles.orderItems}>
                {order.items.map((item, i) => (
                  <span key={i} style={styles.orderItemName}>{item.name} x{item.quantity}</span>
                ))}
              </div>
              <div style={styles.orderFooter}>
                <span style={{ color: "#6b7280", fontSize: ".875rem" }}>{order.paymentMethod}</span>
                <span style={styles.orderTotal}>{formatPrice(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  orderHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".875rem" },
  orderId: { fontWeight: 700, fontFamily: "monospace", fontSize: ".875rem" },
  orderDate: { fontSize: ".8rem", color: "#6b7280", marginTop: ".2rem" },
  orderItems: { display: "flex", flexWrap: "wrap", gap: ".375rem", marginBottom: ".875rem" },
  orderItemName: { background: "#f3f4f6", borderRadius: "6px", padding: ".25rem .625rem", fontSize: ".8rem", color: "#374151" },
  orderFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: ".875rem", borderTop: "1px solid #f3f4f6" },
  orderTotal: { fontWeight: 700, fontSize: "1rem", color: "#2563eb" },
};
