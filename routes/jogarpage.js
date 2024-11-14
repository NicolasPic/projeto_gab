const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    res.render('pages/jogar', { 
        title: 'Página jogar',
        customHeaderHome: true  // Ativa o cabeçalho principal
    });
});

router.get('/sala/:codigo', (req, res) => {
    const codigoSala = req.params.codigo;
    res.render('pages/sala', { codigoSala });
});

module.exports = router