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

server.use('/app', express.static(path.join(__dirname, 'app')));
server.use('/libs', express.static(path.join(__dirname, 'libs')));
server.use('/css', express.static(path.join(__dirname, 'css')));
server.use('/images', express.static(path.join(__dirname, 'images')));

http.createServer(server).listen(server.getPort(), function(){
	console.log('Web Server is running on port: ' + server.getPort());
});