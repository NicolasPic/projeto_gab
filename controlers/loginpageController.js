const express = require("express")
const router = express.Router()
const sequelize = require('sequelize')
const Usuario = require('../models/usuario');
const bcrypt = require("bcryptjs")
const passport = require("passport")

router.get('/', (req, res) => {
    res.render('pages/login', { 
        title: 'Página login',
        customHeaderVazio: true  // Ativa o cabeçalho principal
    });
});

router.post('/',(req,res,next) => {
    passport.authenticate("local",{
        successRedirect: "/home",
        failureRedirect: "/login",
        failureFlash: true
    })(req,res,next)
})

router.get('/criarconta', (req, res) => {
    res.render('pages/criarconta', { 
        title: 'Página criar conta',
        customHeaderVazio: true  
    });
});

router.post('/criarconta', (req, res) => {
    var erros = [];

    if (!req.body.nome || typeof req.body.nome === undefined || req.body.nome === null) {
        erros.push({ texto: "Nome inválido" });
    }

    if (!req.body.username || typeof req.body.username === undefined || req.body.username === null) {
        erros.push({ texto: "Username inválido" });
    }

    if (!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        erros.push({ texto: "Email inválido" });
    }

    if (!req.body.password || typeof req.body.password === undefined || req.body.password === null) {
        erros.push({ texto: "Senha inválida" });
    }

    if (req.body.password !== req.body.password2) {
        erros.push({ texto: "As suas senhas são diferentes" });
    }

    if (erros.length > 0) {
        return res.render("pages/criarconta", { erros: erros });
    }

    Usuario.findOne({ where: { username: req.body.username } })
        .then((usuarioExistente) => {
            if (usuarioExistente) {
                req.flash("error_msg", "Já existe uma conta com esse username");
                return res.redirect("/login/criarconta");
            }

            const novoUsuario = new Usuario({
                nome: req.body.nome,
                username: req.body.username,
                email: req.body.email,
                senha: req.body.password,
            });

            bcrypt.genSalt(10, (erro, salt) => {
                if (erro) {
                    req.flash("error_msg", "Houve um erro durante o processo de criptografia");
                    return res.redirect("/login/criarconta");
                }

                bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                    if (erro) {
                        req.flash("error_msg", "Houve um erro durante o salvamento do usuário");
                        return res.redirect("/login/criarconta");
                    }

                    novoUsuario.senha = hash;
                    
                    novoUsuario.save()
                        .then(() => {
                            req.flash("success_msg", "Usuário criado com sucesso");
                            res.redirect("/home");
                        })
                        .catch((err) => {
                            console.log(err); 
                            req.flash("error_msg", "Houve um erro ao criar o usuário, tente novamente");
                            res.redirect("/login/criarconta");
                        });
                });
            });
        })
        .catch((err) => {
            console.log(err); 
            req.flash("error_msg", "Houve um erro interno, tente novamente");
            res.redirect("/login/criarconta");
        });
});

module.exports = router