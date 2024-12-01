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
        // Gerar 10 IDs aleatórios
        const randomIDs = getRandomUniqueNumbers(1, 20, 10);
        console.log('IDs gerados:', randomIDs);

        // Salvar os IDs na sessão
        req.session.perguntas = randomIDs;

        // Buscar a primeira pergunta
        const perguntaID = randomIDs[0];
        const [rows] = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto
            FROM perguntas p
            JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [perguntaID],
            type: sequelize.QueryTypes.SELECT
        });

        if (!rows) {
            console.error(`Nenhuma pergunta encontrada para o ID ${perguntaID}.`);
            return res.status(404).send('Nenhuma pergunta encontrada.');
        }

        console.log('Resultado da query:', rows);

        // Verificar se `rows` é um único objeto ou uma matriz
        const isSingleObject = !Array.isArray(rows);

        // Montar a pergunta
        const pergunta = {
            id: isSingleObject ? rows.pergunta_id : rows[0]?.pergunta_id,
            texto: isSingleObject ? rows.pergunta_texto : rows[0]?.pergunta_texto,
            respostas: isSingleObject
                ? [{ id: rows.resposta_id, texto: rows.resposta_texto }]
                : rows.map(row => ({ id: row.resposta_id, texto: row.resposta_texto }))
        };

        console.log('Primeira pergunta carregada:', pergunta);

        res.render('pages/gabhoot', { pergunta });
    } catch (error) {
        console.error('Erro ao carregar a primeira pergunta:', error);
        res.status(500).send('Erro ao iniciar o jogo.');
    }
});

// Rota para próxima pergunta
router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = req.body.resposta || null;
        const perguntas = req.session.perguntas;

        // Verifica se há perguntas restantes
        if (!perguntas || perguntas.length === 0) {
            console.log('Nenhuma pergunta restante. Redirecionando para o resultado.');
            return res.redirect('/jogar/resultado');
        }

        // Registra a resposta do jogador
        if (respostaID) {
            req.session.respostas = req.session.respostas || [];
            req.session.respostas.push({ pergunta_id: perguntas[0], resposta_id: respostaID });
        }

        // Remove o ID da pergunta já respondida
        const perguntaID = perguntas.shift(); // Remove o primeiro ID
        req.session.perguntas = perguntas; // Atualiza a sessão

        console.log(`Buscando pergunta para o ID: ${perguntaID}`);

        // Se não houver mais perguntas, redireciona para o resultado
        if (perguntas.length === 0) {
            console.log('Todas as perguntas foram respondidas. Redirecionando para o resultado.');
            return res.redirect('/jogar/resultado');
        }

        // Busca a próxima pergunta
        const [rows] = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto
            FROM perguntas p
            JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [perguntas[0]], // Usa o próximo ID
            type: sequelize.QueryTypes.SELECT
        });

        if (!rows) {
            console.error(`Nenhuma pergunta encontrada para o ID ${perguntas[0]}.`);
            return res.status(404).send('Nenhuma pergunta encontrada.');
        }

        console.log('Resultado da query:', rows);

        // Verifica se `rows` é um único objeto ou uma matriz
        const isSingleObject = !Array.isArray(rows);

        // Organiza a próxima pergunta
        const pergunta = {
            id: isSingleObject ? rows.pergunta_id : rows[0]?.pergunta_id,
            texto: isSingleObject ? rows.pergunta_texto : rows[0]?.pergunta_texto,
            respostas: isSingleObject
                ? [{ id: rows.resposta_id, texto: rows.resposta_texto }]
                : rows.map(row => ({ id: row.resposta_id, texto: row.resposta_texto }))
        };

        console.log('Próxima pergunta carregada:', pergunta);

        res.render('pages/gabhoot', { pergunta });
    } catch (error) {
        console.error('Erro ao carregar a próxima pergunta:', error);
        res.status(500).send('Erro ao continuar o jogo.');
    }
});

// Rota para exibir o resultado final
router.get('/resultado', isAuthenticated, (req, res) => {
    const respostas = req.session.respostas || [];
    req.session.perguntas = null; // Limpa as perguntas da sessão
    req.session.respostas = null; // Limpa as respostas da sessão

    res.render('pages/resultado', { total: respostas.length }); // Renderiza o resultado final
});

module.exports = router;