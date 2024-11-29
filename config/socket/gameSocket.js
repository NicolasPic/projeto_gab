const salas = {};  // Armazena as salas ativas

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        // Receber o nome do jogador assim que se conectar
        socket.on('nomeJogador', (nomeJogador) => {
            if (nomeJogador && nomeJogador !== "undefined") {
                socket.nomeJogador = nomeJogador;
                console.log(`Jogador ${nomeJogador} conectado com id: ${socket.id}`);
            } else {
                console.log('Erro: Nome de jogador não fornecido');
                socket.emit('erro', 'Nome do jogador não fornecido');
                socket.disconnect();  // Desconectar o jogador se o nome não for fornecido
            }
        });

        // Criar uma nova sala
        socket.on('criarSala', (codigoSala) => {
            console.log(`Tentando criar sala: ${codigoSala} por ${socket.nomeJogador}`);

            // Verifique se o nome está atribuído antes de permitir criar uma sala
            if (!socket.nomeJogador) {
                socket.emit('erro', 'Nome do jogador não definido');
                return;
            }

            if (!salas[codigoSala]) {
                salas[codigoSala] = { jogadores: [{ id: socket.id, nome: socket.nomeJogador }], estado: 'esperando' };
                socket.emit('salaCriada', codigoSala);  // Notifica o cliente da criação
                console.log(`Sala ${codigoSala} criada por ${socket.nomeJogador}`);
                console.log(`Jogadores na sala ${codigoSala}:`, salas[codigoSala].jogadores);
            } else {
                socket.emit('erro', 'Sala já existe');
                console.log(`Erro: Sala ${codigoSala} já existe`);
            }
        });

        // Entrar em uma sala existente
        socket.on('entrarSala', (codigoSala) => {
            console.log(`Tentando entrar na sala: ${codigoSala} com jogador ${socket.nomeJogador}`);

            // Verifique se o nome está atribuído antes de permitir entrar na sala
            if (!socket.nomeJogador) {
                socket.emit('erro', 'Nome do jogador não definido');
                return;
            }

            if (salas[codigoSala]) {
                salas[codigoSala].jogadores.push({ id: socket.id, nome: socket.nomeJogador });
                socket.join(codigoSala);
                io.to(codigoSala).emit('atualizarJogadores', salas[codigoSala].jogadores);  // Atualiza a lista de jogadores
                console.log(`${socket.nomeJogador} entrou na sala ${codigoSala}`);
                console.log(`Jogadores na sala ${codigoSala}:`, salas[codigoSala].jogadores);
            } else {
                socket.emit('erro', 'Sala não encontrada');
                console.log(`Erro: Sala ${codigoSala} não encontrada`);
            }
        });

        // Quando o jogador desconecta
        socket.on('disconnect', () => {
            console.log(`Jogador ${socket.id} desconectado. Nome: ${socket.nomeJogador}`);

            // Remover o jogador da sala (se estiver em uma sala)
            for (let codigoSala in salas) {
                salas[codigoSala].jogadores = salas[codigoSala].jogadores.filter(jogador => jogador.id !== socket.id);
                io.to(codigoSala).emit('atualizarJogadores', salas[codigoSala].jogadores);  // Atualiza a lista de jogadores
                console.log(`Jogadores restantes na sala ${codigoSala}:`, salas[codigoSala].jogadores);
            }
        });
    });
}

module.exports = configurarSocket;
