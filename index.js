var http = require('http')

http.createServer((req, res) => {
    console.log(`Request received at: ${req.url}`)
    res.end('hello world\n');
	res.pipe(res);
}).listen(8000);
