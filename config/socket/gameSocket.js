const salas = {};  // Armazena as salas ativas
const usuarios = {};
function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        socket.on('sala', ({codigoSala,usuarioID}) => {
            // Verifica se o jogador já está na sala

            usuarios[socket.id] = usuarioID;
            if (salas[codigoSala] && salas[codigoSala].includes(socket.id)) {
                console.log(`Jogador ${socket.id} já está na sala ${codigoSala}.`);

            } else if (salas[codigoSala]) {
                // A sala existe, mas o jogador não está nela
                console.log(`Jogador ${socket.id} se conectando à sala ${codigoSala}.`);
                socket.join(codigoSala);
                salas[codigoSala].push(socket.id);

                socket.handshake.session.sala = codigoSala;
                socket.handshake.session.save();
            } else {
                // A sala não existe, cria uma nova
                console.log(`Criando sala com id: ${codigoSala}.`);
                socket.join(codigoSala);
                salas[codigoSala] = salas[codigoSala] || [];
                salas[codigoSala].push(socket.id);

                // Atualiza a sessão com o código da sala
                socket.handshake.session.sala = codigoSala;
                socket.handshake.session.save();
                console.log(`Sala ${codigoSala} criada e jogador ${socket.id} entrou.`);
            }

        });

        socket.on('disconnect', function(){
            console.log('user ' + usuarios[socket.id] + ' disconnected');
            // remove saved socket from users object
            delete usuarios[socket.id];
          });

    });
}

module.exports = configurarSocket;
