const salas = {};
const usuarios = {};
const { sequelize } = require("../DB/database");

function getRandomUniqueNumbers(min, max, count) {
    const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min); 
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    return numbers.slice(0, count); 
}

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        socket.on('reconectar', ({usuarioID}) => {
            if (usuarios[usuarioID]) {
                const codigoSala = Object.keys(salas).find((codigo) =>
                    salas[codigo].includes(usuarioID)
                );

                if (codigoSala) {
                    usuarios[usuarioID] = socket.id;
                    socket.join(codigoSala);

                    console.log(
                        `Jogador ${usuarioID} reconectado à sala ${codigoSala}.`
                    );
                    socket.emit('reconectado', {
                        codigoSala,
                        sucesso: true,
                    });
                } else {
                    console.log(`Jogador ${usuarioID} não pertence a nenhuma sala.`);
                }
            } else {
                console.log(`Nenhuma conexão anterior encontrada para ${usuarioID}.`);
            }
        });

        socket.on('redirecionarSala', async ({ codigoSala }) => {
            const randomIDs = getRandomUniqueNumbers(1, 20, 10);
            console.log('IDs gerados:', randomIDs);
        
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
                return;
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
        
            // Armazene a pergunta na sala
            if (salas[codigoSala]) {
                salas[codigoSala].perguntas = randomIDs;
                salas[codigoSala].perguntaAtual = pergunta;
            }
        
            console.log('Pergunta configurada para a sala:', pergunta);
        
            // Redireciona todos os jogadores
            const url = `/jogar/gabhoot`;
            io.to(codigoSala).emit('redirect', url);
        });

        socket.on('sala', ({ codigoSala, usuarioID }) => {
            usuarios[usuarioID] = socket.id;

            if (salas[codigoSala]) {
                if (!salas[codigoSala].includes(usuarioID)) {
                    salas[codigoSala].push(usuarioID);
                }
            } else {
                salas[codigoSala] = [usuarioID];
            }

            socket.join(codigoSala);

            console.log(`Estado atual da sala ${codigoSala}:`, salas[codigoSala]);
            socket.emit('salaCriadaOuEntrou', { codigoSala, sucesso: true });
        });
        
        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} desconectado.`);
            console.log('Estado atual das salas após desconexão:', salas);
        });

    });
}

module.exports = { configurarSocket, salas, usuarios };
