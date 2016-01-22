var os = require('os')
var path = require('path')
var fs = require('fs')
var crypto = require('crypto')
var request = require('request')
var moment = require('moment');

module.exports = function () {
  return new Analytics()
}

var SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL

// write the pem file and cleanup on exit
var SERVICE_ACCOUNT_KEY_FILE = path.join(os.tmpdir(), crypto.randomBytes(Math.ceil(6)).toString('hex').slice(0,12))
console.log("SERVICE_ACCOUNT_KEY_FILE=" + SERVICE_ACCOUNT_KEY_FILE)
fs.writeFileSync(SERVICE_ACCOUNT_KEY_FILE, new Buffer(process.env.KEY_PEM, 'base64'), { mode: '600' }, 'utf8')
// process.on('exit', fs.unlinkSync.bind(null, SERVICE_ACCOUNT_KEY_FILE))
// process.on('SIGINT', fs.unlinkSync.bind(null, SERVICE_ACCOUNT_KEY_FILE))

var SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL
//var SERVICE_ACCOUNT_KEY_FILE = __dirname + process.env.KEY_PEM

var GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID

function Analytics () {
    var self = this

    self.get = function (metric, segment, startDate, endDate, fn) {

        console.log('its on')
        var parsedStartDate = moment(startDate).format("YYYY-MM-DD")
        var parsedEndDate = moment(endDate).format("YYYY-MM-DD")
        var parsedMetric = 'ga:' + metric
        var segment = segment;
        console.log(parsedMetric);

        var googleapis = require('googleapis'),
                         JWT = googleapis.auth.JWT,
                         analytics = googleapis.analytics('v3');        


        var authClient = new JWT(
            SERVICE_ACCOUNT_EMAIL,
            SERVICE_ACCOUNT_KEY_FILE,
            null,
            ['https://www.googleapis.com/auth/analytics.readonly']
        );

        authClient.authorize(function(err, tokens) {
          
          if (segment != null){
            console.log("segment = " + segment);
            analytics.data.ga.get({ 
                auth: authClient,
                'ids': 'ga:112215144',
                'start-date': parsedStartDate,
                'end-date': parsedEndDate,
                'metrics': parsedMetric,
                'segment': segment,
            }, function(err, result) {
                  if (err) {
                    console.log("Analytics file error: " + err);
                    msg2 = "Oops, I don't seem to have the answer to that. Please try again" + err;
                    fn(null, msg2);
                    return;
                    //return fn(err);
                    //this doesn't work. all errors should be caught by this so that we never have the bot shut down.
                  }
                  var totals = result.totalsForAllResults;

                  //http://stackoverflow.com/questions/24898151/json-response-from-google-analytics-api
                  if (metric == "sessionDuration"){
                    var data = result["totalsForAllResults"][parsedMetric]
                    msg2 = moment.duration(data, 'milliseconds');
                  }
                  else{
                    console.log(result)
                    msg2 = result["totalsForAllResults"][parsedMetric];
                  }

                  fn(null, msg2)
            });

          }
          else{
            analytics.data.ga.get({ 
                auth: authClient,
                'ids': 'ga:112215144',
                'start-date': parsedStartDate,
                'end-date': parsedEndDate,
                'metrics': parsedMetric,
            }, function(err, result) {
                  if (err) {
                    console.log("Analytics file error: " + err);
                    msg2 = "Oops, I don't seem to have the answer to that. Please try again" + err;
                    fn(null, msg2);
                    return;
                    //return fn(err);
                    //this doesn't work. all errors should be caught by this so that we never have the bot shut down.
                  }
                  var totals = result.totalsForAllResults;

                  //http://stackoverflow.com/questions/24898151/json-response-from-google-analytics-api
                  if (metric == "sessionDuration"){
                    var data = result["totalsForAllResults"][parsedMetric]
                    msg2 = moment.duration(data, 'milliseconds');
                  }
                  else{
                    console.log(result)
                    msg2 = result["totalsForAllResults"][parsedMetric];
                  }

                  fn(null, msg2)
            });
          }

      });

    }
}