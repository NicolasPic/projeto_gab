const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Usuario = require('../../models/usuario');

module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

module.exports.setupPassport = function(passport){
    passport.use(new localStrategy({ usernameField: 'username' }, (username, senha, done) => {
        Usuario.findOne({ where: { username: username } }).then((usuario) => {
            if (!usuario) {
                return done(null, false, { message: "Esta conta não existe" });
            }

            bcrypt.compare(senha, usuario.senha, (erro, igual) => {
                if (erro) {
                    return done(erro);
                }

                if (igual) {
                    return done(null, usuario);
                } else {
                    return done(null, false, { message: "Senha incorreta" });
                }
            });
        }).catch((err) => {
            return done(err);
        });
    }));

    passport.serializeUser((usuario, done) => {
        done(null, usuario.id);
    });

    passport.deserializeUser((id, done) => {
        Usuario.findByPk(id).then((usuario) => {
            done(null, usuario);
        }).catch((err) => {
            done(err, null);
        });
    });
};
