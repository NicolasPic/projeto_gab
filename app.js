const express = require("express");
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const { engine } = require('express-handlebars');
require('dotenv').config();
const { conectarDB } = require('./config/DB/database');
const Pergunta = require('./models/pergunta');
const Resposta = require('./models/resposta');
const configurarSocket = require('./config/socket/gameSocket');
const session = require("express-session")
const flash = require("connect-flash")

//sessão
app.use(session({
    secret: "projetogab",
    resave: true,
    saveUninitialized: true
}))
app.use(flash())

//Middleware
app.use((req, res, next) => {
    res.locals.success_msg =req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    next()
})

// Conectar ao banco antes de rodar o servidor
conectarDB();

//Configuração do servidor
const server = http.createServer(app);
const io = socketIo(server);
configurarSocket(io);

// Configuração do Handlebars
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Importação das rotas
const inicialpage = require("./routes/inicialpage");
const loginpage = require("./routes/loginpage");
const homepage = require("./routes/homepage");
const jogarpage = require("./routes/jogarpage");

// Definição das rotas
app.use('/inicial', inicialpage);
app.use('/login', loginpage);
app.use('/home', homepage);
app.use('/jogar', jogarpage);

// Inicia o servidor
server.listen(8081, () => {
    console.log('Servidor rodando na url http://localhost:8081');
});