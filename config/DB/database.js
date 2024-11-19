require('dotenv').config();

const { Sequelize } = require('sequelize'); 

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false,  // Desativa o log do SQL
});

async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  }
}

module.exports = { sequelize, conectarDB };