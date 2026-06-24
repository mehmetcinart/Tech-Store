import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OrdersPage from "./pages/OrdersPage";
import AdminPage from "./pages/admin/AdminPage";

function SseListener() {
  useEffect(() => {
    const es = new EventSource("/api/events");
    es.addEventListener("product-update", () => {
      window.dispatchEvent(new CustomEvent("product-sync"));
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SseListener />
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
