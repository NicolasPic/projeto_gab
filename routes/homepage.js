const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    res.render('pages/home', { 
        title: 'Página home',
        customHeaderHome: true
    });
});

router.get('/jogar', (req,res)=> {
    res.render('pages/jogar',{
        title: 'Página jogar',
        customHeaderHome: true
    });
})


module.exports = router