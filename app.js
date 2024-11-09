const express = require("express");
const app = express();
const homepage = require("./routes/homepage")
const handlebars = require("express-handlebars")
const bodyParser = require("body-parser")

//Configurações
    //Template Engine
        //handlebars
        app.engine('handlebars', handlebars({defaultLayout: 'main'}))
        app.set('veiw engine', 'handlebars')
        //bodyparse
        app.use(bodyParser.urlencoded({extended: false}))
        app.use(bodyParser.json())

    //rotas
        app.use('/home',homepage)



//outros
app.listen(8081, function(){
    console.log('Servidor rodando na url http://localhost:8081');
});