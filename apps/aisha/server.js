const express = require('express');
const http = require('http');
const path = require("path");

const server = express();
server.set('port', process.env.PORT || 3000);

server.use(express.static('public'))
server.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + 'index.html'));
})

module.exports = server;