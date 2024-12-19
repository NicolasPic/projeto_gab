const Quiz = require('./quiz');
const Pergunta = require('./pergunta');
const Resposta = require('./resposta');
const Usuario = require('./usuario');

Quiz.hasMany(Pergunta, { foreignKey: 'quiz_id', onDelete: 'CASCADE' });
Pergunta.belongsTo(Quiz, { foreignKey: 'quiz_id' });

Pergunta.hasMany(Resposta, { foreignKey: 'pergunta_id', onDelete: 'CASCADE' });
Resposta.belongsTo(Pergunta, { foreignKey: 'pergunta_id' });

Usuario.hasMany(Quiz, { foreignKey: 'autor_id', onDelete: 'CASCADE' });
Quiz.belongsTo(Usuario, { foreignKey: 'autor_id' });

module.exports = { Quiz, Pergunta, Resposta, Usuario };
