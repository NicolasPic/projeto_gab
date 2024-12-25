const bcrypt = require("bcryptjs");
const Usuario = require('../../models/usuario');
require('dotenv').config();

async function criarUsuarioAdmin() {
    try {
        const usuarioAdmin = await Usuario.findOne({ where: { username: process.env.ADMIN_USERNAME } });

        if (!usuarioAdmin) {
            const senhaCriptografada = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

            await Usuario.create({
                nome: process.env.ADMIN_NAME,
                username: process.env.ADMIN_USERNAME,
                senha: senhaCriptografada,
                email: process.env.ADMIN_EMAIL,
                isAdmin: true,
            });

            console.log("Usuário admin criado com sucesso.");
        } else {
            console.log("Usuário admin já existe.");
        }
    } catch (erro) {
        console.error("Erro ao verificar ou criar o usuário admin:", erro);
    }
}

module.exports = criarUsuarioAdmin;