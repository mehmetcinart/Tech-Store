import "dotenv/config";
import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { addClient, removeClient } from "./sse.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// SSE: real-time product updates
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write("event: connected\ndata: {}\n\n");
  addClient(res);
  req.on("close", () => removeClient(res));
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);

app.get("/api/health", (_, res) => res.json({ status: "ok", message: "TechStore API çalışıyor" }));

app.use((req, res) => res.status(404).json({ message: "Endpoint bulunamadı" }));

app.listen(PORT, () => console.log(`TechStore API http://localhost:${PORT} adresinde çalışıyor`));
