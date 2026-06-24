import { useState, useEffect } from "react";

export function useProductSync() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("product-sync", handler);
    return () => window.removeEventListener("product-sync", handler);
  }, []);
  return version;
}
