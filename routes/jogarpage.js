const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');
const { sequelize } = require("../config/DB/database");

function getRandomUniqueNumbers(min, max, count) {
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min); 
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers.slice(0, count); 
}

router.get('/', isAuthenticated, (req, res) => {
    const nomeUsuario = req.user ? req.user.nome : 'Visitante'; 
    res.render('pages/jogar', { 
        title: 'Página jogar',
        customHeaderHome: true,
        nomeJogador: nomeUsuario
    });
});

router.get('/sala/:codigo', isAuthenticated, (req, res) => {
    const codigoSala = req.params.codigo;
    const nomeUsuario = req.user ? req.user.nome : 'Visitante'; 
    res.render('pages/sala', { codigoSala, nomeJogador: nomeUsuario });
});

router.get('/gabhoot', isAuthenticated, async (req, res) => {
    try {
        const randomIDs = getRandomUniqueNumbers(1, 20, 10);
        console.log('IDs gerados:', randomIDs);
        req.session.perguntas = randomIDs;

        const perguntaID = randomIDs[0];
        const rows = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto,
                   r.correta AS resposta_correta
            FROM perguntas p
            LEFT JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [perguntaID],
            type: sequelize.QueryTypes.SELECT
        });

        if (!rows || rows.length === 0) {
            console.error(`Nenhuma pergunta encontrada para o ID ${perguntaID}.`);
            return res.status(404).send('Nenhuma pergunta encontrada.');
        }

        const pergunta = {
            id: rows[0].pergunta_id,
            texto: rows[0].pergunta_texto,
            respostas: rows.map(row => ({
                id: row.resposta_id,
                texto: row.resposta_texto,
                correta: row.resposta_correta
            })).filter(resposta => resposta.id)
        };

        console.log('Dados retornados pela consulta:', rows);
        console.log('Pergunta processada:', pergunta);

        res.render('pages/gabhoot', { pergunta });
    } catch (error) {
        console.error('Erro ao carregar a primeira pergunta:', error);
        res.status(500).send('Erro ao iniciar o jogo.');
    }
});

router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = parseInt(req.body.resposta, 10);
        const tempoRestante = parseInt(req.body.tempoRestante, 10); // Tempo restante enviado pelo cliente
        const perguntas = req.session.perguntas || [];

        if (!perguntas || perguntas.length === 0) {
            return res.redirect('/jogar/resultado');
        }

        req.session.respostas = req.session.respostas || [];
        const perguntaAtual = perguntas.shift();

        const rows = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto,
                   r.correta AS resposta_correta
            FROM perguntas p
            LEFT JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [perguntaAtual],
            type: sequelize.QueryTypes.SELECT
        });

        const correta = rows.find(row => row.resposta_id === respostaID)?.resposta_correta || 0;

        req.session.respostas.push({
            pergunta_id: perguntaAtual,
            resposta_id: respostaID,
            correta: correta,
            tempoRestante: tempoRestante // Armazena o tempo restante
        });

        req.session.perguntas = perguntas;

        if (perguntas.length === 0) {
            return res.redirect('/jogar/resultado');
        }

        const proxPerguntaID = perguntas[0];
        const proxRows = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto,
                   r.correta AS resposta_correta
            FROM perguntas p
            LEFT JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [proxPerguntaID],
            type: sequelize.QueryTypes.SELECT
        });

        const proxPergunta = {
            id: proxRows[0].pergunta_id,
            texto: proxRows[0].pergunta_texto,
            respostas: proxRows.map(row => ({
                id: row.resposta_id,
                texto: row.resposta_texto,
                correta: row.resposta_correta
            })).filter(resposta => resposta.id)
        };

        res.render('pages/gabhoot', { pergunta: proxPergunta });
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
        .filter(r => r.correta === 1) // Filtra apenas as respostas corretas
        .reduce((total, r) => total + (r.tempoRestante || 0), 0); // Soma o tempo restante das respostas corretas

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
