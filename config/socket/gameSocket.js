const salas = {};  // Armazena as salas ativas

// Função que configura as interações do Socket.IO
function configurarSocket(io) {
    // Quando um jogador se conecta
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        // Criar uma nova sala
        socket.on('criarSala', (codigoSala) => {
            if (!salas[codigoSala]) {
                salas[codigoSala] = { jogadores: [socket.id], estado: 'esperando' };
                socket.emit('salaCriada', codigoSala);  // Envia o código da sala para o criador
                console.log(`Sala ${codigoSala} criada`);
            } else {
                socket.emit('erro', 'Sala já existe');
            }
        });

        // Jogador entra em uma sala
        socket.on('entrarSala', (codigoSala) => {
            if (salas[codigoSala]) {
                salas[codigoSala].jogadores.push(socket.id);  // Adiciona o jogador à sala
                socket.emit('salaEntrou', salas[codigoSala]);  // Envia os dados da sala para o jogador
                console.log(`Jogador entrou na sala ${codigoSala}`);
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
            console.log(`Jogador desconectado ${socket.id}`);
            // Se necessário, aqui você pode remover o jogador da sala
        });
    });
}

// Exporta a função para ser usada no servidor
module.exports = configurarSocket;