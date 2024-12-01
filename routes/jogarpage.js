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
        // Gerar IDs aleatórios
        const randomIDs = getRandomUniqueNumbers(1, 20, 10);
        console.log('IDs gerados:', randomIDs);

        // Salvar IDs na sessão
        req.session.perguntas = randomIDs;

        // Buscar a primeira pergunta
        const perguntaID = randomIDs[0];
        const rows = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto
            FROM perguntas p
            LEFT JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [perguntaID],
            type: sequelize.QueryTypes.SELECT
        });

        // Verificar se há resultados
        if (!rows || rows.length === 0) {
            console.error(`Nenhuma pergunta encontrada para o ID ${perguntaID}.`);
            return res.status(404).send('Nenhuma pergunta encontrada.');
        }

        // Processar os dados retornados
        const pergunta = {
            id: rows[0].pergunta_id, // O ID da pergunta (igual para todas as linhas)
            texto: rows[0].pergunta_texto, // O texto da pergunta (igual para todas as linhas)
            respostas: rows.map(row => ({
                id: row.resposta_id,
                texto: row.resposta_texto
            })).filter(resposta => resposta.id) // Filtrar respostas válidas
        };

        console.log('Dados retornados pela consulta:', rows);
        console.log('Pergunta processada:', pergunta);

        // Renderizar a página com a pergunta e respostas
        res.render('pages/gabhoot', { pergunta });
    } catch (error) {
        console.error('Erro ao carregar a primeira pergunta:', error);
        res.status(500).send('Erro ao iniciar o jogo.');
    }
});

router.post('/proxima', isAuthenticated, async (req, res) => {
    try {
        const respostaID = req.body.resposta || ''; // Captura a resposta enviada (ou vazio)
        const perguntas = req.session.perguntas || []; // Lista de IDs de perguntas

        // Verifica se ainda há perguntas restantes
        if (!perguntas || perguntas.length === 0) {
            console.log('Nenhuma pergunta restante. Redirecionando para o resultado.');
            return res.redirect('/jogar/resultado');
        }

        // Salva a resposta do jogador (mesmo que seja vazia)
        req.session.respostas = req.session.respostas || [];
        req.session.respostas.push({
            pergunta_id: perguntas[0], // Associa a resposta à pergunta atual
            resposta_id: respostaID
        });

        // Remove a pergunta atual da lista
        perguntas.shift(); // Remove o primeiro ID
        req.session.perguntas = perguntas;

        // Se não houver mais perguntas, redireciona para o resultado
        if (perguntas.length === 0) {
            console.log('Todas as perguntas foram respondidas. Redirecionando para o resultado.');
            return res.redirect('/jogar/resultado');
        }

        // Buscar a próxima pergunta
        const perguntaID = perguntas[0]; // Próximo ID
        const rows = await sequelize.query(`
            SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                   r.id AS resposta_id, r.texto AS resposta_texto
            FROM perguntas p
            LEFT JOIN respostas r ON p.id = r.pergunta_id
            WHERE p.id = ?
        `, {
            replacements: [perguntaID],
            type: sequelize.QueryTypes.SELECT
        });

        // Verifica se a consulta retornou dados
        if (!rows || rows.length === 0) {
            console.error(`Nenhuma pergunta encontrada para o ID ${perguntaID}.`);
            return res.status(404).send('Nenhuma pergunta encontrada.');
        }

        // Montar a próxima pergunta
        const pergunta = {
            id: rows[0].pergunta_id, // ID da pergunta
            texto: rows[0].pergunta_texto, // Texto da pergunta
            respostas: rows.map(row => ({
                id: row.resposta_id,
                texto: row.resposta_texto
            })).filter(resposta => resposta.id) // Filtrar respostas válidas
        };

        console.log('Próxima pergunta carregada:', pergunta);

        res.render('pages/gabhoot', { pergunta });
    } catch (error) {
        console.error('Erro ao carregar a próxima pergunta:', error);
        res.status(500).send('Erro ao continuar o jogo.');
    }
});



router.get('/resultado', isAuthenticated, (req, res) => {
    const respostas = req.session.respostas || [];

    // Limpar a sessão
    req.session.perguntas = null;
    req.session.respostas = null;

    // Calcular acertos
    const acertos = respostas.filter(r => parseInt(r.resposta_id, 10) === parseInt(r.correta, 10)).length;

    console.log('Respostas registradas:', respostas);
    console.log('Total de acertos:', acertos);

    // Renderizar a página de resultado
    res.render('pages/resultado', { 
        total: respostas.length, // Total de perguntas respondidas
        acertos                   // Total de acertos
    });
});

module.exports = router;