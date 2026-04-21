const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔴 CONFIGURA ESTO (MEJOR USAR VARIABLES DE ENTORNO EN RAILWAY)
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHOTJ-mevcRenIzt6sBlapaPLLpwSwMlS4";
const CHAT_ID = process.env.CHAT_ID || "1998268076";

// 🎯 WALLETS (en minúsculas para evitar fallos)
const WATCH_WALLETS = [
  "bwamJzztZsepfkteWRChggmXuiiCQvpLqPietdNfSXa",
  "9cDDJ5g2wPqVZUZwpPuwqzxN7ouvc6QFauFwrX2TTTAX",
  "ABZJViLf5ePJ7m9AE6nrLrZwBDStT8pa5254TpTgGGfk",
  "4DTTpRo9BtATsVgxtiLtnFRLxiYGhCtuXrJ2njs2tgJC",
  "AmvgUZ1uXgPii98ErSWQGqQUTYtnRw4jp8phGJ3tJ7RR",
  "EUgrgd6gjZtyqpPfnMZMVnFfpN4GWqRMaie4a3cW2fbK",
  "BigrQYqqumRdxseNJwqwaAR86zeEVjKpVuXMaEucqqTu"
];

const TARGET_WALLETS = [
  "BigrT9DAnXnzVNFQPg3VF4WvyGyifFtFMVALPVsLnvTu",
  "6baZgNmBn7WpPYvYX9Ce1yeDKoXKFT3uyiMq1JA3aT4N",
  "FHEprhHtHPES6XVcmW7eBRbZAvASQRJcvEB7DFiuW7co",
  "3bwCjRXv4LASkv7DbLRJi7fDXgRRfEZhEstDVoZsjEHR"
];

// 🔧 normalizar (evita errores por mayúsculas)
const normalize = (addr) => (addr || "").toLowerCase();

app.post("/webhook", async (req, res) => {
  const txs = req.body;

  try {
    for (const tx of txs) {

      const transfers = tx.nativeTransfers || [];

      for (const t of transfers) {

        const from = normalize(t.fromUserAccount);
        const to = normalize(t.toUserAccount);
        const amount = t.amount;

        const sol = amount / 1e9;

        if (
          WATCH_WALLETS.includes(from) &&
          TARGET_WALLETS.includes(to)
        ) {

          console.log("MATCH:", from, "→", to);

          const msg = `🚨 TRANSFERENCIA DETECTADA

De: ${from}
Para: ${to}
Monto: ${sol} SOL

https://solscan.io/tx/${tx.signature}`;

          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg
          });
        }
      }
    }

    res.send("ok");

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.send("error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor activo"));