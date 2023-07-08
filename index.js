const express= require("express")
const app= express();
const router = require("./routes/routes")
const cors = require("cors");
const cookiParser = require("cookie-parser")
const ENV = require("dotenv")
require("./db/conn")

ENV.config();

// app.get("/",(req,res)=>{
//     res.status(201).json("server created")
// })

app.use(express.json());
app.use(cookiParser());

app.use(cors({
    origin: "https://profound-sunburst-e217cc.netlify.app"
   
}))
app.use(router);




app.listen(process.env.PORT,()=>{
    console.log(`server start at port no :${process.env.PORT}`)
})
