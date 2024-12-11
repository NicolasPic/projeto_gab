const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');
const { sequelize } = require("../config/DB/database");
const { salas } = require('../config/socket/gameSocket');

<<<<<<< HEAD
=======

>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a
router.get('/', isAuthenticated, (req, res) => {
    const nomeUsuario = req.user ? req.user.nome : 'Visitante';
    const usuarioID = req.user ? req.user.id : null;
    res.render('pages/jogar', {
        title: 'Página jogar',
        customHeaderHome: true,
        nomeJogador: nomeUsuario,
        usuarioID: usuarioID
    });
});

router.get('/sala/:codigo', isAuthenticated, async (req, res) => {
    const codigoSala = req.params.codigo;
<<<<<<< HEAD
    const usuarioID = req.user ? req.user.id : null;
=======
    const usuarioID = req.user ? req.user.id : null; 
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a
    req.session.codigoSala = codigoSala;

    if (!salas || typeof salas !== 'object') {
        console.error("Erro: Objeto `salas` não foi definido ou está mal configurado.");
        return res.status(500).render('pages/sala', {
            codigoSala: null,
            jogadores: [],
            usuarioID: usuarioID,
            error: "Erro interno: Objeto de gerenciamento de salas está indisponível."
        });
    }

    if (!codigoSala || typeof codigoSala !== 'string' || codigoSala.trim() === '') {
        return res.status(400).render('pages/sala', {
            codigoSala: null,
            jogadores: [],
            usuarioID: usuarioID,
            error: "Código da sala inválido ou não fornecido."
        });
    }

    if (!salas[codigoSala]) {
        console.warn(`Sala não encontrada: ${codigoSala}`);
        return res.status(404).render('pages/sala', {
            codigoSala,
            jogadores: [],
            usuarioID: usuarioID,
            error: "Sala não encontrada."
        });
    }

    try {
        const usuariosIDs = Object.keys(salas[codigoSala]);

<<<<<<< HEAD
        if (usuariosIDs.length === 0) {
=======
        if (!Array.isArray(usuariosIDs) || usuariosIDs.length === 0) {
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a
            console.info(`Nenhum jogador na sala ${codigoSala}.`);
            return res.render('pages/sala', {
                codigoSala,
                jogadores: [],
                usuarioID: usuarioID,
                error: "Nenhum jogador na sala no momento."
            });
        }

        const jogadores = await sequelize.query(
            `SELECT id, nome FROM usuarios WHERE id IN (:ids)`,
            {
                replacements: { ids: usuariosIDs },
                type: sequelize.QueryTypes.SELECT
            }
        );
        return res.render('pages/sala', {
            codigoSala,
            jogadores,
            usuarioID: usuarioID,
            error: null
        });
    } catch (error) {
        console.error("Erro ao buscar jogadores no banco de dados:", error);

        return res.status(500).render('pages/sala', {
            codigoSala,
            jogadores: [],
            usuarioID: usuarioID,
            error: "Erro ao carregar informações da sala."
        });
    }
});

router.get('/gabhoot', isAuthenticated, async (req, res) => {
    const codigoSala = req.session.codigoSala;
<<<<<<< HEAD
    const usuarioID = req.user ? req.user.id : null;

    if (!codigoSala || !salas[codigoSala] || !salas[codigoSala][usuarioID]) {
        return res.status(400).send('Sala ou usuário não encontrados.');
    }

    const pergunta = salas[codigoSala][usuarioID].perguntaAtual;
=======

    if (!codigoSala || !salas[codigoSala]) {
        return res.status(400).send('Sala não encontrada.');
    }

    const pergunta = salas[codigoSala].perguntaAtual;
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a

    if (!pergunta) {
        return res.status(404).send('Pergunta não encontrada.');
    }

    res.render('pages/gabhoot', { pergunta });
<<<<<<< HEAD
});
=======
})
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a

router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = parseInt(req.body.resposta, 10);
        const tempoRestante = parseInt(req.body.tempoRestante, 10);
        const codigoSala = req.session.codigoSala;
<<<<<<< HEAD
        const usuarioID = req.user ? req.user.id : null;

        if (!codigoSala || !salas[codigoSala] || !salas[codigoSala][usuarioID]) {
            return res.status(400).send('Sala ou usuário não encontrados.');
        }

        const perguntas = salas[codigoSala][usuarioID].perguntas || [];
=======

        if (!codigoSala || !salas[codigoSala]) {
            return res.status(400).send('Sala não encontrada.');
        }

        const perguntas = salas[codigoSala].perguntas || [];
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a

        if (!perguntas || perguntas.length === 0) {
            return res.redirect('/jogar/resultado');
        }

        req.session.respostas = req.session.respostas || [];
<<<<<<< HEAD
        const perguntaAtual = salas[codigoSala][usuarioID].perguntaAtual;

=======
        const perguntaAtual = salas[codigoSala].perguntaAtual;

        // Verificando se a resposta é correta
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a
        const respostaCorreta = perguntaAtual.respostas.find(r => r.id === respostaID)?.correta || 0;

        req.session.respostas.push({
            pergunta_id: perguntaAtual.id,
            resposta_id: respostaID,
            correta: respostaCorreta,
            tempoRestante: tempoRestante
        });

<<<<<<< HEAD
        salas[codigoSala][usuarioID].perguntas.shift();
        salas[codigoSala][usuarioID].perguntaAtual = salas[codigoSala][usuarioID].perguntas[0];

        if (!salas[codigoSala][usuarioID].perguntaAtual) {
            return res.redirect('/jogar/resultado');
        }

        res.render('pages/gabhoot', { pergunta: salas[codigoSala][usuarioID].perguntaAtual });
=======
        salas[codigoSala].perguntas.shift();
        salas[codigoSala].perguntaAtual = salas[codigoSala].perguntas[0];

        // Verificando se há mais perguntas
        if (!salas[codigoSala].perguntaAtual) {
            return res.redirect('/jogar/resultado');
        }

        res.render('pages/gabhoot', { pergunta: salas[codigoSala].perguntaAtual });
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a
    } catch (error) {
        console.error('Erro ao carregar a próxima pergunta:', error);
        res.status(500).send('Erro ao continuar o jogo.');
    }
});

router.get('/resultado', isAuthenticated, (req, res) => {
    const respostas = req.session.respostas || [];
    req.session.perguntas = null;
    req.session.respostas = null;

    const acertos = respostas.filter(r => r.correta === 1).length;
    const tempoTotalRestante = respostas
<<<<<<< HEAD
        .filter(r => r.correta === 1)
        .reduce((total, r) => total + (r.tempoRestante || 0), 0);
=======
        .filter(r => r.correta === 1) 
        .reduce((total, r) => total + (r.tempoRestante || 0), 0); 
>>>>>>> 129f441748d6b8714e7ac969688c3d2f4ed35a5a

    console.log('Respostas registradas:', respostas);
    console.log('Total de acertos:', acertos);
    console.log('Tempo total restante (apenas acertos):', tempoTotalRestante);

    res.render('pages/resultado', {
        total: respostas.length,
        acertos,
        tempoTotalRestante
    });
});

module.exports = router;
