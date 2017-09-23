const express = require('express');
const http = require('http');
const path = require("path");

const server = express();
server.set('port', process.env.PORT || 3000);

server.get('/', function (req, res) {
    res.send('Hello World!')
})
server.use(express.static('public'))

module.exports = server;