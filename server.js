
var http = require('http'); // module needed to create server
var url = require('url');   // routing for generating pages


function start(routing){
    //creating server with createServer method on http object ( it takes callback with 2 argumens: request and response)
    // reguest(object) -> info about the request sent to the server
    // response(object) -> is used to help us on generating response to the webbrowser

    http.createServer(function(request, response) {

        var pathName = url.parse(request.url).pathname;  // parsing url from request

        if(!routing[pathName]) {    // checking if the controller exists. if not we set it to /404
            pathName = '/404';
        }

        routing[pathName](request, response);   // initializing controller(routing)


        // //console.log('received request');  // visible in terminal only
        // response.writeHead(200, {'Content-type': 'text/plain'});    // setting headers for our response - just plain text, first argument is a code of our request - 200 request is OK
        // response.end('Hi!');    // this method will send object 'response' to the users browser

    }).listen(8080, '127.0.0.1');  // listen is method about the details about our server - which port and IP

    console.log('Server running at http://127.0.0.1:8080/');
    // console.log will only show text in the terminal. 
    // If you want your text to appear on the browser you need to use response object
}

exports.start = start;