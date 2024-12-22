const express = require("express");
const router = express.Router();
const { isAuthenticated } = require('../config/auth/auth');

router.get('/', isAuthenticated, (req, res) => {
    res.render('pages/home', { 
        title: 'Página home',
        customHeaderHome: true
    });
});

module.exports = router;