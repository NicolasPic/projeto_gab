const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');
const { Quiz, Pergunta, Resposta, Usuario } = require('../models/relacionamentos');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const usuarioID = req.user.id;
        const isAdmin = req.user.isAdmin;
        const nomeUsuario = req.user.nome;

        const quizzes = await Quiz.findAll({
            where: isAdmin ? {} : { autor_id: usuarioID },
            include: [{ model: Usuario, as: 'Usuario', attributes: ['nome'] }] 
        });

        const quizzesFormatados = quizzes.map(quiz => ({
            id: quiz.id,
            nome: quiz.nome,
            autor: quiz.Usuario ? quiz.Usuario.nome : 'Desconhecido'
        }));

        res.render('pages/admin', {
            title: 'Página admin',
            customHeaderHome: true,
            nomeJogador: nomeUsuario,
            usuarioID: usuarioID,
            isAdmin: isAdmin,
            quizzes: quizzesFormatados
        });
    } catch (error) {
        console.error("Erro ao carregar os quizzes:", error);
        res.status(500).render('pages/admin', {
            title: 'Página admin',
            customHeaderHome: true,
            nomeJogador: req.user.nome,
            usuarioID: req.user.id,
            isAdmin: req.user.isAdmin,
            quizzes: [],
            error: "Erro ao carregar os quizzes."
        });
    }
});

router.delete('/excluir-quiz/:id', isAuthenticated, async (req, res) => {
    try {
        const quizId = req.params.id;
        const usuarioID = req.user.id;
        const isAdmin = req.user.isAdmin;
        const quiz = await Quiz.findByPk(quizId);

        if (!quiz) {
            return res.status(404).send('Quiz não encontrado.');
        }
        if (!isAdmin && quiz.autor_id !== usuarioID) {
            return res.status(403).send('Você não tem permissão para excluir este quiz.');
        }
        await quiz.destroy();
        res.status(200).send('Quiz excluído com sucesso.');
    } catch (error) {
        console.error("Erro ao excluir quiz:", error);
        res.status(500).send('Erro ao excluir quiz.');
    }
});

router.get('/editar-quiz/:id', isAuthenticated, async (req, res) => {
    try {
        const quizId = req.params.id;
        const usuarioID = req.user.id;
        const isAdmin = req.user.isAdmin;
        const context = req.query.context;
        const codigoSala = req.query.codigoSala;

        const quiz = await Quiz.findByPk(quizId, {
            include: [
                {
                    model: Pergunta,
                    as: 'Perguntas',
                    include: [
                        {
                            model: Resposta,
                            as: 'Respostas',
                        }
                    ]
                }
            ]
        });

        if (!quiz) {
            return res.status(404).send('Quiz não encontrado.');
        }
        if (!isAdmin && quiz.autor_id !== usuarioID) {
            return res.status(403).send('Você não tem permissão para editar este quiz.');
        }

        const quizFormatado = {
            id: quiz.id,
            nome: quiz.nome,
            perguntas: quiz.Perguntas.map(pergunta => ({
                id: pergunta.id,
                texto: pergunta.texto,
                tipo: pergunta.tipo,
                respostas: pergunta.Respostas.map(resposta => ({
                    id: resposta.id,
                    texto: resposta.texto,
                    correta: resposta.correta
                }))
            }))
        };
        
        console.log(quizFormatado);

        let voltarUrl = '/admin';
        if (context === 'sala' && codigoSala) {
            voltarUrl = `/jogar/sala/${codigoSala}`;
        }

        res.render('pages/editarQuiz', {
            title: 'Editar Quiz',
            quiz: quizFormatado,
            voltarUrl: voltarUrl,
            customHeaderHome: true
        });

    } catch (error) {
        console.error("Erro ao carregar quiz para edição:", error);
        res.status(500).send('Erro ao carregar quiz para edição.');
    }
});

router.put('/editar-quiz/:id', isAuthenticated, async (req, res) => {
    try {
        const quizId = req.params.id;
        const usuarioID = req.user.id;
        const isAdmin = req.user.isAdmin;
        const { nome, perguntas } = req.body;
        const quiz = await Quiz.findByPk(quizId);

        if (!quiz) {
            return res.status(404).send('Quiz não encontrado.');
        }
        if (!isAdmin && quiz.autor_id !== usuarioID) {
            return res.status(403).send('Você não tem permissão para editar este quiz.');
        }

        quiz.nome = nome;
        await quiz.save();

        for (const pergunta of perguntas) {
            let perguntaDb = await Pergunta.findByPk(pergunta.id);
            if (perguntaDb) {
                perguntaDb.texto = pergunta.texto;
                perguntaDb.tipo = pergunta.tipo;
                await perguntaDb.save();
            } else {
                perguntaDb = await Pergunta.create({
                    texto: pergunta.texto,
                    tipo: pergunta.tipo,
                    quiz_id: quizId
                });
            }

            for (const resposta of pergunta.respostas) {
                let respostaDb = await Resposta.findByPk(resposta.id);
                if (respostaDb) {
                    respostaDb.texto = resposta.texto;
                    respostaDb.correta = resposta.correta;
                    await respostaDb.save();
                } else {
                    await Resposta.create({
                        texto: resposta.texto,
                        correta: resposta.correta,
                        pergunta_id: perguntaDb.id
                    });
                }
            }
        }

        res.status(200).send('Quiz atualizado com sucesso.');
    } catch (error) {
        console.error("Erro ao salvar alterações no quiz:", error);
        res.status(500).send('Erro ao salvar alterações no quiz.');
    }
});


module.exports = router;