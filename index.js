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