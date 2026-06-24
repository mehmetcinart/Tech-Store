import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>⚡</span>
          <span>Tech<strong>Store</strong></span>
        </Link>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            className="form-input"
            style={styles.searchInput}
            type="text"
            placeholder="Ürün, marka veya kategori ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" type="submit" style={{ borderRadius: "0 8px 8px 0" }}>
            🔍
          </button>
        </form>

        <div style={styles.actions}>
          <Link to="/cart" style={styles.cartBtn}>
            🛒
            {totalItems > 0 && <span style={styles.cartBadge}>{totalItems}</span>}
          </Link>

          {user ? (
            <div style={styles.userMenu}>
              <button style={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                👤 {user.name.split(" ")[0]}
              </button>
              {menuOpen && (
                <div style={styles.dropdown}>
                  {isAdmin && <Link to="/admin" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>⚙️ Admin Panel</Link>}
                  <Link to="/orders" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>📦 Siparişlerim</Link>
                  <button style={{ ...styles.dropdownItem, color: "#ef4444", border: "none", background: "none", width: "100%", textAlign: "left" }} onClick={handleLogout}>
                    🚪 Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", gap: ".5rem" }}>
              <Link to="/login" className="btn btn-outline btn-sm">Giriş</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Kayıt</Link>
            </div>
          )}
        </div>
      </div>

      <div style={styles.categories}>
        <div className="container" style={styles.categoriesInner}>
          {["Telefon", "Laptop", "Kulaklık", "Tablet", "Televizyon", "Oyun Konsolu"].map((cat) => (
            <Link key={cat} to={`/products?category=${cat}`} style={styles.catLink}>{cat}</Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,.08)", position: "sticky", top: 0, zIndex: 100 },
  inner: { display: "flex", alignItems: "center", gap: "1rem", padding: ".875rem 1rem" },
  logo: { display: "flex", alignItems: "center", gap: ".5rem", fontSize: "1.375rem", color: "#2563eb", whiteSpace: "nowrap" },
  logoIcon: { fontSize: "1.5rem" },
  searchForm: { display: "flex", flex: 1, maxWidth: "540px" },
  searchInput: { flex: 1, borderRadius: "8px 0 0 8px", borderRight: "none" },
  actions: { display: "flex", alignItems: "center", gap: ".75rem", marginLeft: "auto" },
  cartBtn: { position: "relative", fontSize: "1.5rem", padding: ".25rem" },
  cartBadge: {
    position: "absolute", top: "-6px", right: "-6px",
    background: "#ef4444", color: "#fff",
    fontSize: ".65rem", fontWeight: 700,
    width: "18px", height: "18px",
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
  },
  userMenu: { position: "relative" },
  userBtn: { background: "#eff6ff", border: "none", borderRadius: "8px", padding: ".5rem .875rem", fontWeight: 600, fontSize: ".875rem", color: "#2563eb" },
  dropdown: {
    position: "absolute", right: 0, top: "calc(100% + .5rem)",
    background: "#fff", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,.12)",
    minWidth: "180px", overflow: "hidden", zIndex: 200,
  },
  dropdownItem: { display: "block", padding: ".75rem 1rem", fontSize: ".875rem", fontWeight: 500, color: "#374151", transition: "background .1s" },
  categories: { borderTop: "1px solid #f3f4f6", background: "#fff" },
  categoriesInner: { display: "flex", gap: "0", overflowX: "auto" },
  catLink: { padding: ".5rem 1rem", fontSize: ".8rem", fontWeight: 500, color: "#6b7280", whiteSpace: "nowrap", transition: "color .15s" },
};
