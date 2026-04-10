const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔑 CONFIGURA
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// 📩 Telegram
async function sendTelegram(text) {
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text
    });
  } catch (err) {
    console.error("Error Telegram:", err.message);
  }
}

// 🎯 Webhook
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 Evento recibido:");
    console.log(JSON.stringify(req.body, null, 2));

    const data = req.body;

    // 👇 IMPORTANTE: asegurar que es array
    const transactions = Array.isArray(data) ? data : [data];

    for (const tx of transactions) {
      const signature = tx.signature || "sin signature";
      const type = tx.type || "unknown";
      const description = tx.description || "sin descripción";

      await sendTelegram(
        `🚨 Nueva transacción\n\nTipo: ${type}\n\n${description}\n\nhttps://solscan.io/tx/${signature}`
      );
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("❌ ERROR WEBHOOK:", error);
    res.sendStatus(500);
  }
});

// 🚀 Servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => { {
  console.log("Servidor corriendo en puerto 3000");
});