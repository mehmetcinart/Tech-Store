import bcrypt from "bcryptjs";

export const users = [
  {
    id: "1",
    name: "Admin Kullanıcı",
    email: "admin@techstore.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Test Kullanıcı",
    email: "test@techstore.com",
    password: bcrypt.hashSync("test123", 10),
    role: "user",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
];
