import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import { formatPrice, formatDate } from "../../utils/formatters";

const TABS           = ["Ürünler", "Siparişler", "Kullanıcılar"];
const STATUS_OPTIONS = ["Hazırlanıyor", "Kargoya Verildi", "Teslim Edildi", "İptal Edildi"];
const DEFAULT_CATEGORIES = ["Telefon", "Laptop", "Kulaklık", "Tablet", "Televizyon", "Oyun Konsolu"];
const DEFAULT_MODELS = []; // [{ id, name, price, specs: {} }]
const EMPTY_MODEL    = { name: "", price: "", specs: {} };

const DEFAULT_BRANDS = [];

// imageData: [{ url, colors }] — her görsele ait renkler ayrı tutulur
const EMPTY_FORM = { name: "", category: "", brand: "", model: "", price: "", stock: "", description: "", image: "", imageData: [], colors: [], colorVariants: [], specs: {} };
const EMPTY_NEW_BRAND = { name: "", logo: "", logoPreview: "" };

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}

/* Canvas ile görselden baskın renkleri çıkar — doygunluk öncelikli */
function extractDominantColors(dataURL, count = 5) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const size   = 96;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      const buckets = {};
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 128) continue;
        if ((r + g + b) / 3 > 242) continue; // saf beyaz arka planı atla
        const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
        buckets[key] = (buckets[key] || 0) + 1;
      }

      const maxFreq = Math.max(...Object.values(buckets), 1);

      // Skor = frekans * (1 + doygunluk*8) — canlı renkler (pembe, mavi) gri/beyazı geçer
      const scored = Object.entries(buckets).map(([key, freq]) => {
        const [r, g, b] = key.split(",").map(Number);
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max; // HSV doygunluğu
        const score = (freq / maxFreq) + saturation * 8;
        return { key, score };
      });

      scored.sort((a, b) => b.score - a.score);

      const result = scored.slice(0, count).map(({ key }) => {
        const [r, g, b] = key.split(",").map(Number);
        return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      });

      resolve(result);
    };
    img.src = dataURL;
  });
}

