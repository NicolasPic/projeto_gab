const salas = {};
const usuarios = {};
const { sequelize } = require("../DB/database");

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        socket.on('reconectar', ({ usuarioID }) => {
            if (usuarios[usuarioID]) {
                const codigoSala = Object.keys(salas).find((codigo) =>
                    Object.keys(salas[codigo].jogadores).includes(usuarioID)
                );
        
                if (codigoSala) {
                    usuarios[usuarioID] = socket.id; 
                    socket.join(codigoSala);
        
                    salas[codigoSala].jogadores[usuarioID].desconectado = false;
                    console.log(`Jogador ${usuarioID} marcado como conectado na sala ${codigoSala}.`);
                    console.log(`Jogador ${usuarioID} reconectado à sala ${codigoSala}.`);
        
                    const jogadoresFaltantes = Object.values(salas[codigoSala].jogadores).filter(
                        (jogador) => !jogador.respondeuTodas
                    ).length;
        
                    socket.emit('jogadoresFaltantes', { faltando: jogadoresFaltantes });
                    io.to(codigoSala).emit('jogadoresFaltantes', { faltando: jogadoresFaltantes });
        
                    socket.emit('reconectado', { codigoSala, sucesso: true });
                } else {
                    console.log(`Jogador ${usuarioID} não pertence a nenhuma sala.`);
                }
            } else {
                console.log(`Nenhuma conexão anterior encontrada para ${usuarioID}.`);
            }
        });
        

        socket.on('redirecionarSala', async ({ codigoSala, usuarioID, quizId }) => {
            try {
                if (!salas[codigoSala]) {
                    console.error(`Sala ${codigoSala} não encontrada.`);
                    return;
                }

                const rows = await sequelize.query(
                    `SELECT p.id AS pergunta_id, p.texto AS pergunta_texto, 
                    r.id AS resposta_id, r.texto AS resposta_texto, r.correta AS resposta_correta
                    FROM perguntas p
                    LEFT JOIN respostas r ON p.id = r.pergunta_id
                    WHERE p.quiz_id = :quizId`,
                    {
                        replacements: { quizId },
                        type: sequelize.QueryTypes.SELECT
                    }
                );

                if (!rows || rows.length === 0) {
                    console.error(`Nenhuma pergunta encontrada para o quiz ${quizId}.`);
                    return;
                }

                const perguntasMap = new Map();

                rows.forEach(row => {
                    if (!perguntasMap.has(row.pergunta_id)) {
                        perguntasMap.set(row.pergunta_id, {
                            id: row.pergunta_id,
                            texto: row.pergunta_texto,
                            respostas: []
                        });
                    }

                    const pergunta = perguntasMap.get(row.pergunta_id);
                    pergunta.respostas.push({
                        id: row.resposta_id,
                        texto: row.resposta_texto,
                        correta: row.resposta_correta 
                    });
                });

                const perguntas = Array.from(perguntasMap.values());

                Object.keys(salas[codigoSala].jogadores).forEach(usuarioID => {
                    salas[codigoSala].jogadores[usuarioID].perguntas = [...perguntas];
                    salas[codigoSala].jogadores[usuarioID].perguntaAtual = perguntas[0];
                    salas[codigoSala].jogadores[usuarioID].respondeuTodas = false;
                    salas[codigoSala].jogadores[usuarioID].pontuacaoTotal = 0;
                });
                salas[codigoSala].status = "emPartida";

                const url = `/jogar/gabhoot`;
                io.to(codigoSala).emit('redirect', url);
            } catch (error) {
                console.error('Erro ao redirecionar sala:', error);
            }
        });

        socket.on('sala', ({ codigoSala, usuarioID }) => {
            if (salas[codigoSala]) {
                console.log(`Tentativa de criar sala ${codigoSala}, mas ela já existe.`);
                socket.emit('salaErro', { mensagem: 'A sala já existe.' });
            } else {
                salas[codigoSala] = {
                    admin: usuarioID,
                    jogadores: {
                        [usuarioID]: {
                            perguntas: [],
                            perguntaAtual: null,
                            respostasJogadores: {}
                        }
                    }
                };

                usuarios[usuarioID] = socket.id;
                socket.join(codigoSala);

                console.log(`Sala ${codigoSala} criada com admin ${usuarioID}.`);
                socket.emit('salaCriadaOuEntrou', { codigoSala, sucesso: true });
            }
        });

        socket.on('entrarSala', ({ codigoSala, usuarioID }) => {
            if (salas[codigoSala]) {
                if(salas[codigoSala].status == 'emPartida') {
                    console.log(`Tentativa de entrar na sala ${codigoSala}, mas ela esta em partida.`);
                    socket.emit('salaErro', { mensagem: 'A sala esta em partida.' });
                } else {
                    salas[codigoSala].jogadores[usuarioID] = {
                        perguntas: [],
                        perguntaAtual: null,
                        respostasJogadores: {}
                    };
    
                    usuarios[usuarioID] = socket.id;
                    socket.join(codigoSala);
    
                    console.log(`Usuário ${usuarioID} entrou na sala ${codigoSala}.`);
                    socket.emit('salaCriadaOuEntrou', { codigoSala, sucesso: true });
                }
               
            } else {
                console.log(`Tentativa de entrar na sala ${codigoSala}, mas ela não existe.`);
                socket.emit('salaErro', { mensagem: 'A sala não existe.' });
            }
        });

        socket.on('quemrespondeu', ({ codigoSala, usuarioID }) => {
            if (!salas[codigoSala]) {
                console.error(`Sala ${codigoSala} não encontrada.`);
                return;
            }

            if (salas[codigoSala].jogadores[usuarioID]) {
                salas[codigoSala].jogadores[usuarioID].respondeuTodas = true;
                console.log(`Jogador ${usuarioID} marcou como respondeu todas as perguntas na sala ${codigoSala}.`);
            }

            const jogadoresTotal = Object.keys(salas[codigoSala].jogadores).length;
            const jogadoresFaltantes = Object.values(salas[codigoSala].jogadores).filter(
                (jogador) => !jogador.respondeuTodas
            ).length;
        
            const etapaAtual = jogadoresTotal - jogadoresFaltantes;
        
            io.to(codigoSala).emit('progressoJogadores', {
                atual: etapaAtual,
                total: jogadoresTotal,
            });
        
            if (jogadoresFaltantes === 0) {
                console.log(`Todos os jogadores da sala ${codigoSala} completaram suas respostas.`);
                setTimeout(() => {
                    io.to(codigoSala).emit('redirect', `/jogar/resultado`);
                    salas[codigoSala].status = "acabou";
                }, 1000);
            } else {
                console.log(`Aguardando jogadores na sala ${codigoSala}: ${jogadoresFaltantes} restantes.`);
            }
        });

        socket.on('sairSala', ({ codigoSala, usuarioID }) => {
            if (salas[codigoSala] && salas[codigoSala].jogadores[usuarioID]) {
                const sala = salas[codigoSala];
                const isAdmin = sala.admin === usuarioID;
                delete sala.jogadores[usuarioID];
                console.log(`Usuário ${usuarioID} removido da sala ${codigoSala}`);

                if (Object.keys(sala.jogadores).length === 0) {
                    delete salas[codigoSala];
                    console.log(`Sala ${codigoSala} foi removida pois está vazia.`);
                } else if (isAdmin) {
                    const novoAdmin = Object.keys(sala.jogadores)[0];
                    sala.admin = novoAdmin;
                    console.log(`Admin da sala ${codigoSala} transferido para o jogador ${novoAdmin}`);
                    io.to(codigoSala).emit('novoAdmin', { novoAdmin });
                }
                socket.leave(codigoSala);
                console.log(`Estado atual da sala ${codigoSala}:`, salas[codigoSala]);
            } else {
                console.log(`Usuário ${usuarioID} não encontrado na sala ${codigoSala}.`);
            }
        });

        socket.on('resetarSala', ({ codigoSala, usuarioID }) => {
            console.log(`Reset solicitado pelo usuário ${usuarioID} na sala ${codigoSala}`);
            io.to(codigoSala).emit('resetarSession');

            io.to(codigoSala).emit('redirect', `/jogar/sala/${codigoSala}`);
        });

        const TIMEOUT_RECONNECT = 10000;

        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} desconectado.`);
            
            const usuarioID = Object.keys(usuarios).find(id => usuarios[id] === socket.id);

            if (usuarioID) {
                const codigoSala = Object.keys(salas).find((codigo) =>
                    Object.keys(salas[codigo].jogadores).includes(usuarioID)
                );

                if (codigoSala) {
                    salas[codigoSala].jogadores[usuarioID].desconectado = true;
                    console.log(`Jogador ${usuarioID} marcado como desconectado na sala ${codigoSala}.`);

                    setTimeout(() => {
                        const salaAtual = salas[codigoSala];
                        const jogadorAtual = salaAtual?.jogadores[usuarioID];
                    
                        if (salaAtual && jogadorAtual?.desconectado) {
                            console.log(`Timeout expirado para reconexão do jogador ${usuarioID} na sala ${codigoSala}.`);
                    
                            delete salaAtual.jogadores[usuarioID];
                            console.log(`Jogador ${usuarioID} removido da sala ${codigoSala}.`);
                    
                            const jogadoresFaltantes = Object.values(salaAtual.jogadores).filter(
                                (jogador) => !jogador.respondeuTodas && !jogador.desconectado
                            ).length;
                    
                            if (Object.keys(salaAtual.jogadores).length === 0 || jogadoresFaltantes === 0) {
                                console.log(`Todos os jogadores da sala ${codigoSala} completaram suas respostas ou saíram.`);
                                io.to(codigoSala).emit('redirect', `/jogar/resultado`);
                                salas[codigoSala].status = "acabou";
                            } else {
                                io.to(codigoSala).emit('jogadoresFaltantes', { faltando: jogadoresFaltantes });
                            }
                    
                            if (Object.values(salaAtual.jogadores).every(j => j.desconectado)) {
                                delete salas[codigoSala];
                                console.log(`Sala ${codigoSala} removida por todos os jogadores estarem desconectados.`);
                            }
                    
                            io.to(codigoSala).emit('jogadorDesconectado', { usuarioID });
                        }
                    }, TIMEOUT_RECONNECT);
                
            }
        }

        console.log('Estado atual das salas após desconexão:', salas);
        });

    });
}

module.exports = { configurarSocket, salas, usuarios };
