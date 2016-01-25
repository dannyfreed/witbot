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
process.on('exit', fs.unlinkSync.bind(null, SERVICE_ACCOUNT_KEY_FILE))
process.on('SIGINT', fs.unlinkSync.bind(null, SERVICE_ACCOUNT_KEY_FILE))

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
        var title = metric;
        var sort = "-" + parsedMetric;

        var prettyStartDate = moment(parsedStartDate).format("M/D");
        var prettyEndDate = moment(parsedEndDate).format("M/D");

        //console.log(parsedMetric);

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
            
            if(segment == "device"){
              segment = "ga:deviceCategory";
            }
            else if (segment == "operating system"){
              segment = "ga:operatingSystem";
            }
            else if (segment == "browser"){
              segment = "ga:browser";
            }
            else if (segment == "medium"){
              segment = "ga:medium";
            }
            else if (segment =="country"){
              segment = "ga:country"
            }

            analytics.data.ga.get({ 
                auth: authClient,
                'ids': 'ga:112215144',
                'start-date': parsedStartDate,
                'end-date': parsedEndDate,
                'metrics': parsedMetric,
                'dimensions' : segment,
                'sort' : sort,
            }, function(err, result) {
                  if (err) {
                    console.log("Analytics file error: " + err);
                    msg2 = "Oops, I don't seem to have the answer to that. Please try again. Error: " + err;
                    fn(null, msg2, null, title, startDate, endDate, prettyStartDate, prettyEndDate);
                    return;
                    //return fn(err);
                    //this doesn't work. all errors should be caught by this so that we never have the bot shut down.
                  }
                  // var totals = result.totalsForAllResults;

                  // console.log("RESULT!" + result);

                  var segmentedResults = result.rows;
                  console.log(result);

                  fn(null, segmentedResults, null, title, startDate, endDate, prettyStartDate, prettyEndDate)
            });

          }




          else{
            analytics.data.ga.get({ 
                auth: authClient,
                'ids': 'ga:112215144',
                'start-date': parsedStartDate,
                'end-date': parsedEndDate,
                'metrics': parsedMetric,
                'dimensions' : "ga:date",
                'output': 'datatable'
            }, function(err, result) {
                  if (err) {
                    console.log("Analytics file error: " + err);
                    msg2 = "Oops, I don't seem to have the answer to that. Please try again" + err;
                    fn(null, msg2, imageUrl, title, startDate, endDate, prettyStartDate, prettyEndDate);
                    return;
                    //return fn(err);
                    //this doesn't work. all errors should be caught by this so that we never have the bot shut down.
                  }
                  var totals = result.totalsForAllResults;

                  //DRAW CHART//
                  var cols = result.dataTable.cols;
                  var rows = result.dataTable.rows;

                  var xAxis = [];
                  var yAxis = [];
                  
                  for(var i = 0; i < rows.length; i++){
                    //var date = rows[i]["c"][i]["v"];
                    //console.log(date);
                    var row = rows[i]["c"];
                    var rawDate = row[0]["v"];
                    var datapoint = row[1]["v"];
                    var date = moment(rawDate).format("M/D");                  
                    xAxis.push(date);
                    yAxis.push(datapoint);

                  }
                  //DEBUG THE dataTable object
                  // rowszero = rows[0]["c"];
                  // console.log(JSON.stringify(cols, null, 4));
                  // console.log(JSON.stringify(rowszero, null, 4))



                  //BUILD THE CHART!
                   var quiche = require('quiche');
                   
                   var chart = quiche('bar');
                   //chart.setTitle(metric);
                   chart.addData(yAxis, metric, '764FA5');
                   chart.addAxisLabels('x', xAxis);
                   chart.setWidth(540);
                   chart.setHeight(540);
                   chart.setAutoScaling();
                   chart.setTransparentBackground();

                   var imageUrl = chart.getUrl(true); // First param controls http vs. https

                   //END DRAWING OF SAID CHART!//

                  //http://stackoverflow.com/questions/24898151/json-response-from-google-analytics-api

                  msg2 = result["totalsForAllResults"][parsedMetric];

                  if (metric == "avgSessionDuration"){
                    //convert string to number
                    msg2 = Number(msg2);

                    //perform calculation seconds ==> minutes and round
                    msg2 = msg2/60;

                    //round number to 1 decimal
                    msg2 = Math.round (msg2 * 10) / 10;

                    //convert back to string, add label
                    msg2 = "The average session duration for *" + prettyStartDate + " - " + prettyEndDate + "* was " + "*" + msg2.toString() + " minutes*";
                    
                  }

                  else if (metric == "bounceRate"){
                    //convert string to number
                    msg2 = Number(msg2);

                    //round percentage
                    msg2 = Math.round(msg2);

                    //convert back to string, add label
                    msg2 = "Your average bounce rate for *" + prettyStartDate + " - " + prettyEndDate + "* was " + "*" + msg2.toString() + "%*";
                  }

                  else if (metric =="newUsers"){
                    msg2 = "There were " + "*" + msg2 + " new users* from *" + prettyStartDate + " - " + prettyEndDate + "*";
                  }
                  else if (metric == "sessionsPerUser"){
                    msg2 = Number(msg2);
                    msg2 = Math.round (msg2 * 10) / 10;
                    msg2 = "Users averaged around *" + msg2.toString() + " sessions* from *" + prettyStartDate + " - " + prettyEndDate + "*";  
                  }
                  else if (metric =="sessions"){
                    msg2 = "There were *" + msg2 + " sessions* from *" + prettyStartDate + " - " + prettyEndDate + "*";
                  }
                  else if (metric =="bounces"){
                    msg2 = "There were *" + msg2 + " bounces* from *" + prettyStartDate + " - " + prettyEndDate + "*";
                  }
                  else if (metric =="users"){
                    msg2 = "There were *" + msg2 + " users from " + prettyStartDate + " - " + prettyEndDate + "*";
                  }
                  //msg2 = msg2 + "/n" + imageUrl;

                  fn(null, msg2, imageUrl, title, startDate, endDate, prettyStartDate, prettyEndDate)
            });
          }

      });

    }
}







