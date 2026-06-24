import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../utils/formatters";

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  return (
    <div style={styles.card} className="card">
      <Link to={`/products/${product.id}`}>
        <div style={styles.imageWrapper}>
          <img src={product.image} alt={product.name} style={styles.image} />
          {product.discount > 0 && (
            <span style={styles.discountBadge}>-%{product.discount}</span>
          )}
        </div>
        <div style={styles.body}>
          <p style={styles.brand}>{product.brand}</p>
          <h3 style={styles.name}>{product.name}</h3>
          <div style={styles.rating}>
            <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
            <span style={styles.ratingText}>({product.reviewCount})</span>
          </div>
          <div style={styles.priceRow}>
            <span style={styles.price}>{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <span style={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <p style={styles.lowStock}>Son {product.stock} ürün!</p>
          )}
          {product.stock === 0 && <p style={styles.outOfStock}>Stokta Yok</p>}
        </div>
      </Link>
      <div style={{ padding: "0 1rem 1rem" }}>
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
        >
          🛒 Sepete Ekle
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: { transition: "transform .2s, box-shadow .2s", cursor: "pointer" },
  imageWrapper: { position: "relative", background: "#F7F9F8", aspectRatio: "1" },
  image: { width: "100%", height: "100%", objectFit: "contain", padding: "1rem" },
  discountBadge: {
    position: "absolute", top: ".625rem", left: ".625rem",
    background: "#e05252", color: "#fff",
    fontSize: ".75rem", fontWeight: 700,
    padding: ".2rem .5rem", borderRadius: "6px",
  },
  body: { padding: ".875rem 1rem .5rem" },
  brand: {
    fontSize: ".75rem", color: "#5E8A80", fontWeight: 600,
    textTransform: "uppercase", letterSpacing: ".05em", marginBottom: ".25rem",
  },
  name: {
    fontSize: ".9rem", fontWeight: 600, color: "#111F1C", lineHeight: 1.4,
    marginBottom: ".5rem", display: "-webkit-box",
    WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
  },
  rating: { display: "flex", alignItems: "center", gap: ".375rem", marginBottom: ".5rem" },
  ratingText: { fontSize: ".75rem", color: "#8AADA4" },
  priceRow: { display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap" },
  price: { fontSize: "1.1rem", fontWeight: 700, color: "#2C7A5E" },
  originalPrice: { fontSize: ".8rem", color: "#B8CFC8", textDecoration: "line-through" },
  lowStock: { fontSize: ".75rem", color: "#d4a017", fontWeight: 600, marginTop: ".25rem" },
  outOfStock: { fontSize: ".75rem", color: "#e05252", fontWeight: 600, marginTop: ".25rem" },
};
