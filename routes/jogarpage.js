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

    // Validação: Verificar se o parâmetro `codigo` foi passado corretamente
    if (!codigoSala || typeof codigoSala !== 'string' || codigoSala.trim() === '') {
        return res.status(400).render('pages/sala', {
            codigoSala: null,
            jogadores: [],
            usuarioID: usuarioID,
            error: "Código da sala inválido ou não fornecido."
        });
    }

    // Validação: Verificar se a sala existe no objeto `salas`
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
        const usuariosIDs = salas[codigoSala];

        if (!Array.isArray(usuariosIDs) || usuariosIDs.length === 0) {
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

    if (!codigoSala || !salas[codigoSala]) {
        return res.status(400).send('Sala não encontrada.');
    }

    const pergunta = salas[codigoSala].perguntaAtual;

    if (!pergunta) {
        return res.status(404).send('Pergunta não encontrada.');
    }

    res.render('pages/gabhoot', { pergunta });
})

router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = parseInt(req.body.resposta, 10);
        const tempoRestante = parseInt(req.body.tempoRestante, 10);
        const codigoSala = req.session.codigoSala;

        if (!codigoSala || !salas[codigoSala]) {
            return res.status(400).send('Sala não encontrada.');
        }

        const perguntas = salas[codigoSala].perguntas || [];

        if (!perguntas || perguntas.length === 0) {
            return res.redirect('/jogar/resultado');
        }

        req.session.respostas = req.session.respostas || [];
        const perguntaAtual = salas[codigoSala].perguntaAtual;

        // Verificando se a resposta é correta
        const respostaCorreta = perguntaAtual.respostas.find(r => r.id === respostaID)?.correta || 0;

        req.session.respostas.push({
            pergunta_id: perguntaAtual.id,
            resposta_id: respostaID,
            correta: respostaCorreta,
            tempoRestante: tempoRestante
        });

        salas[codigoSala].perguntas.shift();
        salas[codigoSala].perguntaAtual = salas[codigoSala].perguntas[0];

        // Verificando se há mais perguntas
        if (!salas[codigoSala].perguntaAtual) {
            return res.redirect('/jogar/resultado');
        }

        res.render('pages/gabhoot', { pergunta: salas[codigoSala].perguntaAtual });
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
        .filter(r => r.correta === 1) 
        .reduce((total, r) => total + (r.tempoRestante || 0), 0); 

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
