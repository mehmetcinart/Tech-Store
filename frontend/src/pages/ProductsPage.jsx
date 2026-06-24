import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import ProductCard from "../components/ui/ProductCard";

const CATEGORIES = ["Telefon", "Laptop", "Kulaklık", "Tablet", "Televizyon", "Oyun Konsolu"];
const BRANDS = ["Apple", "Samsung", "Sony", "ASUS"];
const SORT_OPTIONS = [
  { value: "", label: "Varsayılan" },
  { value: "price_asc", label: "Fiyat: Düşükten Yükseğe" },
  { value: "price_desc", label: "Fiyat: Yüksekten Düşüğe" },
  { value: "rating", label: "En Yüksek Puan" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const sort = searchParams.get("sort") || "";

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (sort) params.set("sort", sort);

    api.get(`/products?${params}`)
      .then(({ data }) => { setProducts(data.products); setTotal(data.total); })
      .finally(() => setLoading(false));
  }, [search, category, brand, sort]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="container" style={{ padding: "1.5rem 1rem", display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
      {/* Filtreler */}
      <aside style={styles.sidebar}>
        <div style={styles.filterBox}>
          <h3 style={styles.filterTitle}>Kategoriler</h3>
          <button style={{ ...styles.filterItem, fontWeight: !category ? 700 : 400, color: !category ? "#2563eb" : "#374151" }} onClick={() => setFilter("category", "")}>Tümü</button>
          {CATEGORIES.map((c) => (
            <button key={c} style={{ ...styles.filterItem, fontWeight: category === c ? 700 : 400, color: category === c ? "#2563eb" : "#374151" }} onClick={() => setFilter("category", c)}>{c}</button>
          ))}
        </div>
        <div style={styles.filterBox}>
          <h3 style={styles.filterTitle}>Markalar</h3>
          <button style={{ ...styles.filterItem, fontWeight: !brand ? 700 : 400, color: !brand ? "#2563eb" : "#374151" }} onClick={() => setFilter("brand", "")}>Tümü</button>
          {BRANDS.map((b) => (
            <button key={b} style={{ ...styles.filterItem, fontWeight: brand === b ? 700 : 400, color: brand === b ? "#2563eb" : "#374151" }} onClick={() => setFilter("brand", b)}>{b}</button>
          ))}
        </div>
      </aside>

      {/* Ürünler */}
      <main style={{ flex: 1 }}>
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.pageTitle}>{category || (search ? `"${search}" sonuçları` : "Tüm Ürünler")}</h1>
            <p style={styles.count}>{total} ürün bulundu</p>
          </div>
          <select
            className="form-input"
            style={{ width: "220px" }}
            value={sort}
            onChange={(e) => setFilter("sort", e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: "3rem" }}>🔍</span>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1rem" }}>Ürün bulunamadı</p>
            <p style={{ color: "#6b7280" }}>Farklı filtreler veya arama terimi deneyin</p>
          </div>
        ) : (
          <div className="grid-products">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  sidebar: { width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "1rem" },
  filterBox: { background: "#fff", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,.08)" },
  filterTitle: { fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "#6b7280", marginBottom: ".875rem" },
  filterItem: { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: ".375rem 0", fontSize: ".875rem", cursor: "pointer" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.25rem", flexWrap: "wrap", gap: ".75rem" },
  pageTitle: { fontSize: "1.25rem", fontWeight: 700 },
  count: { fontSize: ".875rem", color: "#6b7280", marginTop: ".25rem" },
  empty: { textAlign: "center", padding: "4rem 0", color: "#374151" },
};
