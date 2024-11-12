const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    res.render('pages/inicial', { 
        title: 'Página Inicial',
        customHeaderVazio: true  // Ativa o cabeçalho principal
    });
});


module.exports = router