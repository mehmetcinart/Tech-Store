import { v4 as uuidv4 } from "uuid";

const orders = [];

export const createOrder = (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Sipariş ürünleri boş olamaz" });
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const newOrder = {
    id: uuidv4(),
    userId: req.user.id,
    items,
    shippingAddress,
    paymentMethod: paymentMethod || "Kredi Kartı",
    total,
    status: "Hazırlanıyor",
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
};

export const getMyOrders = (req, res) => {
  const myOrders = orders.filter((o) => o.userId === req.user.id);
  res.json(myOrders);
};

export const getAllOrders = (req, res) => {
  res.json(orders);
};

export const updateOrderStatus = (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });
  order.status = req.body.status;
  res.json(order);
};
