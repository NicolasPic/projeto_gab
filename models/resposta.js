const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/DB/database');
const Pergunta = require('./pergunta'); 

// Definindo o modelo de Resposta
const Resposta = sequelize.define('Resposta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  pergunta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Pergunta,
      key: 'id', 
    },
  },
  texto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  correta: {
    type: DataTypes.TINYINT(1), // Usando tinyint(1) para representar verdadeiro/falso
    allowNull: false,
  },
}, {
  tableName: 'respostas', // Nome da tabela no banco
  timestamps: false, // Não queremos os campos 'createdAt' e 'updatedAt'
});

// Definindo a relação entre Pergunta e Resposta
Pergunta.hasMany(Resposta, { foreignKey: 'pergunta_id' });
Resposta.belongsTo(Pergunta, { foreignKey: 'pergunta_id' });

module.exports = Resposta;
