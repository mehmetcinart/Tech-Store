import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", message: "TechStore API çalışıyor" }));

app.use((req, res) => res.status(404).json({ message: "Endpoint bulunamadı" }));

app.listen(PORT, () => console.log(`TechStore API http://localhost:${PORT} adresinde çalışıyor`));
