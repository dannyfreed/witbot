var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var CLIENT_ID = "347038432301-dul9mrkm1cut5b2nj3bkp5pnt8o2usd0.apps.googleusercontent.com";
var CLIENT_SECRET = 'GrUui508mRKX9lz5LWW05KCv';
var REDIRECT_URL = 'http://localhost:3000/oauth2callback';

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/calendar'
];

var auth_url = oauth2Client.generateAuthUrl({
  access_type: 'online', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});





exports.url = auth_url;
exports.client = oauth2Client;

var callback = function(clients) {
  console.log(clients);
  exports.cal = clients.calendar;
  exports.analytics = clients.analytics;
  exports.oauth = clients.oauth2;
  exports.client = oauth2Client;
  exports.url = calendar_auth_url;
};

