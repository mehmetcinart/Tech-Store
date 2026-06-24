import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const CATEGORIES = [
  { name: "Telefon",      icon: "📱" },
  { name: "Laptop",       icon: "💻" },
  { name: "Kulaklık",     icon: "🎧" },
  { name: "Tablet",       icon: "📟" },
  { name: "Televizyon",   icon: "📺" },
  { name: "Oyun Konsolu", icon: "🎮" },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState(null);

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
                  {isAdmin && (
                    <Link to="/admin" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      ⚙️ Admin Panel
                    </Link>
                  )}
                  <Link to="/orders" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    📦 Siparişlerim
                  </Link>
                  <button
                    style={{ ...styles.dropdownItem, color: "#e05252", border: "none", background: "none", width: "100%", textAlign: "left" }}
                    onClick={handleLogout}
                  >
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
          {CATEGORIES.map((cat) => {
            const isActive  = activeCategory === cat.name;
            const isHovered = hoveredCat === cat.name;
            return (
              <Link
                key={cat.name}
                to={`/products?category=${cat.name}`}
                style={{
                  ...styles.catLink,
                  color: isActive ? "#2C7A5E" : isHovered ? "#3EA882" : "#5E8A80",
                  fontWeight: isActive ? 700 : 500,
                }}
                onMouseEnter={() => setHoveredCat(cat.name)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <span style={{
                  ...styles.catIcon,
                  transform: isHovered ? "scale(1.3) translateY(-2px)" : "scale(1)",
                  opacity: isHovered || isActive ? 1 : 0.6,
                }}>
                  {cat.icon}
                </span>
                <span>{cat.name}</span>
                <span style={{
                  ...styles.catUnderline,
                  width: isActive || isHovered ? "100%" : "0%",
                  background: isActive ? "#2C7A5E" : "#6BC9A2",
                }} />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: "#fff",
    boxShadow: "0 2px 8px rgba(44,122,94,.10)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  inner: { display: "flex", alignItems: "center", gap: "1rem", padding: ".875rem 1rem" },
  logo: {
    display: "flex", alignItems: "center", gap: ".5rem",
    fontSize: "1.375rem", color: "#2C7A5E", whiteSpace: "nowrap",
  },
  logoIcon: { fontSize: "1.5rem" },
  searchForm: { display: "flex", flex: 1, maxWidth: "540px" },
  searchInput: { flex: 1, borderRadius: "8px 0 0 8px", borderRight: "none" },
  actions: { display: "flex", alignItems: "center", gap: ".75rem", marginLeft: "auto" },
  cartBtn: { position: "relative", fontSize: "1.5rem", padding: ".25rem" },
  cartBadge: {
    position: "absolute", top: "-6px", right: "-6px",
    background: "#e05252", color: "#fff",
    fontSize: ".65rem", fontWeight: 700,
    width: "18px", height: "18px",
    borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
  },
  userMenu: { position: "relative" },
  userBtn: {
    background: "#E8F5F0", border: "none", borderRadius: "8px",
    padding: ".5rem .875rem", fontWeight: 600, fontSize: ".875rem", color: "#2C7A5E",
  },
  dropdown: {
    position: "absolute", right: 0, top: "calc(100% + .5rem)",
    background: "#fff", borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(44,122,94,.15)",
    minWidth: "180px", overflow: "hidden", zIndex: 200,
  },
  dropdownItem: {
    display: "block", padding: ".75rem 1rem",
    fontSize: ".875rem", fontWeight: 500, color: "#2C4F48",
    transition: "background .1s",
  },
  categories: { borderTop: "1px solid #E8F5F0", background: "#fff" },
  categoriesInner: { display: "flex", overflowX: "auto" },
  catLink: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: ".35rem",
    padding: ".625rem 1rem",
    fontSize: ".825rem",
    whiteSpace: "nowrap",
    transition: "color .2s",
    overflow: "hidden",
  },
  catIcon: {
    fontSize: ".9rem",
    display: "inline-block",
    transition: "transform .25s cubic-bezier(.34,1.56,.64,1), opacity .2s",
  },
  catUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "2.5px",
    borderRadius: "2px 2px 0 0",
    transition: "width .25s cubic-bezier(.4,0,.2,1)",
  },
};
