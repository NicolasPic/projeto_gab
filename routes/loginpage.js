const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    res.render('pages/login', { 
        title: 'Página login',
        customHeaderVazio: true  // Ativa o cabeçalho principal
    });
});


module.exports = router