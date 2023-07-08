const mongoose=require("mongoose");
const DB=`mongodb+srv://admin:iXatwYMuvUwaIeMd@cluster0.jvegpfy.mongodb.net/${process.env.DATA_BASE }?retryWrites=true&w=majority`

mongoose.connect(DB,{
    useUnifiedTopology: true,
    useNewUrlparser:true
}).then(()=>console.log("DataBase Connected")).catch((err)=>{
    console.log(err);
})