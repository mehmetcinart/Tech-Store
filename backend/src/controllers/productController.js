import { v4 as uuidv4 } from "uuid";
import { products } from "../data/products.js";
import { broadcast } from "../sse.js";

export const getProducts = (req, res) => {
  const { search, category, brand, minPrice, maxPrice, sort } = req.query;
  let result = [...products];

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }
  if (category) result = result.filter((p) => p.category === category);
  if (brand) result = result.filter((p) => p.brand === brand);
  if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));

  if (sort === "price_asc") result.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") result.sort((a, b) => b.price - a.price);
  else if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
  else if (sort === "newest") result.sort((a, b) => b.id.localeCompare(a.id));

  res.json({ products: result, total: result.length });
};

export const getFeaturedProducts = (req, res) => {
  res.json(products.filter((p) => p.featured));
};

export const getProductById = (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });
  res.json(product);
};

export const createProduct = (req, res) => {
  const { name, category, brand, model, price, originalPrice, stock, description, specs, image, imageData, colors, colorVariants, productVariants, brandLogo } = req.body;
  if (!name || !stock) {
    return res.status(400).json({ message: "İsim ve stok zorunludur" });
  }
  const parsedImageData = Array.isArray(imageData) ? imageData : [];
  const mainImage = image || parsedImageData[0]?.url || "https://via.placeholder.com/400x400?text=No+Image";

  const newProduct = {
    id: uuidv4(),
    name,
    category: category || "Diğer",
    brand: brand || "",
    model: model || "",
    brandLogo: brandLogo || "",
    price: Number(price) || 0,
    originalPrice: Number(originalPrice) || Number(price) || 0,
    discount: 0,
    stock: Number(stock),
    rating: 0,
    reviewCount: 0,
    image: mainImage,
    imageData: parsedImageData,
    colors: Array.isArray(colors) ? colors : [],
    colorVariants: Array.isArray(colorVariants) ? colorVariants : [],
    productVariants: Array.isArray(productVariants) ? productVariants : [],
    description: description || "",
    specs: specs || {},
    featured: false,
  };
  products.push(newProduct);
  broadcast("product-update", { action: "create", id: newProduct.id });
  res.status(201).json(newProduct);
};

export const updateProduct = (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Ürün bulunamadı" });
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  broadcast("product-update", { action: "update", id: req.params.id });
  res.json(products[idx]);
};

export const deleteProduct = (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Ürün bulunamadı" });
  products.splice(idx, 1);
  broadcast("product-update", { action: "delete", id: req.params.id });
  res.json({ message: "Ürün silindi" });
};
