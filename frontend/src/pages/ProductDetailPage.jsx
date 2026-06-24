import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../utils/api";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/formatters";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded]       = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!product) return (
    <div className="container" style={{ padding: "2rem" }}>
      <p>Ürün bulunamadı.</p>
      <Link to="/products" className="btn btn-primary" style={{ marginTop: "1rem" }}>Ürünlere Dön</Link>
    </div>
  );

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <nav style={styles.breadcrumb}>
        <Link to="/">Ana Sayfa</Link> /&nbsp;
        <Link to="/products">Ürünler</Link> /&nbsp;
        <Link to={`/products?category=${product.category}`}>{product.category}</Link> /&nbsp;
        <span style={{ color: "#2C7A5E" }}>{product.name}</span>
      </nav>

      <div style={styles.layout}>
        {/* Görsel */}
        <div>
          <div style={styles.mainImage}>
            <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "2rem" }} />
          </div>
          {product.discount > 0 && (
            <span className="badge badge-danger" style={{ marginTop: ".75rem" }}>%{product.discount} İndirim</span>
          )}
        </div>

        {/* Bilgiler */}
        <div>
          <p style={styles.brand}>{product.brand}</p>
          <h1 style={styles.title}>{product.name}</h1>

          <div style={styles.rating}>
            <span className="stars">
              {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
            </span>
            <span style={{ color: "#8AADA4", fontSize: ".9rem" }}>
              {product.rating}/5 ({product.reviewCount} değerlendirme)
            </span>
          </div>

          <div style={styles.priceBox}>
            <span style={styles.price}>{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <div>
                <span style={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
                <span style={styles.saving}> {formatPrice(product.originalPrice - product.price)} tasarruf!</span>
              </div>
            )}
          </div>

          <p style={styles.description}>{product.description}</p>

          {product.stock > 0 ? (
            <>
              <div style={styles.qtyRow}>
                <label style={{ fontWeight: 600, fontSize: ".875rem" }}>Adet:</label>
                <div style={styles.qtyControl}>
                  <button style={styles.qtyBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span style={styles.qtyNum}>{quantity}</span>
                  <button style={styles.qtyBtn} onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
                <span style={{ color: "#8AADA4", fontSize: ".8rem" }}>Stok: {product.stock}</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleAdd}>
                  {added ? "✓ Eklendi!" : "🛒 Sepete Ekle"}
                </button>
                <Link to="/cart" className="btn btn-outline btn-lg">Sepete Git</Link>
              </div>
            </>
          ) : (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>
              Bu ürün şu an stokta bulunmamaktadır.
            </div>
          )}

          <div style={styles.badges}>
            <span>🚚 Ücretsiz kargo</span>
            <span>🔄 30 gün iade</span>
            <span>🛡️ 2 yıl garanti</span>
          </div>
        </div>
      </div>

      {/* Teknik Özellikler */}
      {Object.keys(product.specs).length > 0 && (
        <div style={styles.specsSection}>
          <h2 style={styles.specsTitle}>Teknik Özellikler</h2>
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={styles.table}>
              <tbody>
                {Object.entries(product.specs).map(([key, val], i) => (
                  <tr key={key} style={{ background: i % 2 === 0 ? "#F7F9F8" : "#fff" }}>
                    <td style={styles.tdKey}>{key}</td>
                    <td style={styles.tdVal}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  breadcrumb:  { fontSize: ".8rem", color: "#8AADA4", marginBottom: "1.5rem", display: "flex", gap: ".5rem", flexWrap: "wrap" },
  layout:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "2.5rem" },
  mainImage:   { background: "#F7F9F8", borderRadius: "16px", aspectRatio: "1", overflow: "hidden" },
  brand:       { fontSize: ".875rem", fontWeight: 600, color: "#5E8A80", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".5rem" },
  title:       { fontSize: "1.625rem", fontWeight: 800, color: "#111F1C", lineHeight: 1.3, marginBottom: ".875rem" },
  rating:      { display: "flex", alignItems: "center", gap: ".625rem", marginBottom: "1.25rem" },
  priceBox:    { background: "#E8F5F0", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  price:       { fontSize: "2rem", fontWeight: 800, color: "#2C7A5E", display: "block" },
  originalPrice: { color: "#B8CFC8", textDecoration: "line-through", fontSize: ".9rem" },
  saving:      { color: "#3EA882", fontWeight: 600, fontSize: ".875rem" },
  description: { color: "#3D6B62", lineHeight: 1.7, marginBottom: "1.25rem", fontSize: ".9rem" },
  qtyRow:      { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" },
  qtyControl:  { display: "flex", alignItems: "center", border: "1.5px solid #D9E4E0", borderRadius: "8px", overflow: "hidden" },
  qtyBtn:      { width: "36px", height: "36px", border: "none", background: "#F7F9F8", fontWeight: 700, fontSize: "1.1rem", cursor: "pointer", color: "#2C7A5E" },
  qtyNum:      { width: "48px", textAlign: "center", fontWeight: 600 },
  badges:      { display: "flex", gap: "1rem", marginTop: "1.25rem", fontSize: ".8rem", color: "#5E8A80", flexWrap: "wrap" },
  specsSection: { marginTop: "1rem" },
  specsTitle:  { fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", color: "#111F1C" },
  table:       { width: "100%", borderCollapse: "collapse" },
  tdKey:       { padding: ".875rem 1.25rem", fontWeight: 600, fontSize: ".875rem", color: "#2C4F48", width: "40%" },
  tdVal:       { padding: ".875rem 1.25rem", fontSize: ".875rem", color: "#3D6B62" },
};
