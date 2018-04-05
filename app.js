
// our modules
var templating = require('./templating.js');
var controllers = require('./controllers.js');
var server = require('./server.js')

// here we store controllers for routing
var routing = {
    '/': controllers.index,
    '/form' : controllers.form,
    '/save-form': controllers.saveForm,
    '/404': controllers.error404
};   

server.start(routing);


