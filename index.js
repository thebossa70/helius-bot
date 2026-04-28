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
 "FxwArENkKBx4QyfoEU1vkBnDzMfZV9Z1b8GBzpT9zb5k",
 "7eStM4BgV5e3AvE1DXHwvGh5M9PoRvExNAYS98LjeSym",
 "86jut9tAf9gPfkaUhwEjN8avhH7UxuoGUyk7oeZwtoV7",
 "4qBro3VYM7ZcDeLTcGueazKYQYED6ZmM3HEy7NxTuNFU",
 "F5XvCe4233m6mHRbkkq2ZsFvqrPAnRrDBExeQy2fwagQ",
 "BCagckXeMChUKrHEd6fKFA1uiWDtcmCXMsqaheLiUPJd",
 "662dsE2yrBXzjYFyQvqjxiXfjUhqxo52aGcJFaVy7puc",
 "HsuDfzmCaPBeCBdj1LaCR1yNn7wrCnXNHaYYCs3m7X28",
 "rNAUS5wm8CqFodvUaU1qqiBJ594uVn3heCLtTnHrjpw",
 "CuZUpmhFsz9t1ERWfNubzmwrjRCjn9WSkz6qg6BSSyrf",
 "7yU2QHwhWFjJFcCYDcUFCHB898qSfFqtificLidS8cp2",
 "5R4Z9SKfe9hUiU4MAVBgE2Cjqdwhy8H9o2GBVCC1YxF2",
 "A6nm8LqpeC76a5H31GZLttWY2KqHVH9H8ASYvEPudSYp",
 "AeBgYrBba5Cq38HR7G6quKairkyCpBk5Nt2kKyaEFZUr",
 "9UWsdEWgixs7qCZKgEXq9ifs7KkDu8xW9zGopiVaLVj7",
 "DrwtvGAhrWutCWYQqHT4zceietfBJTVUBjZVbR2sNiJq",
 "4qBro3VYM7ZcDeLTcGueazKYQYED6ZmM3HEy7NxTuNFU",
 "9FtGm6hJULCpA8An4sFg5ysHUExDZBtMeDCxsYnTnWh5"
].map(w => w.toLowerCase());


const TARGET_WALLETS = [
 "BigrT9DAnXnzVNFQPg3VF4WvyGyifFtFMVALPVsLnvTu",
 "GmMQP6KgWhZHaxVScGYULJp26JsdgjPBMwmS3SDyZhnS",
 "9cWia2oyxRmK1suBQ9foQ94n3mz5GcE17RRzKHQm3PwD",
 "4qBro3VYM7ZcDeLTcGueazKYQYED6ZmM3HEy7NxTuNFU",
 "F5XvCe4233m6mHRbkkq2ZsFvqrPAnRrDBExeQy2fwagQ",
 "51yZyDSnec4xnUv7XLRVYcDyV4x3wUtzrDcRaYbmQU5j"
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