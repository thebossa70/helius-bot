const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔴 CONFIGURA ESTO (MEJOR USAR VARIABLES DE ENTORNO EN RAILWAY)
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHOTJ-mevcRenIzt6sBlapaPLLpwSwMlS4";
const CHAT_ID = process.env.CHAT_ID || "1998268076";

// 🎯 WALLETS (en minúsculas para evitar fallos)
const WATCH_WALLETS = [
  "bwamjzztzsepfktewrchggmxuiicqvplqpietdnfsxa",
  "9cddj5g2wpqvzuzwppuwqzxn7ouvc6qfaufwrx2tttax",
  "abzjvilf5epj7m9ae6nrlrzwbdstt8pa5254tptgggfk",
  "4dttpro9btatsvgxtiltnfrlxiyghctuxrj2njs2tgjc",
  "amvguz1uxgpii98erswqgqqutyt nrw4jp8phgj3tj7rr",
  "eugrgd6gjztyqppfnmzmvnffpn4gwqrmaie4a3cw2fbk"
];

const TARGET_WALLETS = [
  "bigrt9danxnzvnfqpg3vf4wvyg yifftfmvalpvsl nvtu",
  "6bazgnmbn7wppyvyx9ce1yedkoxkft3uyimq1ja3at4n",
  "fheprhthtpes6xvcmw7ebr bzavasqrjcveb7dfiuw7co",
  "3bwcjrxv4laskv7dbl rji7fdxgrrfezhestdvoszjehr"
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