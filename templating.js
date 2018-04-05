
var fs = require('fs');     // needed for reading files such as .html files (will be used in render func)


var render = function(response, view, params, httpCode) {   // function for rendering our .html files

    // (file path, coding, callback(err -> if error on open, data -> opened file) - used after opening file)
    fs.readFile(view, 'utf8', function(err, data){

        if(err) {   // stop on error
            console.log(err);
            return;
        }

        params = params||{}         // setting default value

        httpCode = httpCode||200;   // setting default value if last parameter is not given

        for(var key in params) {
            // data is a string with html content
            data = data.replace(new RegExp('@' + key + '@', 'g'), params[key]);    // replacing @xxx@ page titles
        }

        response.writeHead(httpCode, {'Content-type': 'text/html'});    // setting headers for html type document, first argument is a code of our request - 200 request is OK
        response.write(data);   // this method will print out 'data' in response
        response.end();    // this method will send object 'response' to the users browser with its data
    });
};

exports.render = render;