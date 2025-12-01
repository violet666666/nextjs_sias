require('dotenv').config();

// WARNING: Jangan jalankan file ini langsung dengan 'node server.js' kecuali Anda sudah mengkonversi semua file ke ESM dan set 'type: "module"' di package.json.
// Untuk development, gunakan 'npm run dev' atau 'next dev'.
const { createServer } = require('http');
const next = require('next');
const { initSocket } = require('./src/lib/config/socketServer.cjs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Inisialisasi socket.io dan integrasi dengan server HTTP
  initSocket(server);

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 