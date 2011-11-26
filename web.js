/* http://docs.dotcloud.com/services/nodejs/

require('http').createServer(function (request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  output = "Fucking Tanks Are Where?!\n";
  for (k in request.headers) {
    output += k + '=' + request.headers[k] + '\n';
  }
  response.end(output);
}).listen(8080);

process.on('SIGTERM', function () {
    console.log('Got SIGTERM exiting...');
    // do some cleanup here
    process.exit(0);
});

*/

var sse = require('./sse.js');

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

NotFound.prototype.__proto__ = Error.prototype;

var has_bot = false;
var express = require('express');
var app = express.createServer(
    // express.logger(),
    // ress.bodyParser()
);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'himitsu' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));
});

app.configure('development', function(){
    // app.use(express.static(__dirname + '/public'));
    app.use(express.logger({ format: ':method :url' }));
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  var oneYear = 31557600000;
  // app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(express.errorHandler({ showStack: true, umpExceptions: true }));
});

app.get('/', function(req, res){
    res.render('index', { layout: false, pageTitle: 'Tanks will be here soon. We promise.', youAreUsingJade: true, app_id: '' });
});

app.get('/bot', function(req, res) {
    if (!has_bot) {
        // has_bot = true;
        setTimeout(function() {
            sse.send({ type: 'create', position: { x: 140, y: 140 } }, 'bot');
            res.end();
        }, 2000);
    }
});

app.get('/stream', function(req, res) {
    sse.subscribe(req, res);
    sse.send('SSE init OK');
});

app.post('/unsubscribe/:id', function(req, res) {
    sse.unsubscribe(req.params.id);
    res.end();
});

app.get(/^\/node_modules.*/, function(req, res){
    throw new Error('Access denied');
});

app.get('/404', function(req, res){
    throw new NotFound;
});

app.get('/500', function(req, res){
    throw new Error('keyboard cat!');
});

// app.listen(8080);
var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
