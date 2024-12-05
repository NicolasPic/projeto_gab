require('dotenv').config();

const { Sequelize } = require('sequelize'); 

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: false,
});

async function conectarDB() {
  try {
    await sequelize.authenticate();
    console.log('Conectado ao banco de dados com sucesso!');
    
    // Sincroniza as tabelas com o banco de dados
    await sequelize.sync({ alter: false });
    console.log('Tabelas sincronizadas com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ou sincronizar o banco de dados:', error);
    process.exit(1);
  }
}

module.exports = { sequelize, conectarDB };