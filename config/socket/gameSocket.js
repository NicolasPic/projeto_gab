const salas = {};
const usuarios = {};

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

        socket.on('redirecionarSala', ({ codigoSala }) => {
            if (salas[codigoSala]) {
                const url = `/jogar/gabhoot`;
                console.log(`Redirecionando jogadores da sala ${codigoSala}`);
                io.to(codigoSala).emit('redirect',url);
            } else {
                console.log(`Sala ${codigoSala} não encontrada para redirecionamento.`);
            }
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
