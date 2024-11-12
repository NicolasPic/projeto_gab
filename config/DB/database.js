const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('mysql://user:password@localhost:3306/nome_do_banco', {
  dialect: 'mysql',
  logging: false, // Desativa os logs de queries
});

async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados com sucesso!');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
    process.exit(1); // Para o servidor em caso de falha na conexão com o banco
  }
}

module.exports = { sequelize, conectarDB };
