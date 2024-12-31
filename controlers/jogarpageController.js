const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');
const { sequelize } = require("../config/DB/database");
const { salas } = require('../config/socket/gameSocket');
const { Quiz, Pergunta, Resposta } = require('../models/relacionamentos');

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
    const isAdminGeral = req.user.isAdmin;
    if (!codigoSala || typeof codigoSala !== 'string' || codigoSala.trim() === '') {
        console.warn("Código da sala inválido.");
        return res.status(400).render('pages/sala', {
            codigoSala: null,
            jogadores: [],
            usuarioID,
            isAdmin: false,
            quizzes: [],
            error: "Código da sala inválido."
        });
    }

    req.session.codigoSala = codigoSala;

    if (!salas || typeof salas !== 'object' || !salas[codigoSala]) {
        console.warn(`Sala ${codigoSala} não encontrada ou não criada.`);
        return res.status(404).render('pages/sala', {
            codigoSala,
            jogadores: [],
            usuarioID,
            isAdmin: false,
            quizzes: [],
            error: "Sala não encontrada."
        });
    }

    try {
        const isAdmin = salas[codigoSala].admin == usuarioID;
        const usuariosIDs = Object.keys(salas[codigoSala].jogadores);

        const jogadores = await sequelize.query(
            `SELECT id, nome FROM usuarios WHERE id IN (:ids)`,
            {
                replacements: { ids: usuariosIDs },
                type: sequelize.QueryTypes.SELECT
            }
        );
        const quizzes = await sequelize.query(
            `SELECT q.id, q.nome, q.autor_id, u.nome AS autor FROM quizzes q 
             INNER JOIN usuarios u ON q.autor_id = u.id`,
            {
                type: sequelize.QueryTypes.SELECT
            }
        );
        return res.render('pages/sala', {
            codigoSala,
            jogadores,
            usuarioID,
            isAdmin,
            isAdminGeral: isAdminGeral,
            quizzes, 
            error: null
        });

    } catch (error) {
        console.error("Erro ao carregar informações da sala:", error);
        return res.status(500).render('pages/sala', {
            codigoSala: null,
            jogadores: [],
            usuarioID,
            isAdmin: false,
            quizzes: [],
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

    res.render('pages/gabhoot', {
        pergunta,
        codigoSala,
        usuarioID
    });
});

router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = parseInt(req.body.resposta, 10);
        const tempoRestante = parseInt(req.body.tempoRestante, 10);
        const codigoSala = req.session.codigoSala;
        const usuarioID = req.user ? req.user.id : null;

        if (!req.session.respostas) {
            console.log('Inicializando req.session.respostas');
            req.session.respostas = [];
        }

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

        const perguntaAtual = salas[codigoSala].jogadores[usuarioID].perguntaAtual;

        const respostaCorreta = perguntaAtual.respostas.find(r => r.id == respostaID)?.correta || false;

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

router.get('/espera', isAuthenticated, (req, res) => {
    const codigoSala = req.session.codigoSala;
    const usuarioID = req.user ? req.user.id : null;

    if (!codigoSala || !salas[codigoSala]) {
        return res.status(400).send('Sala não encontrada.');
    }

    res.render('pages/espera', {
        codigoSala,
        usuarioID
    });
});

router.get('/resultado', isAuthenticated, async (req, res) => {
    const codigoSala = req.session.codigoSala;
    const usuarioID = req.user ? req.user.id : null;
    const respostas = req.session.respostas || [];
    const isAdmin = salas[codigoSala].admin == usuarioID;
    const acertos = respostas.filter(r => r.correta === 1).length;
    const pontos = respostas
        .filter(r => r.correta === 1)
        .reduce((total, r) => total + (r.tempoRestante || 0), 0);

    if (salas[codigoSala]?.jogadores[usuarioID]) {
        salas[codigoSala].jogadores[usuarioID].pontuacao = pontos;
    }

    try {
        const usuariosIDs = Object.keys(salas[codigoSala].jogadores);

        const jogadores = await sequelize.query(
            `SELECT id, nome FROM usuarios WHERE id IN (:ids)`,
            {
                replacements: { ids: usuariosIDs },
                type: sequelize.QueryTypes.SELECT
            }
        );

        const resultados = jogadores
            .map(jogador => ({
                id: jogador.id,
                nome: jogador.nome,
                pontuacaoTotalIndividual: salas[codigoSala].jogadores[jogador.id]?.pontuacao || 0
            }))
            .sort((a, b) => b.pontuacaoTotalIndividual - a.pontuacaoTotalIndividual)
            .map((jogador, index) => ({
                ...jogador,
                posicao: index + 1
            }));

        const top5Resultados = resultados.slice(0, Math.min(5, resultados.length));

        return res.render('pages/resultado', {
            codigoSala,
            jogadores,
            usuarioID,
            acertos,
            isAdmin,
            top5: JSON.stringify(top5Resultados),
            pontuacaoIndividual: pontos,
            resultados: JSON.stringify(resultados),
            error: null
        });
    } catch (error) {
        console.error("Erro ao carregar jogadores no Resultado:", error);
        return res.status(500).render('pages/resultado', {
            codigoSala,
            jogadores: [],
            usuarioID,
            acertos,
            pontuacaoIndividual: pontos,
            resultados: [],
            error: "Erro ao carregar jogadores."
        });
    } finally {
        req.session.perguntas = null;
        req.session.respostas = null;
    }
});

router.get('/criar-quiz', isAuthenticated, (req, res) => {
    const codigoSala = req.session.codigoSala;
    const usuarioID = req.user ? req.user.id : null;
    res.render('pages/criarQuiz', {
        title: 'Criar Quiz',
        customHeaderHome: true,
        codigoSala: codigoSala,
        usuarioID: usuarioID
    });
});

router.post('/criar-quiz', isAuthenticated, async (req, res) => {
    const { nome, perguntas } = req.body;
    const usuarioID = req.user ? req.user.id : null;
    const codigoSala = req.session.codigoSala;
    if (!Array.isArray(perguntas)) {
        return res.status(400).send("Formato de perguntas inválido.");
    }

    try {
        const novoQuiz = await Quiz.create({
            nome,
            autor_id: usuarioID
        });

        for (const pergunta of perguntas) {
            const novaPergunta = await Pergunta.create({
                texto: pergunta.texto,
                tipo: pergunta.tipo,
                quiz_id: novoQuiz.id
            });

            for (const resposta of pergunta.respostas) {
                await Resposta.create({
                    texto: resposta.texto,
                    correta: resposta.correta,
                    pergunta_id: novaPergunta.id
                });
            }
        }

        res.redirect(`/jogar/sala/${codigoSala}`);
    } catch (error) {
        console.error("Erro ao criar quiz:", error);
        res.status(500).send("Erro ao criar quiz.");
    }
});


module.exports = router;
