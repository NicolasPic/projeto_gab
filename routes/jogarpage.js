const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');

router.get('/', isAuthenticated, (req, res) => {
    // Supondo que o nome do usuário esteja em req.user
    const nomeUsuario = req.user ? req.user.nome : 'Visitante';  // ou do JWT
    res.render('pages/jogar', { 
        title: 'Página jogar',
        customHeaderHome: true,  // Ativa o cabeçalho principal
        nomeJogador: nomeUsuario // Passa o nome do jogador para a view
    });
});

router.get('/sala/:codigo', isAuthenticated, (req, res) => {
    const codigoSala = req.params.codigo;
    const nomeUsuario = req.user ? req.user.nome : 'Visitante';  // Pega o nome do usuário logado
    res.render('pages/sala', { codigoSala, nomeJogador: nomeUsuario });
});

module.exports = router;
