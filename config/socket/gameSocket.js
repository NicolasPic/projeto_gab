const salas = {};  // Armazena as salas ativas
const usuarios = {};

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        socket.on('sala', ({codigoSala, usuarioID}) => {
            usuarios[socket.id] = usuarioID;

            // Verifica se a sala já existe
            if (salas[codigoSala]) {
                // Verifica se o jogador já está na sala
                if (salas[codigoSala].includes(socket.id)) {
                    console.log(`Jogador ${socket.id} já está na sala ${codigoSala}.`);
                } else {
                    // O jogador não está na sala, então ele entra nela
                    console.log(`Jogador ${socket.id} se conectando à sala ${codigoSala}.`);
                    socket.join(codigoSala);
                    salas[codigoSala].push(socket.id);

                    // Salva os dados na sessão
                    socket.handshake.session.sala = codigoSala;
                    socket.handshake.session.usuarioID = usuarioID;
                    socket.handshake.session.save();

                }
            } else {
                // A sala não existe, cria uma nova
                console.log(`Criando sala com id: ${codigoSala}.`);
                socket.join(codigoSala);
                salas[codigoSala] = salas[codigoSala] || [];
                salas[codigoSala].push(socket.id);

                // Atualiza a sessão com o código da sala
                socket.handshake.session.sala = codigoSala;
                socket.handshake.session.usuarioID = usuarioID;
                socket.handshake.session.save();

                console.log(`Sala ${codigoSala} criada e jogador ${socket.id} entrou.`);
            }
        });

        socket.on('disconnect', function(){
            console.log('usuario ' + socket.id + 'disconectado');
        });

    });
}

module.exports = configurarSocket;
