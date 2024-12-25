const Quiz = require('./quiz');
const Pergunta = require('./pergunta');
const Resposta = require('./resposta');
const Usuario = require('./usuario');

// Relacionamento Quiz -> Perguntas
Quiz.hasMany(Pergunta, { foreignKey: 'quiz_id', as: 'Perguntas', onDelete: 'CASCADE' });
Pergunta.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'Quiz' });

// Relacionamento Pergunta -> Respostas
Pergunta.hasMany(Resposta, { foreignKey: 'pergunta_id', as: 'Respostas', onDelete: 'CASCADE' });
Resposta.belongsTo(Pergunta, { foreignKey: 'pergunta_id', as: 'Pergunta' });

// Relacionamento Usuario -> Quizzes
Usuario.hasMany(Quiz, { foreignKey: 'autor_id', as: 'Quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Usuario, { foreignKey: 'autor_id', as: 'Usuario' });

module.exports = { Quiz, Pergunta, Resposta, Usuario };