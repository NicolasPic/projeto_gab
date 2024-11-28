const salas = {};  // Armazena as salas ativas

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        // Receber o nome do jogador assim que se conectar
        socket.on('nomeJogador', (nomeJogador) => {
            if (nomeJogador) {
                socket.nomeJogador = nomeJogador;
                console.log(`Jogador ${nomeJogador} conectado com id: ${socket.id}`);
            } else {
                console.log('Erro: Nome de jogador não fornecido');
            }
        });

        // Criar uma nova sala
        socket.on('criarSala', (codigoSala) => {
            if (!salas[codigoSala]) {
                salas[codigoSala] = { jogadores: [{ id: socket.id, nome: socket.nomeJogador }], estado: 'esperando' };
                socket.emit('salaCriada', codigoSala);  // Notifica o cliente da criação
                console.log(`Sala ${codigoSala} criada por ${socket.nomeJogador}`);
            } else {
                socket.emit('erro', 'Sala já existe');
            }
        });

        // Entrar em uma sala existente
        socket.on('entrarSala', (codigoSala) => {
            if (salas[codigoSala]) {
                salas[codigoSala].jogadores.push({ id: socket.id, nome: socket.nomeJogador });
                socket.join(codigoSala);
                io.to(codigoSala).emit('atualizarJogadores', salas[codigoSala].jogadores);  // Atualiza a lista de jogadores
                io.to(codigoSala).emit('renderizarSala', {
                    codigoSala: codigoSala,
                    jogadores: salas[codigoSala].jogadores
                });
                console.log(`${socket.nomeJogador} entrou na sala ${codigoSala}`);
            } else {
                socket.emit('erro', 'Sala não encontrada');
            }
        });

        // Iniciar o jogo
        socket.on('iniciarJogo', (codigoSala) => {
            const sala = salas[codigoSala];
            if (sala) {
                sala.estado = 'iniciado';  // Atualiza o estado da sala
                io.to(codigoSala).emit('iniciarJogo');  // Inicia o jogo na sala
                console.log(`Jogo iniciado na sala ${codigoSala}`);
            }
        });

        // Quando o jogador desconecta
        socket.on('disconnect', () => {
            // Remover o jogador da sala (se estiver em uma sala)
            for (let codigoSala in salas) {
                salas[codigoSala].jogadores = salas[codigoSala].jogadores.filter(jogador => jogador.id !== socket.id);
                io.to(codigoSala).emit('atualizarJogadores', salas[codigoSala].jogadores);  // Atualiza a lista de jogadores
            }
            console.log(`Jogador desconectado ${socket.id}`);
        });
    });
}

// Exporta a função para ser usada no servidor
module.exports = configurarSocket;
