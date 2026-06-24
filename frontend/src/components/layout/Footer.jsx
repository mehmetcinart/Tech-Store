import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div className="container">
        <div style={styles.grid}>
          <div>
            <div style={styles.brand}>⚡ Tech<strong>Store</strong></div>
            <p style={styles.desc}>Türkiye'nin en güncel teknoloji ürünlerini uygun fiyatlarla keşfedin.</p>
          </div>
          <div>
            <h4 style={styles.heading}>Kategoriler</h4>
            {["Telefon", "Laptop", "Kulaklık", "Tablet", "Televizyon"].map((c) => (
              <Link key={c} to={`/products?category=${c}`} style={styles.link}>{c}</Link>
            ))}
          </div>
          <div>
            <h4 style={styles.heading}>Hesabım</h4>
            <Link to="/login" style={styles.link}>Giriş Yap</Link>
            <Link to="/register" style={styles.link}>Kayıt Ol</Link>
            <Link to="/orders" style={styles.link}>Siparişlerim</Link>
          </div>
          <div>
            <h4 style={styles.heading}>İletişim</h4>
            <p style={styles.link}>info@techstore.com</p>
            <p style={styles.link}>0850 123 45 67</p>
            <p style={styles.link}>Pzt–Cmt: 09:00–18:00</p>
          </div>
        </div>
        <div style={styles.bottom}>
          <p>© 2024 TechStore. Tüm hakları saklıdır.</p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <span>💳 Güvenli Ödeme</span>
            <span>🚚 Hızlı Kargo</span>
            <span>🔄 Kolay İade</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: { background: "#1C3430", color: "#B8CFC8", marginTop: "3rem", paddingTop: "3rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2rem", paddingBottom: "2rem" },
  brand: { fontSize: "1.375rem", color: "#6BC9A2", marginBottom: ".75rem" },
  desc: { fontSize: ".875rem", lineHeight: 1.7, color: "#8AADA4" },
  heading: { color: "#E8F5F0", marginBottom: ".75rem", fontWeight: 600 },
  link: { display: "block", fontSize: ".875rem", color: "#8AADA4", marginBottom: ".375rem", transition: "color .15s" },
  bottom: {
    borderTop: "1px solid #2C4F48", padding: "1.25rem 0",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: ".8rem", color: "#5E8A80", flexWrap: "wrap", gap: ".5rem",
  },
};
