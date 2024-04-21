const mongoose = require('mongoose');
const express = require('express');
const app = express();

mongoose.connect('mongodb://localhost:27017/weeksix');
const db = mongoose.connection;

db.on('error', (error) => {
    console.log(error);
});

db.once('open', () => {
    console.log('Connected to database');
});

app.use((req, res, next) => {
    res.locals.mongoose = req.session.message;
    delete req.session.message;
    next();
});

module.exports = db;