function ManualColorPicker({ onAdd }) {
  const [picked, setPicked] = useState("#2C7A5E");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".625rem", background: "#F7F9F8", border: "1.5px solid #D9E4E0", borderRadius: "10px", padding: ".5rem .875rem" }}>
      <label style={{ fontSize: ".8rem", fontWeight: 600, color: "#5E8A80", whiteSpace: "nowrap" }}>Manuel ekle:</label>
      <div style={{ position: "relative", width: "36px", height: "36px", flexShrink: 0 }}>
        <span style={{ display: "block", width: "36px", height: "36px", borderRadius: "50%", background: picked, boxShadow: "0 1px 4px rgba(0,0,0,.25)", border: "2px solid #fff", cursor: "pointer" }} />
        <input type="color" value={picked} onChange={(e) => setPicked(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer", border: "none" }} />
      </div>
      <input type="text" value={picked} maxLength={7}
        onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setPicked(e.target.value); }}
        style={{ flex: 1, border: "1.5px solid #D9E4E0", borderRadius: "7px", padding: ".3rem .625rem", fontSize: ".875rem", fontFamily: "monospace", color: "#111F1C", background: "#fff", outline: "none" }} />
      <button type="button"
        style={{ padding: ".375rem .875rem", background: "#2C7A5E", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: ".8rem", cursor: "pointer", whiteSpace: "nowrap", transition: "background .15s" }}
        onClick={() => { if (/^#[0-9a-fA-F]{6}$/.test(picked)) onAdd(picked); }}>
        Ekle
      </button>
    </div>
  );
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const imageInputRef   = useRef(null);
  const brandLogoRef    = useRef(null);

  const [tab, setTab]           = useState("Ürünler");
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [userList, setUserList] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState("");
  const [imagePreviews, setImagePreviews] = useState([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [specRows, setSpecRows]             = useState([]);
  // productVariants: [{modelName, price, colors:[], colorVariants:[]}]
  const [productVariants, setProductVariants] = useState([]);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);

  // Kategori & Model sistemi
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem("techstore_categories")) || DEFAULT_CATEGORIES; }
    catch { return DEFAULT_CATEGORIES; }
  });
  const [models, setModels] = useState([]);
  const [newCatInput, setNewCatInput]     = useState("");
  const [showNewCat, setShowNewCat]       = useState(false);
  const [newModel, setNewModel]           = useState(EMPTY_MODEL);
  const [modelSpecRows, setModelSpecRows] = useState([]);
  const [showNewModel, setShowNewModel]   = useState(false);

  // Marka sistemi
  const [brands, setBrands] = useState(() => {
    try { return JSON.parse(localStorage.getItem("techstore_brands")) || DEFAULT_BRANDS; }
    catch { return DEFAULT_BRANDS; }
  });
  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrand, setNewBrand]         = useState(EMPTY_NEW_BRAND);

  useEffect(() => { localStorage.setItem("techstore_categories", JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem("techstore_brands",     JSON.stringify(brands));     }, [brands]);

  useEffect(() => {
    if (!user || !isAdmin) { navigate("/"); return; }
    Promise.all([api.get("/products"), api.get("/orders"), api.get("/users")])
      .then(([pRes, oRes, uRes]) => { setProducts(pRes.data.products); setOrders(oRes.data); setUserList(uRes.data); })
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

  /* ── Renk helpers — varyant varsa aktif varyanta, yoksa form'a yaz ── */
  const getActiveColors = () =>
    productVariants.length > 0 ? (productVariants[activeVariantIdx]?.colors || []) : form.colors;

  const setActiveColorData = (colorsFn, cvFn) => {
    if (productVariants.length > 0) {
      setProductVariants((pvs) => pvs.map((v, i) =>
        i !== activeVariantIdx ? v : { ...v, colors: colorsFn(v.colors), colorVariants: cvFn(v.colorVariants) }
      ));
    } else {
      setForm((f) => ({ ...f, colors: colorsFn(f.colors), colorVariants: cvFn(f.colorVariants) }));
    }
  };

  const addColor = (hex, imgIdx = activePreviewIdx) => {
    if (getActiveColors().includes(hex)) return;
    setActiveColorData(cs => [...cs, hex], cvs => [...cvs, { color: hex, imageIdx: imgIdx }]);
  };

  const removeColor = (hex) => {
    setActiveColorData(cs => cs.filter(c => c !== hex), cvs => cvs.filter(v => v.color !== hex));
  };

  const toggleDetectedColor = (hex) => {
    getActiveColors().includes(hex) ? removeColor(hex) : addColor(hex, activePreviewIdx);
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

  /* ── Ürün ekle / güncelle ── */
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setFormError("");
    const brandLogo = brands.find((b) => b.name === form.brand)?.logo || "";
    // Varyant varsa ilk varyantın fiyatı ve tüm renklerin birleşimi
    const hasVariants = productVariants.length > 0;
    const payload = {
      ...form,
      price: hasVariants ? (productVariants[0]?.price || form.price) : form.price,
      colors: hasVariants ? [...new Set(productVariants.flatMap(v => v.colors))] : form.colors,
      colorVariants: hasVariants ? (productVariants[0]?.colorVariants || []) : form.colorVariants,
      productVariants: hasVariants ? productVariants : [],
      brandLogo,
    };
    try {
      if (editingId) {
        const { data } = await api.put(`/products/${editingId}`, payload);
        setProducts((prev) => prev.map((p) => (p.id === editingId ? data : p)));
      } else {
        const { data } = await api.post("/products", payload);
        setProducts((prev) => [...prev, data]);
      }
      resetForm();
    } catch (err) {
      setFormError(err.response?.data?.message || (editingId ? "Ürün güncellenemedi" : "Ürün eklenemedi"));
    }
  };

  /* ── Düzenleme modunu aç ── */
  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name:        product.name        || "",
      category:    product.category    || "",
      brand:       product.brand       || "",
      price:       product.price       ?? "",
      stock:       product.stock       ?? "",
      description: product.description || "",
      image:       product.image       || "",
      imageData:   product.imageData   || [],
      model:         product.model         || "",
      colors:        product.colors        || [],
      colorVariants: product.colorVariants || (product.colors || []).map((c) => ({ color: c, imageIdx: 0 })),
      specs:         product.specs         || {},
    });
    const pv = product.productVariants || [];
    setProductVariants(pv);
    setActiveVariantIdx(0);
    // Düzenlenen ürünün modellerini listeye yükle
    setModels(pv.map((v) => ({ name: v.modelName, price: v.price || "", specs: {} })));
    const previews = product.imageData?.length
      ? product.imageData
      : product.image ? [{ url: product.image, colors: product.colors || [] }] : [];
    setImagePreviews(previews);
    setActivePreviewIdx(0);
    setSpecRows(Object.entries(product.specs || {}).map(([key, value]) => ({ key, value })));
    setShowForm(true);
    setShowNewBrand(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setShowNewBrand(false);
    setForm(EMPTY_FORM);
    setImagePreviews([]);
    setActivePreviewIdx(0);
    setNewBrand(EMPTY_NEW_BRAND);
    setSpecRows([]);
    setProductVariants([]);
    setActiveVariantIdx(0);
    setModels([]);
    setShowNewCat(false);
    setNewCatInput("");
    setShowNewModel(false);
    setNewModel(EMPTY_MODEL);
    setModelSpecRows([]);
    setFormError("");
  };

  /* ── Spec satırı güncelle ── */
  const updateSpecRow = (idx, field, val) => {
    setSpecRows((prev) => {
      const updated = prev.map((r, i) => i === idx ? { ...r, [field]: val } : r);
      setForm((f) => ({
        ...f,
        specs: Object.fromEntries(updated.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])),
      }));
      return updated;
    });
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

  const handleRoleChange = async (uid, role) => {
    try {
      const { data } = await api.put(`/users/${uid}/role`, { role });
      setUserList((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: data.role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || "Rol güncellenemedi");
    }
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
            <button className="btn btn-primary btn-sm" onClick={() => { if (showForm && !editingId) { resetForm(); } else { resetForm(); setShowForm(true); } }}>
              {showForm && !editingId ? "✕ Kapat" : "+ Yeni Ürün"}
            </button>
          </div>

          {showForm && (
            <div className="card" style={styles.formCard}>
              <h3 style={{ marginBottom: "1.5rem", fontWeight: 700, color: "#111F1C" }}>
                {editingId ? "✏️ Ürünü Düzenle" : "Yeni Ürün Ekle"}
              </h3>
              {formError && <div className="alert alert-error" style={{ marginBottom: "1rem" }}>{formError}</div>}

              <form onSubmit={handleSubmitProduct} style={styles.formGrid}>

                {/* Ürün Adı */}
                <div className="form-group">
                  <label className="form-label">Ürün Adı *</label>
                  <input className="form-input" name="name" value={form.name} required
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </div>

                {/* Stok */}
                <div className="form-group">
                  <label className="form-label">Stok *</label>
                  <input className="form-input" type="number" name="stock" value={form.stock} required min="0"
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} />
                </div>

                {/* Fiyat */}
                <div className="form-group">
                  <label className="form-label">Fiyat (₺)</label>
                  <input className="form-input" type="number" name="price" value={form.price} min="0" step="0.01"
                    placeholder="0.00"
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
                </div>

                {/* Kategori */}
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <div style={styles.brandRow}>
                    <select className="form-input" value={form.category}
                      onChange={(e) => { setForm((p) => ({ ...p, category: e.target.value })); setShowNewCat(false); }}>
                      <option value="">Seçiniz...</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}
                      onClick={() => { setShowNewCat((v) => !v); }}>
                      ＋ Ekle
                    </button>
                  </div>
                  {showNewCat && (
                    <div style={styles.newBrandPanel}>
                      <p style={styles.newBrandTitle}>Yeni Kategori</p>
                      <div style={{ display: "flex", gap: ".5rem" }}>
                        <input className="form-input" placeholder="Kategori adı..."
                          value={newCatInput} onChange={(e) => setNewCatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newCatInput.trim() && !categories.includes(newCatInput.trim())) { const cat = newCatInput.trim(); setCategories((p) => [...p, cat]); setForm((f) => ({ ...f, category: cat })); setNewCatInput(""); setShowNewCat(false); } } }} />
                        <button type="button" className="btn btn-primary btn-sm"
                          disabled={!newCatInput.trim()}
                          onClick={() => { if (newCatInput.trim() && !categories.includes(newCatInput.trim())) { const cat = newCatInput.trim(); setCategories((p) => [...p, cat]); setForm((f) => ({ ...f, category: cat })); setNewCatInput(""); setShowNewCat(false); } }}>
                          Kaydet
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm"
                          onClick={() => { setShowNewCat(false); setNewCatInput(""); }}>İptal</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Model */}
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <div style={styles.brandRow}>
                    <select className="form-input" value={form.model}
                      onChange={(e) => {
                        const selected = models.find((m) => m.name === e.target.value);
                        if (selected) {
                          const rows = Object.entries(selected.specs || {}).map(([key, value]) => ({ key, value }));
                          setSpecRows(rows);
                          setForm((p) => ({ ...p, model: selected.name, price: selected.price || p.price, specs: selected.specs || {} }));
                        } else {
                          setForm((p) => ({ ...p, model: e.target.value }));
                        }
                        setShowNewModel(false);
                      }}>
                      <option value="">Seçiniz...</option>
                      {models.map((m) => <option key={m.name} value={m.name}>{m.name}{m.price ? ` — ₺${m.price}` : ""}</option>)}
                    </select>
                    <button type="button" className="btn btn-primary btn-sm" style={{ whiteSpace: "nowrap" }}
                      disabled={!form.model || productVariants.some(v => v.modelName === form.model)}
                      onClick={() => {
                        const selected = models.find((m) => m.name === form.model);
                        if (!selected) return;
                        const newVariant = { modelName: selected.name, price: selected.price || "", colors: [], colorVariants: [] };
                        setProductVariants((pvs) => { const updated = [...pvs, newVariant]; setActiveVariantIdx(updated.length - 1); return updated; });
                        setForm((p) => ({ ...p, model: "" }));
                      }}>
                      + Varyant
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}
                      onClick={() => { setShowNewModel((v) => !v); setForm((p) => ({ ...p, model: "" })); }}>
                      ＋ Yeni
                    </button>
                  </div>
                  {/* Eklenen varyantlar */}
                  {productVariants.length > 0 && (
                    <div style={{ marginTop: ".625rem", display: "flex", flexDirection: "column", gap: ".375rem" }}>
                      {productVariants.map((v, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: ".5rem", background: i === activeVariantIdx ? "#E8F5F0" : "#F7F9F8", border: `1.5px solid ${i === activeVariantIdx ? "#2C7A5E" : "#D9E4E0"}`, borderRadius: "8px", padding: ".375rem .75rem" }}>
                          <button type="button" onClick={() => setActiveVariantIdx(i)}
                            style={{ flex: 1, background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: ".625rem" }}>
                            <span style={{ fontWeight: 700, fontSize: ".875rem", color: "#111F1C" }}>{v.modelName}</span>
                            <input type="number" placeholder="Fiyat ₺" value={v.price}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => setProductVariants((pvs) => pvs.map((pv, pi) => pi !== i ? pv : { ...pv, price: e.target.value }))}
                              style={{ width: "90px", border: "1.5px solid #D9E4E0", borderRadius: "6px", padding: ".2rem .5rem", fontSize: ".8rem" }} />
                            {v.colors.length > 0 && (
                              <div style={{ display: "flex", gap: "3px" }}>
                                {v.colors.slice(0, 5).map(c => <span key={c} style={{ width: "12px", height: "12px", borderRadius: "50%", background: c, border: "1.5px solid #fff", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />)}
                              </div>
                            )}
                          </button>
                          <button type="button" style={styles.specRemoveBtn}
                            onClick={() => setProductVariants((pvs) => { const updated = pvs.filter((_, pi) => pi !== i); setActiveVariantIdx(Math.min(activeVariantIdx, updated.length - 1)); return updated; })}>✕</button>
                        </div>
                      ))}
                      <p style={{ fontSize: ".75rem", color: "#5E8A80" }}>
                        Renk eklemek için bir varyanta tıklayın, ardından aşağıdaki renk bölümünden seçin.
                      </p>
                    </div>
                  )}
                  {showNewModel && (
                    <div style={styles.newBrandPanel}>
                      <p style={styles.newBrandTitle}>Yeni Model</p>
                      <div style={styles.newBrandGrid}>
                        <div className="form-group">
                          <label className="form-label">Model Adı</label>
                          <input className="form-input" placeholder="örn: iPhone 15 Pro"
                            value={newModel.name} onChange={(e) => setNewModel((p) => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fiyat (₺)</label>
                          <input className="form-input" type="number" placeholder="0.00" min="0"
                            value={newModel.price} onChange={(e) => setNewModel((p) => ({ ...p, price: e.target.value }))} />
                        </div>
                      </div>
                      {/* Model özellikleri */}
                      <div style={{ marginTop: ".625rem" }}>
                        <label className="form-label" style={{ marginBottom: ".375rem", display: "block" }}>Teknik Özellikler</label>
                        <div style={{ display: "flex", flexDirection: "column", gap: ".375rem" }}>
                          {modelSpecRows.map((row, idx) => (
                            <div key={idx} style={{ display: "flex", gap: ".375rem", alignItems: "center" }}>
                              <input className="form-input" placeholder="Konu" value={row.key} style={{ flex: 1 }}
                                onChange={(e) => setModelSpecRows((prev) => prev.map((r, i) => i === idx ? { ...r, key: e.target.value } : r))} />
                              <span style={{ color: "#3EA882", fontWeight: 700 }}>→</span>
                              <input className="form-input" placeholder="Değer" value={row.value} style={{ flex: 2 }}
                                onChange={(e) => setModelSpecRows((prev) => prev.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))} />
                              <button type="button" style={styles.specRemoveBtn}
                                onClick={() => setModelSpecRows((p) => p.filter((_, i) => i !== idx))}>✕</button>
                            </div>
                          ))}
                          <button type="button" style={styles.specAddBtn}
                            onClick={() => setModelSpecRows((p) => [...p, { key: "", value: "" }])}>
                            <span>＋</span> Özellik Ekle
                          </button>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: ".625rem", marginTop: ".75rem" }}>
                        <button type="button" className="btn btn-primary btn-sm"
                          disabled={!newModel.name.trim()}
                          onClick={() => {
                            const specs = Object.fromEntries(modelSpecRows.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value]));
                            const saved = { name: newModel.name.trim(), price: newModel.price, specs };
                            setModels((p) => [...p, saved]);
                            const rows = Object.entries(specs).map(([key, value]) => ({ key, value }));
                            setSpecRows(rows);
                            setForm((f) => ({ ...f, model: saved.name, price: saved.price || f.price, specs }));
                            setNewModel(EMPTY_MODEL);
                            setModelSpecRows([]);
                            setShowNewModel(false);
                          }}>
                          Kaydet ve Seç
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm"
                          onClick={() => { setShowNewModel(false); setNewModel(EMPTY_MODEL); setModelSpecRows([]); }}>
                          İptal
                        </button>
                      </div>
                    </div>
                  )}
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
                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".3rem" }}>
                          <div style={{ ...styles.imgThumbWrap, ...(idx === activePreviewIdx ? styles.imgThumbActive : {}) }}
                            onClick={() => setActivePreviewIdx(idx)}>
                            <img src={p.url} alt={`görsel-${idx}`} style={styles.imgThumb} />
                            {idx === 0 && <span style={styles.imgMainBadge}>Ana</span>}
                            <button type="button" style={styles.imgRemoveBtn}
                              onClick={(e) => { e.stopPropagation(); removeImage(idx); }}>✕</button>
                          </div>
                          {/* Görselin renk noktaları */}
                          {p.colors?.length > 0 && (
                            <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center", maxWidth: "90px" }}>
                              {p.colors.slice(0, 5).map((hex) => {
                                const selected = form.colors.includes(hex);
                                return (
                                  <button key={hex} type="button" title={`${hex} ekle`}
                                    onClick={() => toggleDetectedColor(hex)}
                                    style={{ width: "14px", height: "14px", borderRadius: "50%", background: hex, border: selected ? "2px solid #2C7A5E" : "1.5px solid rgba(255,255,255,.5)", boxShadow: "0 1px 3px rgba(0,0,0,.25)", cursor: "pointer", padding: 0, transition: "transform .15s", transform: selected ? "scale(1.25)" : "scale(1)" }} />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                      {/* + ekle butonu */}
                      <label style={{ ...styles.imgAddBtn, alignSelf: "flex-start" }} htmlFor="productImageInput" title="Görsel ekle">
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

                {/* Renkler — sadece görselden otomatik tespit */}
                {/* Renkler — varyant bazlı */}
                {(() => {
                  const activeColors = getActiveColors();
                  const activeCV = productVariants.length > 0
                    ? (productVariants[activeVariantIdx]?.colorVariants || [])
                    : form.colorVariants;
                  const variantLabel = productVariants.length > 0
                    ? `— ${productVariants[activeVariantIdx]?.modelName || ""} modeli`
                    : "";
                  return (
                    <div className="form-group" style={{ gridColumn: "1/-1" }}>
                      <label className="form-label">
                        Renkler <span style={{ color: "#5E8A80", fontWeight: 400, fontSize: ".8rem" }}>{variantLabel}</span>
                        {activeColors.length > 0 && (
                          <span style={{ marginLeft: ".5rem", background: "#2C7A5E", color: "#fff", fontSize: ".65rem", fontWeight: 700, padding: "2px 7px", borderRadius: "9999px" }}>
                            {activeColors.length}
                          </span>
                        )}
                      </label>

                      {/* Otomatik tespit */}
                      {imagePreviews.length > 0 && imagePreviews[activePreviewIdx]?.colors?.length > 0 && (
                        <div style={{ ...styles.detectedBox, marginBottom: ".75rem" }}>
                          <p style={styles.detectedTitle}>🎨 Görsel {activePreviewIdx + 1} — tespit edilen renkler:</p>
                          <div style={{ display: "flex", gap: ".625rem", flexWrap: "wrap" }}>
                            {imagePreviews[activePreviewIdx].colors.map((hex) => {
                              const selected = activeColors.includes(hex);
                              return (
                                <button key={hex} type="button" title={hex}
                                  style={{ ...styles.detectedSwatch, background: hex, ...(selected ? styles.detectedSwatchSelected : {}) }}
                                  onClick={() => toggleDetectedColor(hex)}>
                                  {selected && <span style={styles.colorCheck}>✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Manuel renk ekle */}
                      <ManualColorPicker onAdd={(hex) => addColor(hex, activePreviewIdx)} />

                      {/* Stoktaki Renkler — görsel eşleştirme */}
                      {activeCV.length > 0 && (
                        <div style={styles.stockBox}>
                          <p style={styles.stockTitle}>🎨 Stoktaki Renkler — her renge görsel eşleştir</p>
                          {activeCV.map((variant, vi) => (
                            <div key={variant.color} className="spec-row-enter" style={styles.stockRow}>
                              <span style={{ ...styles.stockDot, background: variant.color }} />
                              <span style={styles.stockHex}>{variant.color}</span>
                              <div style={styles.stockImgList}>
                                {imagePreviews.map((img, imgIdx) => (
                                  <button key={imgIdx} type="button"
                                    style={{ ...styles.stockImgBtn, ...(variant.imageIdx === imgIdx ? styles.stockImgBtnActive : {}) }}
                                    onClick={() => {
                                      if (productVariants.length > 0) {
                                        setProductVariants((pvs) => pvs.map((pv, pi) => pi !== activeVariantIdx ? pv : {
                                          ...pv, colorVariants: pv.colorVariants.map((v, i) => i === vi ? { ...v, imageIdx: imgIdx } : v),
                                        }));
                                      } else {
                                        setForm((f) => ({ ...f, colorVariants: f.colorVariants.map((v, i) => i === vi ? { ...v, imageIdx: imgIdx } : v) }));
                                      }
                                    }}>
                                    <img src={img.url} alt="" style={{ width: "28px", height: "28px", objectFit: "contain", borderRadius: "4px", display: "block" }} />
                                  </button>
                                ))}
                              </div>
                              <button type="button" style={styles.specRemoveBtn} onClick={() => removeColor(variant.color)}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Teknik Özellikler */}
                <div className="form-group" style={{ gridColumn: "1/-1" }}>
                  <label className="form-label">
                    Teknik Özellikler
                    {specRows.length > 0 && (
                      <span style={{ marginLeft: ".5rem", background: "#2C7A5E", color: "#fff", fontSize: ".65rem", fontWeight: 700, padding: "2px 7px", borderRadius: "9999px" }}>
                        {specRows.length}
                      </span>
                    )}
                  </label>
                  <div style={styles.specsBox}>
                    {specRows.map((row, idx) => (
                      <div key={idx} className="spec-row-enter" style={styles.specRow}>
                        <span style={styles.specIdx}>{idx + 1}</span>
                        <input className="form-input" placeholder="Konu (örn: RAM)"
                          value={row.key} style={styles.specKeyInput}
                          onChange={(e) => updateSpecRow(idx, "key", e.target.value)} />
                        <span style={styles.specArrow}>→</span>
                        <input className="form-input" placeholder="Değer (örn: 16 GB)"
                          value={row.value} style={styles.specValInput}
                          onChange={(e) => updateSpecRow(idx, "value", e.target.value)} />
                        <button type="button" style={styles.specRemoveBtn}
                          onClick={() => setSpecRows((prev) => {
                            const updated = prev.filter((_, i) => i !== idx);
                            setForm((f) => ({ ...f, specs: Object.fromEntries(updated.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])) }));
                            return updated;
                          })}>✕</button>
                      </div>
                    ))}
                    <button type="button" style={styles.specAddBtn}
                      onClick={() => setSpecRows((prev) => [...prev, { key: "", value: "" }])}>
                      <span style={{ fontSize: "1rem", lineHeight: 1 }}>＋</span> Özellik Ekle
                    </button>
                  </div>
                </div>

                <div style={{ gridColumn: "1/-1", display: "flex", gap: ".75rem" }}>
                  <button className="btn btn-primary" type="submit">
                    {editingId ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}
                  </button>
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
                        <div style={{ display: "flex", gap: ".5rem" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(p)}>Düzenle</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Sil</button>
                        </div>
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

      {/* ── KULLANICILAR ── */}
      {tab === "Kullanıcılar" && (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Kullanıcı</th>
                <th style={styles.th}>E-posta</th>
                <th style={styles.th}>Son Görülme</th>
                <th style={styles.th}>Rol</th>
              </tr>
            </thead>
            <tbody>
              {userList.length === 0 ? (
                <tr><td colSpan={4} style={{ ...styles.td, textAlign: "center", color: "#8AADA4" }}>Henüz kullanıcı yok</td></tr>
              ) : userList.map((u, i) => (
                <tr key={u.uid} style={{ background: i % 2 === 0 ? "#F7F9F8" : "#fff" }}>
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".625rem" }}>
                      {u.photoURL
                        ? <img src={u.photoURL} alt={u.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#2C7A5E", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: ".875rem" }}>{(u.name?.[0] || "?").toUpperCase()}</div>}
                      <span style={{ fontWeight: 600, fontSize: ".875rem", color: "#111F1C" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={styles.td}><span style={{ fontSize: ".8rem", color: "#5E8A80" }}>{u.email}</span></td>
                  <td style={styles.td}><span style={{ fontSize: ".8rem", color: "#8AADA4" }}>{u.lastSeen ? new Date(u.lastSeen).toLocaleString("tr-TR") : "-"}</span></td>
                  <td style={styles.td}>
                    <select
                      className="form-input"
                      style={{ padding: ".3rem .5rem", fontSize: ".8rem", width: "110px", color: u.role === "admin" ? "#2C7A5E" : "#5E8A80", fontWeight: 600 }}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                    >
                      <option value="user">Kullanıcı</option>
                      <option value="admin">Admin</option>
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

  /* Yönetim sekmesi */
  mgmtTitle: { fontSize: "1rem", fontWeight: 700, color: "#111F1C", marginBottom: "1rem" },
  mgmtRow:   { display: "flex", alignItems: "center", gap: ".625rem", background: "#F7F9F8", border: "1.5px solid #D9E4E0", borderRadius: "8px", padding: ".5rem .75rem" },
  mgmtName:  { flex: 1, fontSize: ".875rem", fontWeight: 600, color: "#2C4F48" },
  mgmtDel:   { width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "#fde8e8", color: "#e05252", cursor: "pointer", fontWeight: 700, fontSize: ".7rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },

  /* Stoktaki renkler */
  stockBox:        { marginTop: ".75rem", display: "flex", flexDirection: "column", gap: ".5rem" },
  stockTitle:      { fontSize: ".8rem", fontWeight: 700, color: "#2C4F48", marginBottom: ".25rem" },
  stockRow:        { display: "flex", alignItems: "center", gap: ".625rem", background: "#F7F9F8", border: "1.5px solid #D9E4E0", borderRadius: "10px", padding: ".5rem .75rem" },
  stockDot:        { width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,.2)", border: "2px solid #fff" },
  stockHex:        { fontSize: ".75rem", fontFamily: "monospace", color: "#2C4F48", fontWeight: 600, minWidth: "65px" },
  stockImgList:    { display: "flex", gap: ".375rem", flexWrap: "wrap", flex: 1 },
  stockImgBtn:     { padding: "2px", border: "2px solid transparent", borderRadius: "6px", background: "#fff", cursor: "pointer", transition: "border-color .15s" },
  stockImgBtnActive: { borderColor: "#2C7A5E", boxShadow: "0 0 0 2px rgba(44,122,94,.2)" },

  /* Teknik özellikler */
  specsBox:      { display: "flex", flexDirection: "column", gap: ".5rem" },
  specRow: {
    display: "flex", alignItems: "center", gap: ".5rem",
    background: "#F7F9F8", border: "1.5px solid #D9E4E0",
    borderRadius: "10px", padding: ".5rem .75rem",
    transition: "box-shadow .2s, border-color .2s",
  },
  specIdx: {
    width: "22px", height: "22px", borderRadius: "50%",
    background: "#2C7A5E", color: "#fff", fontSize: ".7rem",
    fontWeight: 700, display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  specKeyInput:  { flex: "0 0 160px", border: "none", background: "transparent", fontWeight: 600, color: "#111F1C", padding: ".25rem .375rem", fontSize: ".875rem", outline: "none" },
  specArrow:     { color: "#3EA882", fontWeight: 700, fontSize: ".9rem", flexShrink: 0 },
  specValInput:  { flex: 1, border: "none", background: "transparent", color: "#3D6B62", padding: ".25rem .375rem", fontSize: ".875rem", outline: "none" },
  specRemoveBtn: {
    width: "26px", height: "26px", borderRadius: "50%", border: "none",
    background: "#fde8e8", color: "#e05252", cursor: "pointer",
    fontWeight: 700, fontSize: ".7rem", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background .15s, transform .15s",
  },
  specAddBtn: {
    alignSelf: "flex-start", marginTop: ".375rem",
    display: "flex", alignItems: "center", gap: ".375rem",
    padding: ".5rem 1.125rem", border: "2px dashed #3EA882",
    borderRadius: "10px", background: "transparent",
    color: "#2C7A5E", fontWeight: 700, fontSize: ".8rem",
    cursor: "pointer", transition: "background .2s, border-color .2s",
  },

  /* Tablo */
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#E8F5F0" },
  th:    { padding: ".875rem 1rem", textAlign: "left", fontSize: ".8rem", fontWeight: 700, color: "#5E8A80", textTransform: "uppercase", letterSpacing: ".04em" },
  td:    { padding: ".875rem 1rem", fontSize: ".875rem", verticalAlign: "middle" },
};
