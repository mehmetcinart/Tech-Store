import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatters";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: "4rem 1rem", textAlign: "center" }}>
        <span style={{ fontSize: "4rem" }}>🛒</span>
        <h2 style={{ fontSize: "1.375rem", marginTop: "1rem", marginBottom: ".5rem" }}>Sepetiniz Boş</h2>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Beğendiğiniz ürünleri sepete ekleyin</p>
        <Link to="/products" className="btn btn-primary btn-lg">Alışverişe Başla</Link>
      </div>
    );
  }

  const shipping = totalPrice >= 200 ? 0 : 29.99;
  const grandTotal = totalPrice + shipping;

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <h1 style={styles.pageTitle}>Sepetim ({items.length} ürün)</h1>

      <div style={styles.layout}>
        {/* Ürün Listesi */}
        <div style={styles.itemsList}>
          {items.map((item) => (
            <div key={item.id} className="card" style={styles.item}>
              <img src={item.image} alt={item.name} style={styles.itemImage} />
              <div style={styles.itemInfo}>
                <Link to={`/products/${item.id}`} style={styles.itemName}>{item.name}</Link>
                <p style={styles.itemBrand}>{item.brand}</p>
                <p style={styles.itemPrice}>{formatPrice(item.price)}</p>
              </div>
              <div style={styles.itemActions}>
                <div style={styles.qtyControl}>
                  <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                  <span style={styles.qtyNum}>{item.quantity}</span>
                  <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}>+</button>
                </div>
                <p style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</p>
                <button style={styles.removeBtn} onClick={() => removeItem(item.id)}>🗑️ Kaldır</button>
              </div>
            </div>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={clearCart}>Sepeti Temizle</button>
        </div>

        {/* Özet */}
        <div style={styles.summary}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <h2 style={styles.summaryTitle}>Sipariş Özeti</h2>
            <div style={styles.summaryRow}>
              <span>Ara Toplam</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Kargo</span>
              <span style={{ color: shipping === 0 ? "#10b981" : undefined }}>{shipping === 0 ? "Ücretsiz" : formatPrice(shipping)}</span>
            </div>
            {shipping > 0 && <p style={styles.shippingNote}>200₺ üzeri alışverişlerde kargo ücretsiz</p>}
            <div style={styles.divider} />
            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: "1.1rem" }}>
              <span>Toplam</span>
              <span style={{ color: "#2563eb" }}>{formatPrice(grandTotal)}</span>
            </div>
            <Link to="/checkout" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "1.25rem", justifyContent: "center" }}>
              Ödemeye Geç →
            </Link>
            <Link to="/products" style={{ display: "block", textAlign: "center", marginTop: ".875rem", fontSize: ".875rem", color: "#6b7280" }}>
              Alışverişe Devam Et
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageTitle: { fontSize: "1.375rem", fontWeight: 700, marginBottom: "1.5rem" },
  layout: { display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "flex-start" },
  itemsList: { display: "flex", flexDirection: "column", gap: ".875rem" },
  item: { display: "flex", gap: "1rem", padding: "1rem", alignItems: "center" },
  itemImage: { width: "90px", height: "90px", objectFit: "contain", background: "#f9fafb", borderRadius: "8px", padding: ".5rem", flexShrink: 0 },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { fontWeight: 600, fontSize: ".9rem", color: "#111827", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  itemBrand: { fontSize: ".75rem", color: "#9ca3af", marginTop: ".2rem" },
  itemPrice: { color: "#2563eb", fontWeight: 600, fontSize: ".9rem", marginTop: ".375rem" },
  itemActions: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: ".625rem" },
  qtyControl: { display: "flex", alignItems: "center", border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" },
  qtyBtn: { width: "32px", height: "32px", border: "none", background: "#f3f4f6", fontWeight: 700, cursor: "pointer" },
  qtyNum: { width: "40px", textAlign: "center", fontWeight: 600, fontSize: ".875rem" },
  lineTotal: { fontWeight: 700, fontSize: ".9rem" },
  removeBtn: { background: "none", border: "none", color: "#ef4444", fontSize: ".8rem", cursor: "pointer" },
  summary: {},
  summaryTitle: { fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.25rem" },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: ".9rem", marginBottom: ".75rem" },
  divider: { height: "1px", background: "#e5e7eb", margin: "1rem 0" },
  shippingNote: { fontSize: ".75rem", color: "#f59e0b", marginTop: "-.375rem", marginBottom: ".5rem" },
};
