import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { formatPrice, formatDate } from "../../utils/formatters";

const TABS           = ["Ürünler", "Siparişler"];
const STATUS_OPTIONS = ["Hazırlanıyor", "Kargoya Verildi", "Teslim Edildi", "İptal Edildi"];
const CATEGORIES     = ["Telefon", "Laptop", "Kulaklık", "Tablet", "Televizyon", "Oyun Konsolu"];
const COLOR_OPTIONS  = [
  { label: "Siyah",      hex: "#1a1a1a" },
  { label: "Beyaz",      hex: "#f5f5f5" },
  { label: "Gümüş",     hex: "#c0c0c0" },
  { label: "Uzay Grisi", hex: "#6e6e73" },
  { label: "Kırmızı",   hex: "#e63946" },
  { label: "Mavi",      hex: "#2563eb" },
  { label: "Yeşil",     hex: "#2C7A5E" },
  { label: "Sarı",      hex: "#f59e0b" },
  { label: "Mor",       hex: "#7c3aed" },
  { label: "Pembe",     hex: "#ec4899" },
];

const DEFAULT_BRANDS = [
  { name: "Apple",   logo: "" },
  { name: "Samsung", logo: "" },
  { name: "Sony",    logo: "" },
  { name: "ASUS",    logo: "" },
];

// imageData: [{ url, colors }] — her görsele ait renkler ayrı tutulur
const EMPTY_FORM = { name: "", category: "", brand: "", stock: "", description: "", image: "", imageData: [], colors: [] };
const EMPTY_NEW_BRAND = { name: "", logo: "", logoPreview: "" };

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}

