var http = require('http'); // module needed to create server
var url = require('url');   // routing for generating pages
var fs = require('fs');     // needed for reading files such as .html files (will be used in render func)
var formidable = require('formidable'); // form support -> ! its not default nodejs module
var mysql = require('mysql');   // need it to save our data to database


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


var controllers = {};   // here we will store controllers for routing

controllers['/'] = function(request, response) {

    render(response, 'views/index.html', {
        pageTitle: 'Main Page'  // used for setting <title>
    });


    // example
    // var html = "<html><head><title>TEST</title></head><body><h1>Test</h1></body></html>";
    // response.writeHead(200, {'Content-type': 'text/html'});    // setting headers for html type document, first argument is a code of our request - 200 request is OK
    // response.write(html);   // this method will print out html file
    // response.end();    // this method will send object 'response' to the users browser
};
controllers['/form'] = function(request, response) {

    render(response, 'views/form.html', {
        pageTitle: 'Registration Form'
    });


    // example
    // response.writeHead(200, {'Content-type': 'text/plain'});    // setting headers for our response - just plain text, first argument is a code of our request - 200 request is OK
    // response.end('Form Page');    // this method will send object 'response' to the users browser
};
controllers['/save-form'] = function(request, response) {

    var uploadPath = 'files/';  // path to the folder where we store files

    var generateNewFileName = function(fileName) {  // this func will create more unique names for our files gathered by form

        var prefix = Math.floor((Math.random() * 1000) + 1);    // prefix

        return prefix + '_' + fileName; // returning new name of the file
    };

    // rendering if there was an error while sending form
    var onSaveError = function(response) {
        render(response, 'views/saveError.html', {
            pageTitle: 'Save Error'
        });
    };

    var onSaveSuccess = function(response, orderId) {
        render(response, 'views/saveSuccess.html', {
            pageTitle: 'Save Success',
            orderId: orderId
        });
    };

    if("POST" === request.method){  // checking if method is POST
        
        // using formidable module 
        var form = new formidable.IncomingForm();

        // parsing out all the data from the form(from the request).. when its done -> callback(error, form fields, files -> if form contained files)
        form.parse(request, function(err, fields, files){

            if(err) {
                // show error
                onSaveError(response);
                console.log(err);
                return;
            }

            // Here we will create connection with database. We will use phpAdmin.
            // Setup: go to localhost/phpmyadmin (remember to have your local host server like xampp running with apache) 
            // -->(in phpAdmin) create database with any name u like , with utf8 polish encoding ,then CREATE
            // --> Name: 'users', Number of columns: 3 ,then GO
            // --> ROWS as follows >
            // name: id / type: INT / index: PRIMARY / Auto Increment: checked
            // name: name / type: VARCHAR / Length: 255
            // name: file / type: VARCHAR / Length: 255
            // DONE

            var newName = generateNewFileName(files.paymentFile.name);  // paymentFile is a 'name' property from input, method name holds the name of the file 

            // now we need to rename file with fs module
            // and also relocate it ... bcuz by default it is stored in temporary directory in linux
            fs.rename(files.paymentFile.path, uploadPath + newName, function(err){
                if(err) {
                    // show error
                    onSaveError(response);
                    console.log(err);
                    return;
                }

                // now we got our file ready. we can save it to our database
                
                var saveData = {};    //but first we creaate object that will fit in db
                saveData['name'] = fields.name;     // keys must be the same as the columns in your DB  
                saveData['file_name'] = newName;    // keys must be the same as the columns in your DB  

                //now we establish connection with db
                var conn = mysql.createConnection({ // the parameter of this method is simply an object with connection parameters (note: password might be not required but u will get an error if u pass it when notr needed)
                    host: 'localhost',
                    user: 'root',
                    database: 'nodejsapp'   //the name of our db (yes u named it)
                });

                conn.connect(); // .. ... puf! connected

                // finally we create query to our database - > sending our saveData in '?' pewpew
                conn.query('INSERT INTO users SET ?', saveData, function(err, result){  // we defined our database as 'users' before, remember? its not black magic! hic!

                    if(err) {
                        // show error
                        onSaveError(response);
                        console.log(err);
                        return;
                    }

                    onSaveSuccess(response, result.insertId);


                });

            });

        });


    } else {    // if method is other then POST we send response with error code and error message
        response.writeHead(301, {'Content-type': 'text/plain'});
        response.end('Only POST Method Avaible!');
    }


    // example
    // response.writeHead(200, {'Content-type': 'text/plain'});    // setting headers for our response - just plain text, first argument is a code of our request - 200 request is OK
    // response.end('Saving form...');    // this method will send object 'response' to the users browser
};
controllers['/404'] = function(request, response) {
    render(response, 'views/error404.html', {
        pageTitle: 'Page not found :\'('
    });


    // example
    // response.writeHead(200, {'Content-type': 'text/plain'});    // setting headers for our response - just plain text, first argument is a code of our request - 200 request is OK
    // response.end('404: Page Not Found :\'(');    // this method will send object 'response' to the users browser
};



//  1--
//creating server with createServer method on http object ( it takes callback with 2 argumens: request and response)
// reguest(object) -> info about the request sent to the server
// response(object) -> is used to help us on generating response to the webbrowser

http.createServer(function(request, response) {

    var pathName = url.parse(request.url).pathname;  // parsing url from request

    if(!controllers[pathName]) {    // checking if the controller exists. if not we set it to /404
        pathName = '/404';
    }

    controllers[pathName](request, response);   // initializing controller(routing)


    // //console.log('received request');  // visible in terminal only
    // response.writeHead(200, {'Content-type': 'text/plain'});    // setting headers for our response - just plain text, first argument is a code of our request - 200 request is OK
    // response.end('Hi!');    // this method will send object 'response' to the users browser

}).listen(8080, '127.0.0.1');  // listen is method about the details about our server - which port and IP

console.log('Server running at http://127.0.0.1:8080/');
// console.log will only show text in the terminal. 
// If you want your text to appear on the browser you need to use response object
//  --1
