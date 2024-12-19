const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/DB/database');

const Pergunta = sequelize.define('Pergunta', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  texto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('multipla', 'vf'),
    allowNull: false,
  },
  quiz_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'perguntas',
  timestamps: false,
});

module.exports = Pergunta;
