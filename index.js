const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("BOT VERSION SIN DUPLICADOS");

// CONFIG
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHXSo9PBZ_i0TgioRgwh-EfgiennxNmZG8";
const CHAT_ID = process.env.CHAT_ID || "1998268076";

// WATCH
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

const normalize = a => (a || "").toLowerCase();

// anti duplicados por firma
const seen = new Set();

function remember(sig){
   seen.add(sig);

   // limpia en 5 min
   setTimeout(()=>{
      seen.delete(sig);
   },300000);
}

app.post("/webhook", async (req,res)=>{
   res.send("ok"); // responder rápido a Helius

   try{

      const txs = req.body || [];

      for(const tx of txs){

         if(!tx.signature) continue;

         // si ya la procesé, ignorar
         if(seen.has(tx.signature)){
            console.log("DUPLICADO IGNORADO:", tx.signature);
            continue;
         }

         remember(tx.signature);

         const transfers = tx.nativeTransfers || [];

         for(const t of transfers){

            const from = normalize(t.fromUserAccount);
            const to = normalize(t.toUserAccount);

            if(
               WATCH_WALLETS.includes(from) &&
               TARGET_WALLETS.includes(to)
            ){

               const sol = t.amount / 1e9;

               console.log("MATCH:", from, "→", to);

               await axios.post(
                 `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                 {
                   chat_id: CHAT_ID,
                   text:
`🚨 TRANSFERENCIA DETECTADA

De: ${from}
Para: ${to}
Monto: ${sol} SOL

https://solscan.io/tx/${tx.signature}`
                 }
               );

               break; // 🔥 evita segundo envío dentro misma tx
            }
         }
      }

   } catch(err){
      console.log("ERROR:", err.response?.data || err.message);
   }

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("Servidor activo"));