const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('./model/db');
const routes = require('./routes');
const nocache = require('nocache');

const app = express();
const port = 8000;
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next()
});

// Importing the routes
app.use('/', routes);

// Handling 404 errors
app.use((req, res, next) => {
    res.status(404).send('404: Page not found');
});

// Handling other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('500: Internal Server Error');
});

// Starting the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
