const express = require("express");
const app = express();
const homepage = require("./routes/homepage")

//Configurações

    //rotas
        app.use('/home',homepage)



//outros
app.listen(8081, function(){
    console.log("Servidor rodando na url http://localhost:8081");
});