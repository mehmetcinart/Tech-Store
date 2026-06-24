const clients = new Set();

export function addClient(res) {
  clients.add(res);
}

export function removeClient(res) {
  clients.delete(res);
}

export function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((c) => {
    try { c.write(msg); } catch { clients.delete(c); }
  });
}