/* Canvas ile görselden baskın renkleri çıkar */
function extractDominantColors(dataURL, count = 5) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size   = 64; // küçük canvas — hız için
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      // Renkleri 32'lik bantlara grupla (renk dithering azalt)
      const buckets = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue; // şeffaf pikselleri atla
        // çok açık (beyaz) veya çok koyu (siyah) arka planları atla
        const brightness = (r + g + b) / 3;
        if (brightness > 240 || brightness < 15) continue;
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }

      const sorted = Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([key]) => {
          const [r, g, b] = key.split(",").map(Number);
          return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        });

      resolve(sorted);
    };
    img.src = dataURL;
  });
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const imageInputRef   = useRef(null);
  const brandLogoRef    = useRef(null);

  const [tab, setTab]           = useState("Ürünler");
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState("");
  const [imagePreviews, setImagePreviews] = useState([]); // [{ url, colors[] }]
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);

  // Marka sistemi
  const [brands, setBrands] = useState(() => {
    try { return JSON.parse(localStorage.getItem("techstore_brands")) || DEFAULT_BRANDS; }
    catch { return DEFAULT_BRANDS; }
  });
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand]         = useState(EMPTY_NEW_BRAND);

  useEffect(() => {
    localStorage.setItem("techstore_brands", JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    if (!user || !isAdmin) { navigate("/"); return; }
    Promise.all([api.get("/products"), api.get("/orders")])
      .then(([pRes, oRes]) => { setProducts(pRes.data.products); setOrders(oRes.data); })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  /* ── Ürün görselleri (çoklu) — her biri için ayrı renk tespiti ── */
  const handleImageFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newEntries = await Promise.all(
      files.map(async (file) => {
        const url    = await readFileAsDataURL(file);
        const colors = await extractDominantColors(url);
        return { url, colors };
      })
    );

    setImagePreviews((prev) => {
      const updated = [...prev, ...newEntries];
      setActivePreviewIdx(prev.length); // yeni yüklenen ilk görsele odaklan
      return updated;
    });
    setForm((prev) => ({
      ...prev,
      image:     prev.image || newEntries[0].url,
      imageData: [...prev.imageData, ...newEntries],
    }));
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = (idx) => {
    setImagePreviews((prev) => {
      const updated = prev.filter((_, i) => i !== idx);
      setActivePreviewIdx(Math.min(activePreviewIdx, updated.length - 1));
      return updated;
    });
    setForm((prev) => {
      const imageData = prev.imageData.filter((_, i) => i !== idx);
      return { ...prev, imageData, image: imageData[0]?.url || "" };
    });
  };

  /* ── Renk toggle ── */
  const toggleColor = (hex, isManual = false) => {
    if (isManual && imagePreviews.length > 0) {
      // Manuel seçimde: o görselin otomatik renklerini temizle
      setImagePreviews((prev) =>
        prev.map((p, i) => i === activePreviewIdx ? { ...p, colors: [] } : p)
      );
      setForm((prev) => ({
        ...prev,
        imageData: prev.imageData.map((d, i) => i === activePreviewIdx ? { ...d, colors: [] } : d),
      }));
    }
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.includes(hex)
        ? prev.colors.filter((c) => c !== hex)
        : [...prev.colors, hex],
    }));
  };

  /* ── Yeni marka logosu ── */
  const handleBrandLogoFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const result = await readFileAsDataURL(file);
    setNewBrand((prev) => ({ ...prev, logo: result, logoPreview: result }));
  };

  /* ── Yeni marka kaydet ── */
  const handleSaveBrand = () => {
    if (!newBrand.name.trim()) return;
    const brand = { name: newBrand.name.trim(), logo: newBrand.logo };
    setBrands((prev) => [...prev, brand]);
    setForm((prev) => ({ ...prev, brand: brand.name }));
    setNewBrand(EMPTY_NEW_BRAND);
    setShowNewBrand(false);
  };

  /* ── Ürün ekle ── */
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    const brandLogo = brands.find((b) => b.name === form.brand)?.logo || "";
    try {
      const { data } = await api.post("/products", { ...form, price: 0, brandLogo });
      setProducts((prev) => [...prev, data]);
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "Ürün eklenemedi");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setShowNewBrand(false);
    setForm(EMPTY_FORM);
    setImagePreviews([]);
    setActivePreviewIdx(0);
    setNewBrand(EMPTY_NEW_BRAND);
    setFormError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinizden emin misiniz?")) return;
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleStatusChange = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const selectedBrandObj = brands.find((b) => b.name === form.brand);

  return (
    <div className="container" style={{ padding: "1.5rem 1rem" }}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚙️ Admin Panel</h1>
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── ÜRÜNLER ── */}
      {tab === "Ürünler" && (
        <div>
          <div style={styles.tabHeader}>
            <p style={{ color: "#8AADA4" }}>{products.length} ürün</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "✕ Kapat" : "+ Yeni Ürün"}
            </button>
          </div>

          {showForm && (
            <div className="card" style={styles.formCard}>
              <h3 style={{ marginBottom: "1.5rem", fontWeight: 700, color: "#111F1C" }}>Yeni Ürün Ekle</h3>
              {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}

              <form onSubmit={handleAddProduct} style={styles.formGrid}>

                {/* Ürün Adı */}
                <div className="form-group">
                  <label className="form-label">Ürün Adı *</label>
                  <input className="form-input" name="name" value={form.name} required
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>

                {/* Stok */}
                <div className="form-group">
                  <label className="form-label">Stok *</label>
                  <input className="form-input" type="number" name="stock" value={form.stock} required
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
                </div>

                {/* Kategori */}
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select className="form-input" value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    <option value="">Seçiniz...</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Marka Seçimi */}
                <div className="form-group">
                  <label className="form-label">Marka</label>
                  <div style={styles.brandRow}>
                    <div style={styles.brandSelectWrap}>
                      {/* Seçili marka logosu */}
                      {selectedBrandObj?.logo && (
                        <img src={selectedBrandObj.logo} alt={form.brand} style={styles.brandSelectLogo} />
                      )}
                      <select className="form-input" style={{ paddingLeft: selectedBrandObj?.logo ? "2.5rem" : ".875rem" }}
                        value={form.brand}
                        onChange={(e) => { setForm((p) => ({ ...p, brand: e.target.value })); setShowNewBrand(false); }}>
                        <option value="">Seçiniz...</option>
                        {brands.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}
                      onClick={() => { setShowNewBrand((v) => !v); setForm((p) => ({ ...p, brand: "" })); }}>
                      ＋ Diğer
                    </button>
                  </div>

                  {/* Yeni Marka Paneli */}
                  {showNewBrand && (
                    <div style={styles.newBrandPanel}>
                      <p style={styles.newBrandTitle}>Yeni Marka Ekle</p>
                      <div style={styles.newBrandGrid}>
                        <div className="form-group">
                          <label className="form-label">Marka Adı</label>
                          <input className="form-input" placeholder="örn. Huawei"
                            value={newBrand.name}
                            onChange={(e) => setNewBrand((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Marka Logosu</label>
                          <label style={styles.brandLogoUpload} htmlFor="brandLogoInput">
                            {newBrand.logoPreview
                              ? <img src={newBrand.logoPreview} alt="logo" style={styles.brandLogoPreview} />
                              : <span style={{ fontSize: ".8rem", color: "#5E8A80" }}>📁 Logo seç</span>
                            }
                          </label>
                          <input id="brandLogoInput" type="file" accept="image/*"
                            ref={brandLogoRef} style={{ display: "none" }} onChange={handleBrandLogoFile} />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: ".625rem", marginTop: ".75rem" }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveBrand}
                          disabled={!newBrand.name.trim()}>
                          Kaydet ve Seç
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm"
                          onClick={() => { setShowNewBrand(false); setNewBrand(EMPTY_NEW_BRAND); }}>
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ürün Görselleri — çoklu */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">
                    Ürün Görselleri
                    <span style={{ color: "#8AADA4", fontWeight: 400 }}> (birden fazla eklenebilir)</span>
                  </label>

                  {/* Önizleme grid */}
                  {imagePreviews.length > 0 && (
                    <div style={styles.imgGrid}>
                      {imagePreviews.map((p, idx) => (
                        <div key={idx} style={{ ...styles.imgThumbWrap, ...(idx === activePreviewIdx ? styles.imgThumbActive : {}) }}
                          onClick={() => setActivePreviewIdx(idx)}>
                          <img src={p.url} alt={`görsel-${idx}`} style={styles.imgThumb} />
                          {idx === 0 && <span style={styles.imgMainBadge}>Ana</span>}
                          <button type="button" style={styles.imgRemoveBtn}
                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>✕</button>
                        </div>
                      ))}
                      {/* + ekle butonu */}
                      <label style={styles.imgAddBtn} htmlFor="productImageInput" title="Görsel ekle">
                        <span style={{ fontSize: "1.5rem", color: "#3EA882" }}>＋</span>
                      </label>
                    </div>
                  )}

                  {imagePreviews.length === 0 && (
                    <label style={styles.imageUploadLabel} htmlFor="productImageInput">
                      <div style={styles.imageUploadPlaceholder}>
                        <span style={{ fontSize: "2rem" }}>📷</span>
                        <span style={{ fontSize: ".875rem", color: "#5E8A80", marginTop: ".5rem" }}>Dosyadan görsel seç</span>
                        <span style={{ fontSize: ".75rem", color: "#8AADA4" }}>PNG, JPG, WEBP — çoklu seçim desteklenir</span>
                      </div>
                    </label>
                  )}
                  <input id="productImageInput" type="file" accept="image/*" multiple
                    ref={imageInputRef} style={{ display: "none" }} onChange={handleImageFiles} />
                </div>

                {/* Renkler — tespit + manuel */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">
                    Renkler <span style={{ color: "#8AADA4", fontWeight: 400 }}>(birden fazla seçilebilir)</span>
                  </label>

                  {/* Aktif görselin otomatik tespit edilen renkleri */}
                  {imagePreviews[activePreviewIdx]?.colors?.length > 0 && (
                    <div style={styles.detectedBox}>
                      <p style={styles.detectedTitle}>
                        🎨 Görsel {activePreviewIdx + 1}'den tespit edilen renkler — eklemek için tıkla:
                      </p>
                      <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                        {imagePreviews[activePreviewIdx].colors.map((hex) => {
                          const selected = form.colors.includes(hex);
                          return (
                            <button key={hex} type="button" title={hex}
                              style={{ ...styles.detectedSwatch, background: hex, ...(selected ? styles.detectedSwatchSelected : {}) }}
                              onClick={() => toggleColor(hex)}>
                              {selected && <span style={styles.colorCheck}>✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={styles.colorGrid}>
                    {COLOR_OPTIONS.map((c) => {
                      const selected = form.colors.includes(c.hex);
                      return (
                        <button key={c.hex} type="button" title={c.label}
                          style={{ ...styles.colorSwatch, background: c.hex, ...(selected ? styles.colorSwatchSelected : {}) }}
                          onClick={() => toggleColor(c.hex, true)}>
                          {selected && <span style={styles.colorCheck}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                  {form.colors.length > 0 && (
                    <div style={styles.selectedColors}>
                      {form.colors.map((hex) => {
                        const found = COLOR_OPTIONS.find((c) => c.hex === hex);
                        return (
                          <span key={hex} style={{ ...styles.colorTag, borderColor: hex }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: hex, display: "inline-block" }} />
                            {found?.label || hex}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Açıklama */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">Açıklama</label>
                  <textarea className="form-input" rows={3} style={{ resize: "vertical" }}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </div>

                <div style={{ gridColumn: "1/-1", display: "flex", gap: ".75rem" }}>
                  <button className="btn btn-primary" type="submit">Ürünü Ekle</button>
                  <button className="btn btn-secondary" type="button" onClick={resetForm}>İptal</button>
                </div>
              </form>
            </div>
          )}

          {/* Ürün Tablosu */}
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
                {products.map((p, i) => {
                  const brand = brands.find((b) => b.name === p.brand);
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? "#F7F9F8" : "#fff" }}>
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                          <img src={p.image || "https://via.placeholder.com/44"} alt={p.name}
                            style={{ width: "44px", height: "44px", objectFit: "contain", background: "#fff", borderRadius: "6px", padding: "2px" }} />
                          <div>
                            <p style={{ fontWeight: 600, fontSize: ".875rem", color: "#111F1C" }}>{p.name}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: ".375rem" }}>
                              {brand?.logo && <img src={brand.logo} alt={p.brand} style={{ height: "14px", objectFit: "contain" }} />}
                              <p style={{ color: "#8AADA4", fontSize: ".75rem" }}>{p.brand}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}><span className="badge badge-primary">{p.category}</span></td>
                      <td style={styles.td}><span style={{ fontWeight: 700, color: "#2C7A5E" }}>{formatPrice(p.price)}</span></td>
                      <td style={styles.td}><span style={{ color: p.stock <= 5 ? "#e05252" : "#3EA882", fontWeight: 600 }}>{p.stock}</span></td>
                      <td style={styles.td}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Sil</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SİPARİŞLER ── */}
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
                <tr><td colSpan={5} style={{ ...styles.td, textAlign: "center", color: "#8AADA4" }}>Henüz sipariş yok</td></tr>
              ) : orders.map((o, i) => (
                <tr key={o.id} style={{ background: i % 2 === 0 ? "#F7F9F8" : "#fff" }}>
                  <td style={styles.td}><code style={{ fontSize: ".8rem", color: "#2C7A5E" }}>#{o.id.slice(0, 8).toUpperCase()}</code></td>
                  <td style={styles.td}><span style={{ fontSize: ".8rem", color: "#8AADA4" }}>{formatDate(o.createdAt)}</span></td>
                  <td style={styles.td}><span style={{ fontSize: ".8rem", color: "#2C4F48" }}>{o.items.map((it) => it.name).join(", ")}</span></td>
                  <td style={styles.td}><span style={{ fontWeight: 700, color: "#2C7A5E" }}>{formatPrice(o.total)}</span></td>
                  <td style={styles.td}>
                    <select className="form-input" style={{ padding: ".3rem .5rem", fontSize: ".8rem" }}
                      value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
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
  header:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" },
  title:     { fontSize: "1.375rem", fontWeight: 700, color: "#111F1C" },
  tabs:      { display: "flex", background: "#E8F5F0", borderRadius: "10px", padding: ".25rem", gap: ".25rem" },
  tab:       { padding: ".5rem 1.25rem", border: "none", borderRadius: "8px", background: "transparent", fontWeight: 600, fontSize: ".875rem", cursor: "pointer", color: "#5E8A80" },
  tabActive: { background: "#fff", color: "#2C7A5E", boxShadow: "0 1px 4px rgba(44,122,94,.12)" },
  tabHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  formCard:  { padding: "1.5rem", marginBottom: "1.25rem" },
  formGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".875rem" },

  /* Marka */
  brandRow:        { display: "flex", gap: ".625rem", alignItems: "center" },
  brandSelectWrap: { position: "relative", flex: 1 },
  brandSelectLogo: { position: "absolute", left: ".625rem", top: "50%", transform: "translateY(-50%)", height: "20px", objectFit: "contain", zIndex: 1 },
  newBrandPanel:   { marginTop: ".75rem", background: "#F7F9F8", borderRadius: "10px", padding: "1rem", border: "1.5px solid #D9E4E0" },
  newBrandTitle:   { fontWeight: 700, fontSize: ".875rem", color: "#2C4F48", marginBottom: ".75rem" },
  newBrandGrid:    { display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" },
  brandLogoUpload: {
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px dashed #D9E4E0", borderRadius: "8px", height: "42px",
    cursor: "pointer", background: "#fff", overflow: "hidden",
  },
  brandLogoPreview: { height: "36px", objectFit: "contain", padding: "2px" },

  /* Ürün görseli */
  imageUploadLabel: {
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px dashed #D9E4E0", borderRadius: "10px",
    cursor: "pointer", overflow: "hidden", minHeight: "140px",
    background: "#F7F9F8", transition: "border-color .2s",
  },
  imageUploadPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem" },
  imagePreview: { width: "100%", maxHeight: "180px", objectFit: "contain", padding: ".5rem" },
  imgGrid: { display: "flex", gap: ".75rem", flexWrap: "wrap", marginBottom: ".5rem" },
  imgThumbWrap: { position: "relative", width: "90px", height: "90px", cursor: "pointer" },
  imgThumbActive: { outline: "3px solid #2C7A5E", borderRadius: "8px" },
  imgThumb: { width: "90px", height: "90px", objectFit: "contain", borderRadius: "8px", background: "#F7F9F8", border: "1.5px solid #D9E4E0", padding: "4px" },
  imgMainBadge: { position: "absolute", top: "4px", left: "4px", background: "#2C7A5E", color: "#fff", fontSize: ".6rem", fontWeight: 700, padding: "1px 5px", borderRadius: "4px" },
  imgRemoveBtn: { position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", borderRadius: "50%", background: "#e05252", color: "#fff", border: "none", cursor: "pointer", fontSize: ".7rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
  imgAddBtn: { width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #D9E4E0", borderRadius: "8px", cursor: "pointer", background: "#F7F9F8", transition: "border-color .2s" },
  detectedBox: { background: "#E8F5F0", borderRadius: "8px", padding: ".875rem", marginBottom: ".75rem", border: "1.5px solid #B8CFC8" },
  detectedTitle: { fontSize: ".8rem", fontWeight: 600, color: "#2C4F48", marginBottom: ".625rem" },
  detectedSwatch: { width: "40px", height: "40px", borderRadius: "8px", border: "2px solid transparent", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .15s, box-shadow .15s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" },
  detectedSwatchSelected: { border: "2px solid #2C7A5E", transform: "scale(1.1)", boxShadow: "0 0 0 3px rgba(44,122,94,.25)" },

  /* Renkler */
  colorGrid: { display: "flex", flexWrap: "wrap", gap: ".625rem", marginTop: ".375rem" },
  colorSwatch: {
    width: "36px", height: "36px", borderRadius: "50%",
    border: "2px solid transparent", cursor: "pointer",
    position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform .15s, box-shadow .15s",
    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
  },
  colorSwatchSelected: { border: "2px solid #2C7A5E", transform: "scale(1.15)", boxShadow: "0 0 0 3px rgba(44,122,94,.25)" },
  colorCheck:    { color: "#fff", fontSize: ".75rem", fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,.5)" },
  selectedColors:{ display: "flex", flexWrap: "wrap", gap: ".375rem", marginTop: ".625rem" },
  colorTag: {
    display: "inline-flex", alignItems: "center", gap: ".375rem",
    padding: ".25rem .625rem", borderRadius: "9999px",
    fontSize: ".75rem", fontWeight: 500, color: "#2C4F48",
    background: "#E8F5F0", border: "1.5px solid",
  },

  /* Tablo */
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#E8F5F0" },
  th:    { padding: ".875rem 1rem", textAlign: "left", fontSize: ".8rem", fontWeight: 700, color: "#5E8A80", textTransform: "uppercase", letterSpacing: ".04em" },
  td:    { padding: ".875rem 1rem", fontSize: ".875rem", verticalAlign: "middle" },
};
