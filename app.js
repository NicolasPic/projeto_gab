const express = require("express");
const app = express();
const homepage = require("./routes/homePage")
const { engine } = require('express-handlebars');

//Configurações
    //Template Engine
        //handlebars
        app.engine('handlebars', engine({ defaultLayout: 'main' }));
        app.set('view engine', 'handlebars');
        //bodyparse
        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());

    //rotas
        app.use('/home',homepage)



//outros
app.listen(8081, function(){
    console.log('Servidor rodando na url http://localhost:8081');
});