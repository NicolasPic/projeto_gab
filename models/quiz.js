const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/DB/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nome: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  autor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'quizzes',
  timestamps: false,
});

module.exports = Quiz;
