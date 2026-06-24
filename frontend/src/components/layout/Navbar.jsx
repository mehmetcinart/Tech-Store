import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const CATEGORY_ICONS = {
  "Telefon":      "📱",
  "Laptop":       "💻",
  "Kulaklık":     "🎧",
  "Tablet":       "📟",
  "Televizyon":   "📺",
  "Oyun Konsolu": "🎮",
};
const DEFAULT_CATEGORIES = ["Telefon", "Laptop", "Kulaklık", "Tablet", "Televizyon", "Oyun Konsolu"];

function loadCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem("techstore_categories"));
    return Array.isArray(stored) && stored.length ? stored : DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
}

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState(loadCategories);

  useEffect(() => {
    const handler = () => setCategories(loadCategories());
    window.addEventListener("storage", handler);
    window.addEventListener("categories-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("categories-updated", handler);
    };
  }, []);
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const [search, setSearch]           = useState("");
  const [menuOpen, setMenuOpen]       = useState(false);
  const [hoveredCat, setHoveredCat]   = useState(null);
  const [showRename, setShowRename]   = useState(false);
  const [newName, setNewName]         = useState("");
  const [renameErr, setRenameErr]     = useState("");
  const [renameBusy, setRenameBusy]   = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setRenameBusy(true); setRenameErr("");
    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      setShowRename(false); setNewName("");
      window.location.reload();
    } catch {
      setRenameErr("İsim güncellenemedi, tekrar dene.");
    } finally { setRenameBusy(false); }
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
              <button style={styles.userBtn} onClick={() => { setMenuOpen(!menuOpen); setShowRename(false); }}>
                {user.avatar
                  ? <img src={user.avatar} alt={user.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid #A8DCC6" }} />
                  : <span style={styles.userAvatarPlaceholder}>{(user.name[0] || "?").toUpperCase()}</span>}
                <span style={styles.userName}>{user.name.split(" ")[0]}</span>
                <span style={{ fontSize: ".65rem", color: "#8AADA4", marginLeft: "2px" }}>▾</span>
              </button>
              {menuOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                      : <span style={{ ...styles.userAvatarPlaceholder, width: "40px", height: "40px", fontSize: "1.1rem" }}>{(user.name[0] || "?").toUpperCase()}</span>}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: ".875rem", color: "#111F1C" }}>{user.name}</div>
                      <div style={{ fontSize: ".75rem", color: "#8AADA4" }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={styles.dropdownDivider} />

                  {/* İsim değiştir */}
                  {showRename ? (
                    <form onSubmit={handleRename} style={{ padding: ".75rem 1rem" }}>
                      <input
                        autoFocus
                        className="form-input"
                        style={{ fontSize: ".8rem", padding: ".4rem .6rem", marginBottom: ".5rem" }}
                        placeholder="Yeni isminiz"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      {renameErr && <div style={{ fontSize: ".75rem", color: "#e05252", marginBottom: ".4rem" }}>{renameErr}</div>}
                      <div style={{ display: "flex", gap: ".4rem" }}>
                        <button className="btn btn-primary btn-sm" type="submit" disabled={renameBusy} style={{ flex: 1, fontSize: ".78rem", padding: ".35rem .5rem" }}>
                          {renameBusy ? "..." : "Kaydet"}
                        </button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setShowRename(false); setRenameErr(""); setNewName(""); }} style={{ fontSize: ".78rem", padding: ".35rem .5rem" }}>
                          İptal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button style={styles.dropdownItem} onClick={() => setShowRename(true)}>
                      ✏️ İsmi Değiştir
                    </button>
                  )}

                  {isAdmin && (
                    <Link to="/admin" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      ⚙️ Admin Panel
                    </Link>
                  )}
                  <Link to="/orders" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    📦 Siparişlerim
                  </Link>
                  <div style={styles.dropdownDivider} />
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
          {categories.map((catName) => {
            const isActive  = activeCategory === catName;
            const isHovered = hoveredCat === catName;
            const icon = CATEGORY_ICONS[catName] || "🛍️";
            return (
              <Link
                key={catName}
                to={`/products?category=${catName}`}
                style={{
                  ...styles.catLink,
                  color: isActive ? "#2C7A5E" : isHovered ? "#3EA882" : "#5E8A80",
                  fontWeight: isActive ? 700 : 500,
                }}
                onMouseEnter={() => setHoveredCat(catName)}
                onMouseLeave={() => setHoveredCat(null)}
              >
                <span style={{
                  ...styles.catIcon,
                  transform: isHovered ? "scale(1.3) translateY(-2px)" : "scale(1)",
                  opacity: isHovered || isActive ? 1 : 0.6,
                }}>
                  {icon}
                </span>
                <span>{catName}</span>
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
    display: "flex", alignItems: "center", gap: ".5rem",
    background: "#E8F5F0", border: "none", borderRadius: "50px",
    padding: ".35rem .75rem .35rem .35rem",
    fontWeight: 600, fontSize: ".875rem", color: "#2C7A5E", cursor: "pointer",
    transition: "background .15s",
  },
  userAvatarPlaceholder: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: "#2C7A5E", color: "#fff", fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: ".875rem", flexShrink: 0,
  },
  userName: { maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dropdown: {
    position: "absolute", right: 0, top: "calc(100% + .5rem)",
    background: "#fff", borderRadius: "14px",
    boxShadow: "0 8px 32px rgba(44,122,94,.18)",
    minWidth: "220px", overflow: "hidden", zIndex: 200,
  },
  dropdownHeader: {
    display: "flex", alignItems: "center", gap: ".75rem",
    padding: "1rem",
  },
  dropdownDivider: { height: "1px", background: "#E8F5F0", margin: "0" },
  dropdownItem: {
    display: "block", padding: ".75rem 1rem",
    fontSize: ".875rem", fontWeight: 500, color: "#2C4F48",
    transition: "background .1s", cursor: "pointer", border: "none", background: "none", width: "100%", textAlign: "left",
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
