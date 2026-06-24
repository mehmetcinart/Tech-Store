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
  const [activeIdx, setActiveIdx]             = useState(0);
  const [selectedColor, setSelectedColor]     = useState(null);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    addItem({ ...product, selectedColor: selectedColor || null }, quantity);
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

  // Görsel listesi — imageData varsa onu, yoksa image'i kullan
  const imageList = product.imageData?.length
    ? product.imageData
    : [{ url: product.image, colors: product.colors || [] }];

  // Model varyantları
  const productVariants = product.productVariants?.length > 0 ? product.productVariants : null;
  const activeModelVariant = productVariants ? productVariants[selectedVariantIdx] : null;
  const displayPrice = activeModelVariant?.price ? Number(activeModelVariant.price) : product.price;

  // colorVariants: model varyantı varsa ondan, yoksa ürünün kendisinden
  const colorVariants = activeModelVariant
    ? (activeModelVariant.colorVariants?.length > 0
        ? activeModelVariant.colorVariants
        : (activeModelVariant.colors || []).map((c) => ({ color: c, imageIdx: 0 })))
    : product.colorVariants?.length
      ? product.colorVariants
      : (product.colors || []).map((color) => ({ color, imageIdx: 0 }));

  const activeEntry  = imageList[activeIdx] || imageList[0];
  const activeColors = activeEntry?.colors || [];

  // Görselin ayırt edici rengini arka plan yap — doygunluk öncelikli
  const imageBg = (() => {
    if (!activeColors[0]) return "#F0F2F1";
    const hex = activeColors[0].replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const brightness = (r + g + b) / 3;
    // Canlı renk (pembe/mavi/turuncu) → %35 | Koyu (siyah/gri) → %70 | Soluk → %20
    const alpha = saturation > 0.25 ? 0.35 : brightness < 100 ? 0.70 : 0.20;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  })();

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <nav style={styles.breadcrumb}>
        <Link to="/">Ana Sayfa</Link> /&nbsp;
        <Link to="/products">Ürünler</Link> /&nbsp;
        <Link to={`/products?category=${product.category}`}>{product.category}</Link> /&nbsp;
        <span style={{ color: "#2C7A5E" }}>{product.name}</span>
      </nav>

      <div style={styles.layout}>
        {/* ── Görsel Galerisi ── */}
        <div>
          {/* Ana görsel */}
          <div style={{ ...styles.mainImageWrap, background: imageBg }}>
            <img
              key={activeIdx}
              src={activeEntry?.url || product.image}
              alt={product.name}
              style={styles.mainImage}
            />
            {product.discount > 0 && (
              <span style={styles.discountBadge}>%{product.discount} İndirim</span>
            )}
            {/* Ok butonları */}
            {imageList.length > 1 && (
              <>
                <button style={{ ...styles.arrowBtn, left: ".5rem" }}
                  onClick={() => setActiveIdx((i) => (i - 1 + imageList.length) % imageList.length)}>‹</button>
                <button style={{ ...styles.arrowBtn, right: ".5rem" }}
                  onClick={() => setActiveIdx((i) => (i + 1) % imageList.length)}>›</button>
              </>
            )}
          </div>

          {/* Thumbnail'lar */}
          {imageList.length > 1 && (
            <div style={styles.thumbRow}>
              {imageList.map((entry, idx) => (
                <button key={idx} type="button"
                  style={{ ...styles.thumbBtn, ...(idx === activeIdx ? styles.thumbBtnActive : {}) }}
                  onClick={() => setActiveIdx(idx)}>
                  <img src={entry.url} alt={`görsel-${idx + 1}`} style={styles.thumbImg} />
                </button>
              ))}
            </div>
          )}

        </div>

        {/* ── Ürün Bilgileri ── */}
        <div>
          {/* Marka logosu + adı */}
          <div style={styles.brandRow}>
            {product.brandLogo && (
              <img src={product.brandLogo} alt={product.brand} style={styles.brandLogo} />
            )}
            <p style={styles.brand}>{product.brand}</p>
          </div>

          <h1 style={styles.title}>{product.name}</h1>

          <div style={styles.rating}>
            <span className="stars">
              {"★".repeat(Math.round(product.rating))}{"☆".repeat(5 - Math.round(product.rating))}
            </span>
            <span style={{ color: "#8AADA4", fontSize: ".9rem" }}>
              {product.rating}/5 ({product.reviewCount} değerlendirme)
            </span>
          </div>

          {/* Model Seçici */}
          {productVariants && productVariants.length > 1 && (
            <div style={styles.modelBox}>
              <p style={styles.modelLabel}>Model Seçin:</p>
              <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                {productVariants.map((v, i) => (
                  <button key={i} type="button"
                    onClick={() => { setSelectedVariantIdx(i); setSelectedColor(null); }}
                    style={{ ...styles.modelBtn, ...(i === selectedVariantIdx ? styles.modelBtnActive : {}) }}>
                    {v.modelName}
                    {v.price && <span style={{ marginLeft: ".375rem", fontWeight: 800 }}>₺{Number(v.price).toLocaleString("tr-TR")}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={styles.priceBox}>
            <span style={styles.price}>{formatPrice(displayPrice)}</span>
          </div>

          {product.description && <p style={styles.description}>{product.description}</p>}

          {/* Stoktaki Renkler */}
          {colorVariants.length > 0 && (
            <div style={styles.colorPickerBox}>
              <div style={styles.colorPickerHeader}>
                <p style={styles.colorPickerLabel}>Stoktaki Renkler</p>
                {selectedColor && (
                  <span style={styles.selectedColorBadge}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: selectedColor, display: "inline-block", boxShadow: "0 1px 3px rgba(0,0,0,.25)" }} />
                    Seçilen renk
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: ".625rem", flexWrap: "wrap" }}>
                {colorVariants.map(({ color, imageIdx }) => {
                  const isSelected = selectedColor === color;
                  return (
                    <button key={color} type="button" title={color}
                      onClick={() => {
                        if (isSelected) { setSelectedColor(null); }
                        else { setSelectedColor(color); setActiveIdx(imageIdx); }
                      }}
                      style={{ ...styles.colorBtn, background: color, ...(isSelected ? styles.colorBtnSelected : {}) }}>
                      {isSelected && <span style={styles.colorBtnCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>
              {selectedColor && (
                <div style={styles.currentColorRow}>
                  <span style={{ ...styles.currentColorDot, background: selectedColor }} />
                  <span style={styles.currentColorText}>Mevcut renk: <strong>{selectedColor}</strong></span>
                  <button type="button" style={styles.clearColorBtn} onClick={() => setSelectedColor(null)}>✕ Kaldır</button>
                </div>
              )}
            </div>
          )}

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
      {Object.keys(product.specs || {}).length > 0 && (
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
  breadcrumb:   { fontSize: ".8rem", color: "#8AADA4", marginBottom: "1.5rem", display: "flex", gap: ".5rem", flexWrap: "wrap" },
  layout:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem", marginBottom: "2.5rem" },

  /* Galeri */
  mainImageWrap: { position: "relative", borderRadius: "16px", aspectRatio: "1", overflow: "hidden", transition: "background .4s ease" },
  mainImage:    { width: "100%", height: "100%", objectFit: "contain", padding: "2rem", transition: "opacity .2s" },
  discountBadge:{ position: "absolute", top: ".875rem", left: ".875rem", background: "#e05252", color: "#fff", fontSize: ".75rem", fontWeight: 700, padding: ".25rem .625rem", borderRadius: "6px" },
  arrowBtn:     { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,.85)", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,.12)", color: "#2C7A5E", fontWeight: 700 },
  thumbRow:     { display: "flex", gap: ".625rem", marginTop: ".875rem", flexWrap: "wrap" },
  thumbBtn:     { border: "2px solid transparent", borderRadius: "8px", padding: "2px", background: "#F7F9F8", cursor: "pointer", transition: "border-color .15s" },
  thumbBtnActive:{ borderColor: "#2C7A5E" },
  thumbImg:     { width: "60px", height: "60px", objectFit: "contain", borderRadius: "6px", display: "block" },

  /* Görsel renk bölümü */
  colorSection: { marginTop: ".875rem", background: "#E8F5F0", borderRadius: "10px", padding: ".75rem 1rem" },
  colorLabel:   { fontSize: ".75rem", fontWeight: 600, color: "#2C4F48", marginBottom: ".5rem" },
  colorDots:    { display: "flex", gap: ".5rem", flexWrap: "wrap" },
  colorDot:     { width: "22px", height: "22px", borderRadius: "50%", display: "inline-block", boxShadow: "0 1px 3px rgba(0,0,0,.25)", border: "1.5px solid rgba(255,255,255,.6)" },

  /* Ürün bilgi */
  brandRow:     { display: "flex", alignItems: "center", gap: ".625rem", marginBottom: ".5rem" },
  brandLogo:    { height: "22px", objectFit: "contain" },
  brand:        { fontSize: ".875rem", fontWeight: 600, color: "#5E8A80", textTransform: "uppercase", letterSpacing: ".05em" },
  title:        { fontSize: "1.625rem", fontWeight: 800, color: "#111F1C", lineHeight: 1.3, marginBottom: ".875rem" },
  rating:       { display: "flex", alignItems: "center", gap: ".625rem", marginBottom: "1.25rem" },
  priceBox:     { background: "#E8F5F0", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.25rem" },
  price:        { fontSize: "2rem", fontWeight: 800, color: "#2C7A5E", display: "block" },
  originalPrice:{ color: "#B8CFC8", textDecoration: "line-through", fontSize: ".9rem" },
  saving:       { color: "#3EA882", fontWeight: 600, fontSize: ".875rem" },
  description:  { color: "#3D6B62", lineHeight: 1.7, marginBottom: "1.25rem", fontSize: ".9rem" },

  /* Model seçici */
  modelBox:     { background: "#F7F9F8", border: "1.5px solid #D9E4E0", borderRadius: "12px", padding: ".875rem 1rem", marginBottom: "1.25rem" },
  modelLabel:   { fontSize: ".8rem", fontWeight: 700, color: "#5E8A80", marginBottom: ".5rem" },
  modelBtn:     { padding: ".45rem 1rem", border: "1.5px solid #D9E4E0", borderRadius: "9999px", background: "#fff", cursor: "pointer", fontSize: ".85rem", color: "#3D6B62", fontWeight: 600, transition: "all .18s" },
  modelBtnActive: { background: "#2C7A5E", color: "#fff", borderColor: "#2C7A5E", boxShadow: "0 2px 8px rgba(44,122,94,.25)" },

  /* Renk seçici */
  colorPickerBox:     { background: "#F7F9F8", border: "1.5px solid #D9E4E0", borderRadius: "14px", padding: "1rem 1.125rem", marginBottom: "1.25rem" },
  colorPickerHeader:  { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: ".75rem" },
  colorPickerLabel:   { fontSize: ".875rem", fontWeight: 700, color: "#2C4F48" },
  selectedColorBadge: { display: "inline-flex", alignItems: "center", gap: ".375rem", fontSize: ".75rem", fontWeight: 600, color: "#2C7A5E", background: "#E8F5F0", padding: ".2rem .625rem", borderRadius: "9999px", border: "1.5px solid #6BC9A2" },
  colorBtn: {
    width: "34px", height: "34px", borderRadius: "50%", border: "2.5px solid transparent",
    cursor: "pointer", position: "relative", display: "flex", alignItems: "center",
    justifyContent: "center", transition: "transform .18s, box-shadow .18s",
    boxShadow: "0 1px 4px rgba(0,0,0,.22)",
  },
  colorBtnSelected: { border: "2.5px solid #2C7A5E", transform: "scale(1.18)", boxShadow: "0 0 0 4px rgba(44,122,94,.22)" },
  colorBtnCheck:    { color: "#fff", fontSize: ".75rem", fontWeight: 800, textShadow: "0 1px 3px rgba(0,0,0,.6)" },
  currentColorRow:  { display: "flex", alignItems: "center", gap: ".625rem", marginTop: ".875rem", padding: ".625rem .875rem", background: "#E8F5F0", borderRadius: "10px", border: "1.5px solid #B8CFC8" },
  currentColorDot:  { width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,.25)", border: "2px solid #fff" },
  currentColorText: { fontSize: ".8rem", color: "#2C4F48", flex: 1 },
  clearColorBtn:    { background: "none", border: "none", cursor: "pointer", color: "#8AADA4", fontSize: ".75rem", fontWeight: 600, padding: ".1rem .375rem", borderRadius: "6px" },
  qtyRow:       { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" },
  qtyControl:   { display: "flex", alignItems: "center", border: "1.5px solid #D9E4E0", borderRadius: "8px", overflow: "hidden" },
  qtyBtn:       { width: "36px", height: "36px", border: "none", background: "#F7F9F8", fontWeight: 700, fontSize: "1.1rem", cursor: "pointer", color: "#2C7A5E" },
  qtyNum:       { width: "48px", textAlign: "center", fontWeight: 600 },
  badges:       { display: "flex", gap: "1rem", marginTop: "1.25rem", fontSize: ".8rem", color: "#5E8A80", flexWrap: "wrap" },

  /* Teknik özellikler */
  specsSection: { marginTop: "1rem" },
  specsTitle:   { fontSize: "1.125rem", fontWeight: 700, marginBottom: "1rem", color: "#111F1C" },
  table:        { width: "100%", borderCollapse: "collapse" },
  tdKey:        { padding: ".875rem 1.25rem", fontWeight: 600, fontSize: ".875rem", color: "#2C4F48", width: "40%" },
  tdVal:        { padding: ".875rem 1.25rem", fontSize: ".875rem", color: "#3D6B62" },
};
