const salas = {};  // Armazena as salas ativas

function configurarSocket(io) {
    io.on('connection', (socket) => {
        console.log('Novo jogador conectado:', socket.id);

        socket.on('nomeJogador', (nomeJogador) => {
            // Aqui você pode armazenar o nome do jogador se necessário
        });

        socket.on('criarSala', (codigoSala) => {
            // Verifica se o jogador já está na sala
            if (salas[codigoSala] && salas[codigoSala].includes(socket.id)) {
                console.log(`Jogador ${socket.id} já está na sala ${codigoSala}.`);
            } else if (salas[codigoSala]) {
                // A sala existe, mas o jogador não está nela
                console.log(`Jogador ${socket.id} se conectando à sala ${codigoSala}.`);
                socket.join(codigoSala);  // Adiciona o jogador na sala
                salas[codigoSala].push(socket.id); // Adiciona o socket.id ao array de jogadores da sala

                // Atualiza a sessão com o código da sala
                socket.handshake.session.sala = codigoSala;  // Atualiza a sessão com a sala
                socket.handshake.session.save(); // Salva a sessão
            } else {
                // A sala não existe, cria uma nova
                console.log(`Criando sala com id: ${codigoSala}.`);
                salas[codigoSala] = [socket.id]; // Cria a sala e adiciona o primeiro jogador
                socket.join(codigoSala); 
                salas[codigoSala].push(socket.id);

                // Atualiza a sessão com o código da sala
                socket.handshake.session.sala = codigoSala; 
                socket.handshake.session.save(); 
                console.log(`Sala ${codigoSala} criada e jogador ${socket.id} entrou.`);
            }

            // Printando a sala da sessão
            console.log(`A sala na sessão de ${socket.id} é: ${socket.handshake.session.sala}`);
            console.log(`Sala ${codigoSala} criada e jogador ${socket.id} entrou.`);
        });

        socket.on('entrarSala', (codigoSala) => {
            if (salas[codigoSala] && salas[codigoSala].includes(socket.id)) {
                console.log(`Jogador ${socket.id} já está na sala ${codigoSala}.`);
            } else if (salas[codigoSala]) {
                // A sala existe, mas o jogador não está nela
                console.log(`Jogador ${socket.id} se conectando à sala ${codigoSala}.`);
                socket.join(codigoSala);  // Adiciona o jogador na sala
                salas[codigoSala].push(socket.id); 

                // Atualiza a sessão com o código da sala
                socket.handshake.session.sala = codigoSala; 
                socket.handshake.session.save(); 
            } else {
                console.log(`Sala com id: ${codigoSala} não existe.`);
            }
        });

        socket.on('disconnect', () => {
            const sala = socket.handshake.session.sala;  // Recupera a sala do jogador
            if (sala) {
                // Remove o jogador da sala
                const index = salas[sala].indexOf(socket.id);
                if (index !== -1) {
                    salas[sala].splice(index, 1);  // Remove o jogador da lista de jogadores da sala
                    console.log(`Jogador ${socket.id} saiu da sala ${sala}.`);

                    // Se não houver mais jogadores na sala, apaga a sala
                    if (salas[sala].length === 0) {
                        delete salas[sala];  // Deleta a sala, pois não há mais jogadores
                        console.log(`Sala ${sala} deletada, pois não há mais jogadores.`);
                    }
                }

                // Verifica se a sessão ainda está válida e limpa a sala da sessão
                if (socket.handshake.session) {
                    socket.handshake.session.sala = null;
                    socket.handshake.session.save();  // Salva as alterações na sessão
                }
            }
        });
        
    });
}

module.exports = configurarSocket;
