const http = require('http');

http.createServer(function (req, res){
	res.write("Hi Erin and Lacy now this is running from NodeJS an update to test CI CD");
	res.end();
}).listen(3000);

console.log('server started');
