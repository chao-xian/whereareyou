var http = require('http'),
url = require('url'),
path = require('path'),
fs = require('fs'),
io = require('socket.io'),
sys = require('sys'),
oAuth = require('oauth').OAuth;


// create the http server
server = http.createServer(function(request, response){
    
	var uri = url.parse(request.url).pathname;
	var filename = path.join(process.cwd(), uri);
	
    
    // check whether the requested file exists
	path.exists(filename, function(exists) {
        
        // if the file does not exist, serve a 404 (note: not sure if this actually works...)
		if (!exists) {
			response.writeHeader(404, {'Content-Type':'text/plain'});
			response.end("Can''t find it...");
		}
		
		oAuth.getOAuthRequestToken(
		    function(error, oauth_token, oauth_token_secret, results) {
		        if (error) new Error(error.data);
		        else {
		            request.session.oauth.token = oauth_token;
		            request.session.oauth.token_secret = oauth_token_secret;
		            response.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
		        }
		    }
		);
        
        // serve the requested file
		fs.readFile(filename, 'binary',function(err, file){
            
            // if reading the file results in an error, serve the error
			if (err) {
				response.writeHeader(500, {'Content-Type':'text/plain'});
				response.end(err + "\n");
				return;
			}
            
            // else serve the file
			response.writeHead(200);
			response.write(file, 'binary');
			response.end();

		});
	});
});

// make the server listen on port 8080
server.listen(10271);

// create a socket listener attached to the server
var socket = io.listen(server);

socket.on('connection', function(client){
  // new client is here!
  client.on('message', function(message){ 
    socket.broadcast(message);
  });
  //client.on('disconnect', function(){ … })
});

