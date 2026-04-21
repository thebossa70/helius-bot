const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("BOT ACTIVO");

// 🔴 CONFIG
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHOTJ-mevcRenIzt6sBlapaPLLpwSwMlS4";
const CHAT_ID = process.env.CHAT_ID || "1998268076";

// 🎯 WALLETS (IMPORTANTE: EXACTAS, SIN MINÚSCULAS)
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

app.post("/webhook", async (req, res) => {
  console.log("EVENTO RECIBIDO");

  const txs = req.body;

  try {
    for (const tx of txs) {

      // 🔥 1. Intentar nativeTransfers
      let transfers = tx.nativeTransfers || [];

      // 🔥 2. fallback si no hay nativeTransfers
      if (!transfers.length && tx.tokenTransfers) {
        transfers = tx.tokenTransfers;
      }

      // 🔥 3. si tampoco hay, usar accountData (modo extremo)
      if (!transfers.length && tx.accountData) {

        const accounts = tx.accountData.map(a => a.account);

        const from = WATCH_WALLETS.find(w => accounts.includes(w));
        const to = TARGET_WALLETS.find(w => accounts.includes(w));

        if (from && to) {
          console.log("MATCH (accountData):", from, "→", to);

          const msg = `🚨 TRANSFERENCIA DETECTADA

De: ${from}
Para: ${to}

https://solscan.io/tx/${tx.signature}`;

          await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: msg
          });
        }

        continue;
      }

      // 🔥 4. procesamiento normal
      for (const t of transfers) {

        const from = t.fromUserAccount || t.from;
        const to = t.toUserAccount || t.to;
        const amount = t.amount || 0;

        console.log("FROM:", from);
        console.log("TO:", to);

        if (
          WATCH_WALLETS.includes(from) &&
          TARGET_WALLETS.includes(to)
        ) {

          console.log("MATCH REAL:", from, "→", to);

          const sol = amount / 1e9;

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

// 🔥 health check (MUY IMPORTANTE para Railway)
app.get("/", (req, res) => {
  res.send("alive");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor activo"));