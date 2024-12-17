const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');
const { sequelize } = require("../config/DB/database");
const { salas } = require('../config/socket/gameSocket');

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
    const usuarioID = req.user ? req.user.id : null;
    const isAdmin = salas[codigoSala].admin == usuarioID;
    console.log(usuarioID)
    console.log(salas[codigoSala].admin)
    console.log(isAdmin);
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
        const usuariosIDs = Object.keys(salas[codigoSala].jogadores);

        if (usuariosIDs.length === 0) {
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
            isAdmin,
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
    const usuarioID = req.user ? req.user.id : null;

    if (!codigoSala || !salas[codigoSala] || !salas[codigoSala].jogadores[usuarioID]) {
        return res.status(400).send('Sala ou usuário não encontrados.');
    }

    const pergunta = salas[codigoSala].jogadores[usuarioID].perguntaAtual;

    if (!pergunta) {
        return res.status(404).send('Pergunta não encontrada.');
    }

    res.render('pages/gabhoot', { pergunta });
});

router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = parseInt(req.body.resposta, 10);
        const tempoRestante = parseInt(req.body.tempoRestante, 10);
        const codigoSala = req.session.codigoSala;
        const usuarioID = req.user ? req.user.id : null;

        if (!codigoSala || !salas[codigoSala] || !salas[codigoSala].jogadores[usuarioID]) {
            return res.status(400).json({ error: 'Sala ou usuário não encontrados.' });
        }

        const perguntas = salas[codigoSala].jogadores[usuarioID].perguntas || [];

        if (!perguntas || perguntas.length === 0) {
            salas[codigoSala].jogadores[usuarioID].respondeuTodas = true;
            return res.json({
                correta: null,
                proximaPergunta: null,
                terminou: true
            });
        }

        req.session.respostas = req.session.respostas || [];
        const perguntaAtual = salas[codigoSala].jogadores[usuarioID].perguntaAtual;

        const respostaCorreta = perguntaAtual.respostas.find(r => r.id === respostaID)?.correta || false;

        req.session.respostas.push({
            pergunta_id: perguntaAtual.id,
            resposta_id: respostaID,
            correta: respostaCorreta ? 1 : 0,
            tempoRestante: tempoRestante
        });
        salas[codigoSala].jogadores[usuarioID].perguntas.shift();
        salas[codigoSala].jogadores[usuarioID].perguntaAtual = salas[codigoSala].jogadores[usuarioID].perguntas[0];

        res.json({
            correta: respostaCorreta, 
            proximaPergunta: salas[codigoSala].jogadores[usuarioID].perguntaAtual || null,
            terminou: !salas[codigoSala].jogadores[usuarioID].perguntaAtual
        });
    } catch (error) {
        console.error('Erro ao processar resposta e carregar próxima pergunta:', error);
        res.status(500).json({ error: 'Erro ao continuar o jogo.' });
    }
});

router.get('/resultado', isAuthenticated, async (req, res) => {
    const codigoSala = req.session.codigoSala;
    const usuarioID = req.user ? req.user.id : null;
    const respostas = req.session.respostas || [];
    req.session.perguntas = null;
    req.session.respostas = null;

    const acertos = respostas.filter(r => r.correta === 1).length;
    const pontos = respostas
        .filter(r => r.correta === 1)
        .reduce((total, r) => total + (r.tempoRestante || 0), 0);

    if (salas[codigoSala].jogadores[usuarioID]) {
        salas[codigoSala].jogadores[usuarioID].pontuacao = pontos;
    }

    try {
        const usuariosIDs = Object.keys(salas[codigoSala].jogadores);

        if (usuariosIDs.length === 0) {
            console.info(`Nenhum jogador na sala ${codigoSala}.`);
            return res.render('pages/resultado', {
                codigoSala,
                jogadores: [],
                usuarioID: usuarioID,
                acertos,
                pontuacaoIndividual: pontos,
                resultados: [],
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

        const resultados = jogadores.map(jogador => ({
            nome: jogador.nome,
            pontuacaoTotalIndividual: salas[codigoSala].jogadores[jogador.id]?.pontuacao || 0
        }));

        req.session.acertos = acertos;
        req.session.pontos = pontos;
        req.session.resultados = resultados;

        return res.render('pages/resultado', {
            codigoSala,
            jogadores,
            usuarioID: usuarioID,
            acertos: req.session.acertos,
            pontuacaoIndividual: pontos,
            resultados: JSON.stringify(req.session.resultados),
            error: null
        });

    } catch (error) {
        console.error("Erro ao carregar jogadores no Resultado:", error);
        return res.status(500).render('pages/resultado', {
            codigoSala,
            jogadores: [],
            usuarioID: usuarioID,
            acertos,
            pontuacaoIndividual: pontos,
            resultados: [],
            error: "Erro ao carregar jogadores."
        });
    }
});

module.exports = router;
