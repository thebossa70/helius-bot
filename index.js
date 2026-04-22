const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("BOT VERSION FINAL ANTI-DUPLICADOS");

// 🔐 CONFIG
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHOTJ-mevcRenIzt6sBlapaPLLpwSwMlS4";
const CHAT_ID = process.env.CHAT_ID || "1998268076";

// 🎯 WALLETS
const WATCH_WALLETS = [
  "bwamjzztzsepfktewrchggmxiicqvplqpietdnfsxa",
  "9cddj5g2wpqvzuzwpuwqzxn7ouvc6qfaufwrx2tttax",
  "abzjvilf5epj7m9ae6nrlrzwbdstt8pa5254tptgggfk",
  "4dttpro9btatsvgxtiltnfrlxiyghctuxrj2njs2tgjc",
  "amvguz1uxgpii98erswqgqqutytnrw4jp8phgj3tj7rr",
  "eugrgd6gjztyqppfnmzmmvnfpn4gwqrmaie4a3cw2fbk",
  "bigrqyqqumrdxsenjwqwaar86zeevjkpvuxmaeucqqtu"
];

const TARGET_WALLETS = [
  "bigrt9danxnzvnfqpg3vf4wvygyifftfmvalpvslnvtu",
  "6bazgnmbn7wppyvyx9ce1yedkoxkft3uyimq1ja3at4n",
  "fheprhhthpes6xvcmw7ebrbzavasqrjcveb7dfiuw7co",
  "3bwcjrxv4laskv7dblrji7fdxgrrfezhestdvozsjehr"
];

// 🔧 normalizar
const normalize = (addr) => (addr || "").toLowerCase();

// 🧠 anti-duplicados
const processedTxs = new Set();

function markTx(signature) {
  processedTxs.add(signature);

  // limpiar en 5 minutos
  setTimeout(() => {
    processedTxs.delete(signature);
  }, 5 * 60 * 1000);
}

// 🚀 WEBHOOK
app.post("/webhook", async (req, res) => {
  // 🔥 responder rápido (evita error 502 en Helius)
  res.send("ok");

  try {
    const txs = req.body;

    console.log("EVENTOS RECIBIDOS:", txs.length);

    for (const tx of txs) {

      // 🚫 evitar duplicados
      if (processedTxs.has(tx.signature)) continue;
      markTx(tx.signature);

      // =========================
      // 🟢 CASO 1: nativeTransfers
      // =========================
      const nativeTransfers = tx.nativeTransfers || [];

      for (const t of nativeTransfers) {
        const from = normalize(t.fromUserAccount);
        const to = normalize(t.toUserAccount);
        const sol = t.amount / 1e9;

        if (
          WATCH_WALLETS.includes(from) &&
          TARGET_WALLETS.includes(to)
        ) {
          await sendAlert(tx.signature, from, to, sol);
        }
      }

      // =========================
      // 🟡 CASO 2: instructions (fallback)
      // =========================
      const instructions = tx.instructions || [];

      for (const ins of instructions) {
        const accounts = ins.accounts || [];

        if (accounts.length >= 2) {
          const from = normalize(accounts[0]);
          const to = normalize(accounts[1]);

          if (
            WATCH_WALLETS.includes(from) &&
            TARGET_WALLETS.includes(to)
          ) {
            await sendAlert(tx.signature, from, to, "UNKNOWN");
          }
        }
      }
    }

  } catch (err) {
    console.log("ERROR:", err.message);
  }
});

// 📩 TELEGRAM
async function sendAlert(signature, from, to, amount) {
  console.log("MATCH:", from, "→", to);

  const msg = `🚨 TRANSFERENCIA DETECTADA

De: ${from}
Para: ${to}
Monto: ${amount} SOL

https://solscan.io/tx/${signature}`;

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: msg
    });
  } catch (e) {
    console.log("TELEGRAM ERROR:", e.response?.data || e.message);
  }
}

// 🚀 SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor activo en puerto", PORT));