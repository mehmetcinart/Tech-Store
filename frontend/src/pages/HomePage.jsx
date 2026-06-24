import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import ProductCard from "../components/ui/ProductCard";

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products/featured")
      .then(({ data }) => setFeatured(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={styles.hero}>
        <div className="container" style={styles.heroInner}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
              Teknolojinin En İyisi<br />
              <span style={{ color: "#6BC9A2" }}>Uygun Fiyatlarla</span>
            </h1>
            <p style={styles.heroSub}>
              iPhone'dan Samsung'a, laptop'tan oyun konsoluna binlerce ürün sizi bekliyor.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link to="/products" className="btn btn-lg" style={{ background: "#fff", color: "#2C7A5E" }}>
                Alışverişe Başla
              </Link>
              <Link to="/products?category=Telefon" className="btn btn-lg btn-outline"
                style={{ borderColor: "rgba(255,255,255,.5)", color: "#fff" }}>
                Telefonlar
              </Link>
            </div>
          </div>

          <div style={styles.heroBadges}>
            {[
              { icon: "🚚", title: "Ücretsiz Kargo", sub: "200₺ üzeri" },
              { icon: "🔄", title: "30 Gün İade",   sub: "Koşulsuz iade" },
              { icon: "🛡️", title: "2 Yıl Garanti", sub: "Resmi garanti" },
            ].map((b) => (
              <div key={b.title} style={styles.heroBadge}>
                <span style={{ fontSize: "1.5rem" }}>{b.icon}</span>
                <div>
                  <strong style={{ display: "block", fontSize: ".875rem", color: "#fff" }}>{b.title}</strong>
                  <small style={{ color: "#6BC9A2" }}>{b.sub}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kategoriler */}
      <section style={styles.section}>
        <div className="container">
          <h2 style={styles.sectionTitle}>Kategoriler</h2>
          <div style={styles.catGrid}>
            {[
              { name: "Telefon",       icon: "📱", bg: "#E8F5F0", color: "#2C7A5E" },
              { name: "Laptop",        icon: "💻", bg: "#E8F5F0", color: "#2C7A5E" },
              { name: "Kulaklık",      icon: "🎧", bg: "#d1f5e7", color: "#1F5C46" },
              { name: "Tablet",        icon: "📟", bg: "#E8F5F0", color: "#2C7A5E" },
              { name: "Televizyon",    icon: "📺", bg: "#d1f5e7", color: "#1F5C46" },
              { name: "Oyun Konsolu",  icon: "🎮", bg: "#E8F5F0", color: "#2C7A5E" },
            ].map((cat) => (
              <Link key={cat.name} to={`/products?category=${cat.name}`}
                style={{ ...styles.catCard, background: cat.bg }}>
                <span style={{ fontSize: "2rem" }}>{cat.icon}</span>
                <span style={{ ...styles.catName, color: cat.color }}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Öne Çıkan Ürünler */}
      <section style={styles.section}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Öne Çıkan Ürünler</h2>
            <Link to="/products" style={styles.seeAll}>Tümünü Gör →</Link>
          </div>
          {loading ? (
            <div className="page-loading"><div className="spinner" /></div>
          ) : (
            <div className="grid-products">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Neden TechStore */}
      <section style={styles.whySection}>
        <div className="container">
          <h2 style={{ ...styles.sectionTitle, textAlign: "center", marginBottom: "2rem", color: "#E8F5F0" }}>
            Neden TechStore?
          </h2>
          <div style={styles.featuresGrid}>
            {[
              { icon: "💰", title: "En Uygun Fiyat",  desc: "Piyasanın en rekabetçi fiyatları ile premium teknoloji ürünleri" },
              { icon: "⚡", title: "Hızlı Teslimat",   desc: "Siparişiniz aynı gün kargoya verilir, 1-3 iş gününde kapınızda" },
              { icon: "🔒", title: "Güvenli Alışveriş",desc: "256-bit SSL şifreleme ile tüm ödeme işlemleriniz güvende" },
              { icon: "🎯", title: "Uzman Destek",     desc: "Teknik destek ekibimiz her gün 09:00-21:00 arası hizmetinizde" },
            ].map((f) => (
              <div key={f.title} style={styles.featureCard}>
                <span style={{ fontSize: "2.5rem", marginBottom: ".75rem", display: "block" }}>{f.icon}</span>
                <h3 style={{ marginBottom: ".5rem", fontWeight: 700, color: "#E8F5F0" }}>{f.title}</h3>
                <p style={{ color: "#8AADA4", fontSize: ".9rem", lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: {
    background: "linear-gradient(135deg, #1C3430 0%, #2C7A5E 55%, #3EA882 100%)",
    color: "#fff",
    padding: "4rem 0",
  },
  heroInner:   { display: "flex", flexDirection: "column", gap: "2rem" },
  heroContent: { maxWidth: "600px" },
  heroTitle:   { fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "1rem" },
  heroSub:     { fontSize: "1.1rem", color: "#B8CFC8", marginBottom: "1.75rem", lineHeight: 1.7 },
  heroBadges:  { display: "flex", gap: "1.5rem", flexWrap: "wrap" },
  heroBadge: {
    display: "flex", alignItems: "center", gap: ".75rem",
    background: "rgba(255,255,255,.1)", borderRadius: "10px", padding: ".875rem 1rem",
  },
  section:       { padding: "2.5rem 0" },
  sectionTitle:  { fontSize: "1.375rem", fontWeight: 700, marginBottom: "1.25rem", color: "#111F1C" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" },
  seeAll:        { color: "#2C7A5E", fontWeight: 600, fontSize: ".875rem" },
  catGrid:  { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" },
  catCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: ".75rem",
    padding: "1.5rem 1rem", borderRadius: "12px",
    transition: "transform .2s, box-shadow .2s", textAlign: "center",
  },
  catName: { fontWeight: 600, fontSize: ".875rem" },
  whySection: { background: "#1C3430", padding: "3rem 0", marginTop: "1rem" },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" },
  featureCard:  { padding: "1.75rem", borderRadius: "12px", background: "rgba(255,255,255,.05)", textAlign: "center" },
};
