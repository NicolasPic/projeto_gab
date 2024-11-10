const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    res.render('pages/home', { 
        title: 'Página Inicial',
        customHeaderHome: true  // Ativa o cabeçalho principal
    });
});


module.exports = router