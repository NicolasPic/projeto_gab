const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const { engine } = require("express-handlebars");
require("dotenv").config();
const { conectarDB } = require("./config/DB/database");
const configurarSocket = require("./config/socket/gameSocket");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const ioSession = require("express-socket.io-session");
const { setupPassport } = require("./config/auth/auth");

// Conectar ao banco de dados
conectarDB();

// Configuração do Passport
setupPassport(passport);

// Salvar o middleware de sessão em uma variável para reutilizar no Socket.IO
const sessionMiddleware = session({
    secret: "projetogab",
    resave: true,
    saveUninitialized: true
});

// Sessão no Express
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});

app.use((req, res, next) => {
    if (!req.session.sala) {
        req.session.sala = null;
    }
    next();
});

const server = http.createServer(app);
const io = socketIo(server);

// Integração do middleware de sessão com o Socket.IO
io.use(ioSession(sessionMiddleware, {
    autoSave: true 
}));

io.use((socket, next) => {
    const session = socket.handshake.session;

    if (session && session.passport && session.passport.user) {
        socket.user = session.passport.user;o
        socket.sala = session.sala || null;
        return next();
    }
    return next(new Error("Usuário não autenticado"));
});

// Configuração do Socket.IO
configurarSocket(io);

// Configuração do Handlebars
app.engine("handlebars", engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Middleware para parsing de dados
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Importação das rotas
const inicialpage = require("./routes/inicialpage");
const loginpage = require("./routes/loginpage");
const homepage = require("./routes/homepage");
const jogarpage = require("./routes/jogarpage");

app.use("/inicial", inicialpage);
app.use("/login", loginpage);
app.use("/home", homepage);
app.use("/jogar", jogarpage);

// Inicia o servidor
server.listen(8081, () => {
    console.log("Servidor rodando na URL http://localhost:8081");
});
