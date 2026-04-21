const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("BOT VERSION FINAL");

// 🔐 CONFIG
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHOTJ-mevcRenIzt6sBlapaPLLpwSwMlS4";
const CHAT_ID = process.env.CHAT_ID || "1998268076";

// 🎯 WALLETS
const WATCH_WALLETS = [
  "bigrqyqqumrdxsenjwqwaar86zeevjkpvuxmaeucqqtu"
];

const TARGET_WALLETS = [
  "bigrt9danxnzvnfqpg3vf4wvygyifftfmvalpvslnvtu"
];

// normalizar
const normalize = (addr) => (addr || "").toLowerCase();

// 🚀 WEBHOOK
app.post("/webhook", async (req, res) => {
  // 🔥 RESPONDER INMEDIATO (CLAVE PARA HELIUS)
  res.send("ok");

  try {
    const txs = req.body;

    console.log("EVENTOS:", txs.length);

    for (const tx of txs) {

      // 🧠 CASO 1: nativeTransfers
      const nativeTransfers = tx.nativeTransfers || [];

      for (const t of nativeTransfers) {
        const from = normalize(t.fromUserAccount);
        const to = normalize(t.toUserAccount);

        if (
          WATCH_WALLETS.includes(from) &&
          TARGET_WALLETS.includes(to)
        ) {
          await sendAlert(tx, from, to, t.amount / 1e9);
        }
      }

      // 🧠 CASO 2: instrucciones (cuando NO hay nativeTransfers)
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
            await sendAlert(tx, from, to, "UNKNOWN");
          }
        }
      }
    }

  } catch (err) {
    console.log("ERROR:", err.message);
  }
});

// 📩 TELEGRAM
async function sendAlert(tx, from, to, amount) {
  console.log("MATCH:", from, "→", to);

  const msg = `🚨 TRANSFERENCIA DETECTADA

De: ${from}
Para: ${to}
Monto: ${amount} SOL

https://solscan.io/tx/${tx.signature}`;

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