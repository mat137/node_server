
var url = require('url');   // routing for generating pages
var fs = require('fs');     // needed for reading files such as .html files (will be used in templating.render func)
var formidable = require('formidable'); // form support -> ! its not default nodejs module
var mysql = require('mysql');   // need it to save our data to database -> ! its not default nodejs module

// our modules
var templating = require('./templating.js');


function index(request, response) {

    templating.render(response, 'views/index.html', {
        pageTitle: 'Main Page'  // used for setting <title>
    });


    // example
    // var html = "<html><head><title>TEST</title></head><body><h1>Test</h1></body></html>";
    // response.writeHead(200, {'Content-type': 'text/html'});    // setting headers for html type document, first argument is a code of our request - 200 request is OK
    // response.write(html);   // this method will print out html file
    // response.end();    // this method will send object 'response' to the users browser
};
function form(request, response) {

    templating.render(response, 'views/form.html', {
        pageTitle: 'Registration Form'
    });


    // example
    // response.writeHead(200, {'Content-type': 'text/plain'});    // setting headers for our response - just plain text, first argument is a code of our request - 200 request is OK
    // response.end('Form Page');    // this method will send object 'response' to the users browser
};
function saveForm(request, response) {

    var uploadPath = 'files/';  // path to the folder where we store files

    var generateNewFileName = function(fileName) {  // this func will create more unique names for our files gathered by form

        var prefix = Math.floor((Math.random() * 1000) + 1);    // prefix

        return prefix + '_' + fileName; // returning new name of the file
    };

    // rendering if there was an error while sending form
    var onSaveError = function(response) {
        templating.render(response, 'views/saveError.html', {
            pageTitle: 'Save Error'
        });
    };

    var onSaveSuccess = function(response, orderId) {
        templating.render(response, 'views/saveSuccess.html', {
            pageTitle: 'Save Success',
            orderId: orderId
        });
    };

    // saving data to DB
    var saveIntoDb = function(data, onSave, onError) {

        // now we establish connection with db
        var conn = mysql.createConnection({ // the parameter of this method is simply an object with connection parameters (note: password might be not required but u will get an error if u pass it when notr needed)
            host: 'localhost',
            user: 'root',
            database: 'nodejsapp'   //the name of our db (yes u named it)
        });

        conn.connect(); // .. ... puf! connected

        // finally we create query to our database - > sending our saveData in '?' pewpew
        var sql = conn.query('INSERT INTO users SET ?', data, function(err, result){  // we defined our database as 'users' before, remember? its not black magic! hic!

            if(err) {
                // show error
                onError();
                console.log(err);
                return;
            }
            // console.log(sql);
            // console.log(result);
            
            onSave(result);   // rendering success page

        });

    };

    // this funciton handles our data in form
    var handleForm = function(request) {
        
        // using formidable module. Data from form is stored in our form variable
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

                var onDbSuccess = function(result) {
                    return onSaveSuccess(response, result.insertId);
                }

                var onDbError = function() {
                    return onSaveError(response);
                }

                //now we have our data prepared, so we call function where we connect and save to our db
                saveIntoDb(saveData, onDbSuccess, onDbError);
                

            });

        });

    };

    if("POST" === request.method){  // checking if method is POST
        
        handleForm(request);  // preparing data for sending it to db

    } else {    // if method is other then POST we send response with error code and error message
        response.writeHead(301, {'Content-type': 'text/plain'});
        response.end('Only POST Method Avaible!');
    }

};
function error404(request, response) {
    templating.render(response, 'views/error404.html', {
        pageTitle: 'Page not found :\'('
    });

};

exports.index = index;
exports.form = form;
exports.saveForm = saveForm;
exports.error404 = error404;