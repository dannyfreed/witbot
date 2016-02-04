var express = require('express');
var app = express();
var http = require('http');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var gapi = require('./lib/gapi');


// app.configure('development', function() {
//   app.use(express.errorHandler());
// });

// app.configure(function() {
//   app.set('port', process.env.PORT || 3000);
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'jade');
//   app.use(express.favicon());
//   app.use(express.logger('dev'));
//   app.use(express.bodyParser());
//   app.use(express.cookieParser());
//   app.use(express.methodOverride());
//   app.use(app.router);
// });


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', function(req, res) {
  var locals = {
        title: 'This is my sample app',
        url: gapi.url
      };
  res.render('index.jade', locals);
});

app.get('/oauth2callback', function(req, res) {
  var code = req.query.code;
  gapi.client.getToken(code, function(err, tokens){
    gapi.client.credentials = tokens;
    listAccountSummaries();
    // console.log('tokens!!' + JSON.stringify(tokens));
    // console.log(gapi.client.credentials);
    // console.log(gapi.client.credentials.access_token);
  });

  var locals = {
        title: 'My sample app post auth',
        url: gapi.url
      };
  res.render('index.jade', locals);
});

//TODO: PULL DATA LIKE THIS FROM GOOGLE ANALYTICS API...THIS IS GOOGLE PLUS AND GOOGLE CAL CODE...
function getData() {
  gapi.analytics.management.accounts.list().withAuthClient(gapi.client).execute(function(err, results){
    console.log(results);
  });
};

function listAccountSummaries() {
  var request = gapi.client.analytics.management.accountSummaries.list();
  console.log(request);

  //request.execute(handleResponse);
}
function handleResponse(response) {
  if (response && !response.error) {
    if (response.items) {
      printAccountSummaries(response.items);
    }
  } else {
    console.log('There was an error: ' + response.message);
  }
}


function printAccountSummaries(accounts) {
  for (var i = 0, account; account = accounts[i]; i++) {
    console.log('Account id: ' + account.id);
    console.log('Account name: ' + account.name);
    console.log('Account kind: ' + account.kind);

    // Print the properties.
    if (account.webProperties) {
      printProperties(account.webProperties);
    }
  }
}



exports.access_token = gapi.client.credentials;


var server = app.listen(3000);

console.log('Express server started on port %s', server.address().port);