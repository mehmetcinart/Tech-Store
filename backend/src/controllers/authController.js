import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { users } from "../data/users.js";
import { generateToken } from "../middleware/auth.js";

export const login = (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Email veya şifre hatalı" });
  }

  res.json({
    token: generateToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

export const register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Tüm alanları doldurun" });
  }

  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ message: "Bu email zaten kayıtlı" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  res.status(201).json({
    token: generateToken(newUser),
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
  });
};

export const getMe = (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
};
