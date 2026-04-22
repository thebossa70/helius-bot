const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

console.log("BOT VERSION FINAL");

// CONFIG
const BOT_TOKEN = process.env.BOT_TOKEN || "8292789731:AAHXSo9PBZ_i0TgioRgwh-EfgiennxNmZG8";
const CHAT_ID = process.env.CHAT_ID || "1998268076";


// =======================
// WALLETS ORIGINALES
// =======================

const WATCH_WALLETS = [
 "bwamJzztZsepfkteWRChggmXuiiCQvpLqPietdNfSXa",
 "BigrQYqqumRdxseNJwqwaAR86zeEVjKpVuXMaEucqqTu"
].map(w => w.toLowerCase());


const TARGET_WALLETS = [
 "BigrT9DAnXnzVNFQPg3VF4WvyGyifFtFMVALPVsLnvTu",
].map(w => w.toLowerCase());


// siempre normalizar lo recibido
const normalize = a => (a || "").toLowerCase();


// anti duplicados
const seen = new Set();

function remember(sig){
   seen.add(sig);

   setTimeout(()=>{
      seen.delete(sig);
   },300000);
}


// WEBHOOK
app.post("/webhook", async (req,res)=>{

   res.send("ok");

   try{

      const txs = req.body || [];

      for(const tx of txs){

         if(!tx.signature) continue;

         if(seen.has(tx.signature)){
            console.log("DUPLICADO IGNORADO");
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

               console.log("MATCH:", from,"→",to);

               await axios.post(
                  `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                  {
                    chat_id: CHAT_ID,
                    text:
`🚨 TRANSFERENCIA DETECTADA

De: ${t.fromUserAccount}
Para: ${t.toUserAccount}
Monto: ${sol} SOL

https://solscan.io/tx/${tx.signature}`
                  }
               );

               break;
            }
         }
      }

   } catch(err){
      console.log("ERROR:", err.response?.data || err.message);
   }

});


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
   console.log("Servidor activo");
});