const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Usuario = require('../../models/usuario');

module.exports = function(passport){

    // Definindo a estratégia local de login
    passport.use(new localStrategy({usernameField: 'cpf'}, (cpf, senha, done) => {
        // Buscando o usuário no banco
        Usuario.findOne({ where: { cpf: cpf } }).then((usuario) => {
            // Verificando se o usuário existe
            if (!usuario) {
                return done(null, false, { message: "Esta conta não existe" });
            }

            // Comparando a senha informada com a senha armazenada
            bcrypt.compare(senha, usuario.senha, (erro, igual) => {
                if (erro) {
                    return done(erro);  // Caso haja erro no processo de comparação
                }

                if (igual) {
                    return done(null, usuario);  // Login bem-sucedido
                } else {
                    return done(null, false, { message: "Senha incorreta" });
                }
            });
        }).catch((err) => {
            return done(err);  // Erro no banco de dados
        });
    }));

    // Serializando o usuário
    passport.serializeUser((usuario, done) => {
        done(null, usuario.id);  // Armazenando o ID do usuário na sessão
    });

    // Desserializando o usuário
    passport.deserializeUser((id, done) => {
        // Buscando o usuário pelo ID (usando findByPk, não findById)
        Usuario.findByPk(id).then((usuario) => {
            done(null, usuario);  // Retornando o usuário encontrado
        }).catch((err) => {
            done(err, null);  // Caso ocorra erro, retornamos o erro
        });
    });
};
