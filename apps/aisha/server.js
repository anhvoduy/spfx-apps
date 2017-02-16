// Dependencies
var http = require('http');
var express = require('express');
var fs = require('fs');
var path = require('path');

var server = express();
server.get('/', function (req, res) {
	res.writeHead(200, {"Content-Type": "text/html"});	
  	fs.createReadStream(path.resolve(__dirname, 'index.html')).pipe(res);	
});

server.getPort = function(){
	return 8080;
};

server.use('/css', express.static(path.join(__dirname, 'css')));
server.use('/fonts', express.static(path.join(__dirname, 'fonts')));
server.use('/images', express.static(path.join(__dirname, 'images')));
server.use('/js', express.static(path.join(__dirname, 'js')));
server.use('/libs', express.static(path.join(__dirname, 'libs')));

http.createServer(server).listen(server.getPort(), function(){
	console.log('Web Server is running on port: ' + server.getPort());
});