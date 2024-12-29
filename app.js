const express = require("express");
const app = express();
const http = require("http");
const socketIo = require("socket.io");
const { engine } = require("express-handlebars");
require("dotenv").config();
const { conectarDB } = require("./config/DB/database");
const {configurarSocket} = require("./config/socket/gameSocket");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const ioSession = require("express-socket.io-session");
const { setupPassport } = require("./config/auth/auth");
const { Quiz, Pergunta, Resposta, Usuario } = require('./models/relacionamentos');
const criarUsuarioAdmin = require('./config/auth/adminSetup');


conectarDB();

setupPassport(passport);

criarUsuarioAdmin();

const sessionMiddleware = session({
    secret: "projetogab",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
});

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

io.use(ioSession(sessionMiddleware, {
    autoSave: true 
}));

io.use((socket, next) => {
    const session = socket.handshake.session;

    if (session && session.passport && session.passport.user) {
        socket.user = session.passport.user;
        socket.sala = session.sala || null;
        return next();
    }
    return next(new Error("Usuário não autenticado"));
});

configurarSocket(io);

app.engine(
    "handlebars",
    engine({
        defaultLayout: "main",
        helpers: {
            json: (context) => JSON.stringify(context),
            increment: (index) => index + 1,
            slice: (array, start, end) => array.slice(start, end)
        },
    })
);
app.set("view engine", "handlebars");


app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


const inicialpage = require("./controlers/inicialpageController");
const loginpage = require("./controlers/loginpageController");
const homepage = require("./controlers/homepageController");
const jogarpage = require("./controlers/jogarpageController");
const adminpage = require("./controlers/adminpageController");

app.use("/inicial", inicialpage);
app.use("/login", loginpage);
app.use("/home", homepage);
app.use("/jogar", jogarpage);
app.use("/admin", adminpage)

server.listen(8081, () => {
    console.log("Servidor rodando na URL http://localhost:8081");
});
