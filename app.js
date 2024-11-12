const express = require("express");
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const { engine } = require('express-handlebars');
const { conectarDB } = require('./config/DB/database');
const configurarSocket = require('./config/socket/gameSocket');

// Conectar ao banco antes de rodar o servidor
conectarDB();

// Configuração do servidor
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

// Definição das rotas
app.use('/inicial', inicialpage);
app.use('/login', loginpage);
app.use('/home', homepage);

// Inicia o servidor
server.listen(8081, () => {
    console.log('Servidor rodando na url http://localhost:8081');
});