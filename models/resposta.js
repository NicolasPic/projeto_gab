const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/DB/database');

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
  },
  texto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  correta: {
    type: DataTypes.TINYINT(1),
    allowNull: false,
  },
}, {
  tableName: 'respostas',
  timestamps: false,
});

module.exports = Resposta;
