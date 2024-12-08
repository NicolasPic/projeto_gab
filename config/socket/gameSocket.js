const salas = {};
const usuarios = {};

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        socket.on('reconectar', ({ usuarioID }) => {
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

            for (const usuarioID in usuarios) {
                if (usuarios[usuarioID] === socket.id) {
                    usuarios[usuarioID] = null;
                }
            }

            console.log('Estado atual das salas após desconexão:', salas);
        });

    });
}

module.exports = { configurarSocket, salas, usuarios };
