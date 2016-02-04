var Botkit = require('botkit')
var Witbot = require('witbot')
var moment = require('moment');
// var excelbuilder = require('msexcel-builder');
var mysql = require('mysql');
var Botkit = require('botkit');


var slackToken = process.env.SLACK_TOKEN
var witToken = process.env.WIT_TOKEN
var witbot = Witbot(witToken);

var connection = mysql.createConnection({
	host     : process.env.HOSTS,
	user     : process.env.USER,
	password : process.env.PASSWORD,
	database : process.env.DATABASE
});

var controller = Botkit.slackbot({
	debug: false
})

controller.spawn({
	token: slackToken
}).startRTM(function (err, bot, payload) {
	if (err) {
		throw new Error('Error connecting to slack: ', err)
	}
	console.log('Connected to slack')
})

//WIT.AI 

// var request = require('request');
// var wit = require('node-wit');
// var fs = require('fs');
// var witbot = Witbot(witToken);
// var ACCESS_TOKEN = "MSL3H5OLCFAD5ZB6CBUMWLFAQ6WOOZBX"; 

/*
wit.captureTextIntent(ACCESS_TOKEN, "What is the cheapest price?", function (err, res) {
    if (err) console.log("Error: ", err);
    console.log("Length outcomes: ", res['outcomes'].length);
    var intent = res['outcomes'][0]['intent']; 

    console.log(JSON.stringify(res, null, " "));
});


function createIntent() { 
	var payload = {"name":"flight_request",
	"doc":"detect flight request",
	"expressions":[{
		"body" : "fly from incheon to sfo"
	}, {
		"body" : "I want to fly from london to sfo"
	},{
		"body" : "need a flight from paris to tokyo"
	}]};

	request.post({
		headers: {'content-type' : 'application/json', 'Authorization' : 'Bearer ' + ACCESS_TOKEN},
		url:     'https://api.wit.ai/intents',
		body:    payload,
		json: true
	}, function(error, response, body){
		console.log(body)
	});

}
createIntent()
*/

//TODO: ADD ONBOARDING BOT :)

function createExcelAttachment(data, nameWorkbook){
	if(nameWorkbook.indexOf(".csv") == -1){
		nameWorkbook = nameWorkbook + ".csv"
	}
	var workbook = excelbuilder.createWorkbook('./', nameWorkbook)
	var rows = data.length;
	var cols = data[0].length;
	var sheet1 = workbook.createSheet('sheet1', cols, rows);  
	for(var i = 0; i < rows; i++){
		for(var j=0; j < cols; j++){
			if(data[i][j] != undefined){
				sheet1.set(j+1, i+1, data[i][j]);
			}
		}
	}
	workbook.save(function(ok){
		if (!ok) 
			workbook.cancel();
		else
			console.log('Your workbook created');
	});
}

function addAttachment(value){
	var attachments = [];
	var attachment = {
		color: '#CCC',
		fields: [],
		"mrkdwn_in": ["fields"],
	};
	attachment.fields.push({
		value: "`" + value + "`",
		short: true,
	})
	attachments.push(attachment);
	return attachments;
}


controller.hears(['database name'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.reply(message,{attachments: addAttachment(connection['config']['database'])});
});


controller.hears(['show tables'],['direct_message','direct_mention','mention'],function(bot,message) {
	showTables(bot,message);
});

function showTables(bot, message){
	connection.query('show tables', function(err, rows, fields) {
		if(err || rows === undefined){
			bot.reply(message,{attachments: addAttachment("There was an error getting the database tables")});
		}
		else{
			var tables = [];
			for(var i = 0; i < rows.length; i++){
				var tableName = rows[i]["Tables_in_" + connection['config']['database']];
				var tableName = '`' + tableName + '`';
				tables.push(tableName);
			}

			bot.reply(message,tables.toString());
		}
	});
}

controller.hears(['show schema'],['direct_message','direct_mention','mention'],function(bot,message) {
	connection.query('show tables', function(err, rows, fields) {
		if(err || rows === undefined){
			bot.reply(message,{attachments: addAttachment("There was an error getting the schema")});
		}
		else{
			var tables = [];
			for(var i = 0; i < rows.length; i++){
				var tableName = rows[i]["Tables_in_" + connection['config']['database']];
				tables.push(tableName);
			}
			if(tables.length >= 2){
				bot.startConversation(message,function(err,convo) {
					convo.ask('Please pick a table: ' + tables.toString(),function(response,convo) {
						if(tables.toString().indexOf(response.text) != -1){
							connection.query('SHOW COLUMNS FROM ' + response.text +';', function(err, rows, fields) {
								if(err || rows === undefined){
									bot.reply(message,{attachments: addAttachment("There was an error getting the schema for table " + response.text)});
								}
								else{
									var columns = [];
									for(var i = 0; i < rows.length; i++){
										var field = rows[i]["Field"];
										columns.push(field);
									}
									bot.reply(message,{attachments: addAttachment(columns.toString())});
									convo.stop();
									return;
								}
							});
						}
						else{
							convo.stop();
							bot.reply(message,{attachments: addAttachment("This is not a valid choice try again... (Type: <show schema>")});
								return;
							}
						});
				});
			}
			if(tables.length == 1){
				connection.query('SHOW COLUMNS FROM ' + tables[0] +';', function(err, rows, fields) {
					if(err || rows == undefined){
						bot.reply(message,{attachments: addAttachment("There was an error getting the schema for table " + tables[0])});
					}
					else{
						var columns = [];
						for(var i = 0; i < rows.length; i++){
							var field = rows[i]["Field"];
							columns.push(field);
						}
						bot.reply(message,{attachments: addAttachment(columns.toString())});
						return;
					}
				});

			}
			if(tables.length == 0){
				bot.reply(message,{attachments: addAttachment("You have no tables stored!")});
				return;
			}
		}
	});
});



controller.hears(['query'],['direct_message','direct_mention','mention'],function(bot,message) {
		if(message.text.toUpperCase().indexOf("DROP") != -1){
			//prevent SQL injection from slackchat user 
			bot.reply(message,{attachments: addAttachment("You are not allowed to run this command in the chatroom...")});
		}
		else{
	connection.query(message['text'].replace("query", ""), function(err, rows, fields) {
		console.log("Query:", rows);
		var data = [];
		if (err || rows === undefined){
			bot.reply(message,{attachments: addAttachment("Error: invalid query")});
		}
		else{
			var keys = Object.keys(rows[0]);
			bot.reply(message, keys.toString());
			for(var i = 0; i < rows.length; i++){
				var line = [];
				for(var ii = 0; ii < keys.length; ii++){
					line.push(rows[i][keys[ii]]);
				}
				data.push(line);
				bot.reply(message, line.toString());
			}


  bot.startConversation(message,function(err,convo) {
    convo.ask('What would you like to save this query to a CSV?',[
      {
        pattern: bot.utterances.yes,
        callback: function(response,convo) {
        	convo.next();
        	convo.ask("What would you like the name the file?", function(response, convo){
        		console.log(response.text);
        		createExcelAttachment(data, response.text);
        		//TO DO SEND BACK A MESSAGE WITH THE DATA FILE AS ATTACHMENT 
        		convo.stop();
        	})
        }
      },
      {
        pattern: bot.utterances.no,
        callback: function(response,convo) {
          convo.say('Perhaps later.');
          convo.stop();
        }
      }
    ]);
  })
		}
		return;
	});
	}
});




var analytics = require('./analytics')();

witbot.hears('performance', 0.5, function (bot, message, outcome) {

	//set defaults (before checks?)
	var segment = null; 
	var metric = null;

	//TODO: error handling for bad input data

	//check if no date recognized
	if (!outcome.entities.datetime || outcome.entities.datetime.length === 0) {
		//console.log(outcome.entities)
		bot.reply(message, 'I\'d love to give you the answer. But I need you to specify a date!')
		return
	}
	else{
		//check if there is a range
		var dateType = outcome.entities.datetime[0].type;

		if (dateType === "interval"){
			var startDate = outcome.entities.datetime[0].from.value
			var endDate =outcome.entities.datetime[0].to.value
		}

		else if (dateType === "value"){
			//start date = specified date
			var startDate = outcome.entities.datetime[0].value

			//end date = today
			var endDate = moment();
		}
	}
	//check if no metric recognized
	if (!outcome.entities.ga_metric || outcome.entities.ga_metric.length === 0) {
		//console.log(outcome.entities);
		bot.reply(message, "Hmmm, I can't understand what you're trying to get. Can you try phrasing it differently? :simple_smile:");
		return
	}
	else{
		metric = outcome.entities.ga_metric[0].value
	}

	
	//check if no segment recognized
	if (!outcome.entities.segment || outcome.entities.segment.length === 0) {
		var segment = null;
	}
	else{
		var segment = outcome.entities.segment[0].value;
	}
	//console.log(segment);
	getAnalytics(bot, message, metric, segment, startDate, endDate, true);
})


controller.on('channel_joined',function(bot,message) {
	bot.say(
	{
		text: "Hi, I am Guru. Say `@guru help` to see what I can do",
		channel: message.channel.id
	}
	);
});

controller.hears(['help'],['direct_message','direct_mention','mention'],function(bot,message) {
	bot.startConversation(message,function(err,convo) {
		convo.say("Ready to become an analytics guru? :nerd_face:  I can help!");
		convo.say("I'm here to answer all your questions around data, analytics, metrics and insights. Ask me a question like `How many new users signed up last week?` or `How many daily active users over the past week?` and I will answer. You can also start by just mentioning a specific `<metric>` and `<period>`, and we can segment it out from there. :simple_smile: ");
		convo.say("To see a full list of supported metrics, type `@guru: list metrics`");
	})
});

controller.hears(['list metrics'],['direct_message','direct_mention','mention'],function(bot,message) {
	var attachments  = [
	{
		"title": "Users",
		"text": "`Users` `New Users` `% New Sessions` `Daily Active Users` `Weekly Active Users` `Monthly Active Users` `Number of Sessions per User`",
		"mrkdwn_in": ["text"]
	},
	{
		"title": "Sessions",
		"text": "`Sessions` `Bounces` `Bounce Rate` `Session Duration` `Avg. Session Duration` `Hits`",
		"mrkdwn_in": ["text"]
	}
	]

	bot.reply(message,{
		text: "Here are all the metrics I know how to calculate. Pair one of these with a `<period>` of time, and I'll get to crunching them numbers!",
		attachments: attachments,
	},function(err,resp) {
		//console.log(err,resp);
	});
});

function unCamelCase (str){
	return str
		// insert a space between lower & upper
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		// space before last upper in a sequence followed by lower
		.replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
		// uppercase the first character
		.replace(/^./, function(str){ return str.toUpperCase(); })
	}


	function getAnalytics(bot, message, metric, segment, startDate, endDate, chartBool){

		if (chartBool == true){
			analytics.get(metric, segment, startDate, endDate, function (error, msg2, chartURL, metricTitle, startDate, endDate, prettyStartDate, prettyEndDate) {
				if (error) {
					console.error("error?" + error)
					bot.reply(message, 'uh oh, there was a problem getting the analytics')
					return
				}
			// console.log(msg2)
			// bot.reply(message, msg2)

			var title = unCamelCase(metricTitle)

			var chart  = [
			{
				"title": title,
				"image_url": chartURL,
				"color": "#764FA5",
			}
			]

			bot.reply(message,{
				text: msg2,
				attachments: chart,
			},function(err,resp) {
				//console.log(err,resp);
			});

			//DETERMINE SEGMENTING OF ABOVE METRIC REPORT//
			
			followUp(bot, message, title, startDate, endDate, metric, prettyStartDate, prettyEndDate);

			//find possible segments and list them out

			//ask user to select one

			//listen for response

			//make api call with metric + dimension + segment

			//return response
			

			console.log('no errors..')
		})  
		}

	//no chart
	else{
		analytics.get(metric, segment, startDate, endDate, function (error, msg2, chartURL, metricTitle, startDate, endDate) {
			if (error) {
				console.error("error?" + error)
				bot.reply(message, 'uh oh, there was a problem getting the analytics')
				return
			}
			// console.log(msg2)
			// bot.reply(message, msg2)

			var title = unCamelCase(metricTitle)

			var fields = [];

			if(typeof msg2 == 'object'){

				var attachments = [];
				var attachment = {
					color: '#CCC',
					fields: [],
					"mrkdwn_in": ["fields"],
				};
				var fieldValue = null;
				for (var i = 0; i < msg2.length; i++){
					// for (var j = 0; j < msg2[i].length; j++){
					//  row[0][0] --> label
					//  row[0][1] --> value

					var label = msg2[i][0];
					var value = msg2[i][1];
					console.log(label + "-->" + value);
					attachment.fields.push({
						value: label,
						short: true,
					});
					attachment.fields.push({
						value: "`" + value + "`",
						short: true,
					})



						// console.log(row[j]);
						// attachment.fields.push({
						//  label: 
						// })
						// console.log(typeof row[j]);
			//      }
					//console.log('after-loop');
					
				}
				attachments.push(attachment);
				

			}
			
			bot.reply(message,{
				text: "*" + title + " segmented by " + segmentCategory + ":*",
				attachments: attachments,
			},function(err,resp) {
				console.log("rtm error: " + err,resp);
			});
			//DETERMINE SEGMENTING OF ABOVE METRIC REPORT//
			console.log('no errors..')
		})  
}
}

function followUp(bot, message, title, startDate, endDate, metric, prettyStartDate, prettyEndDate){
	console.log(prettyStartDate + " - " + prettyEndDate);
	// start a conversation to handle this response.
	bot.startConversation(message,function(err,convo) {
		convo.ask("Do you want me to segment *" + title + " from " + prettyStartDate + " - " + prettyEndDate + "*?",[
		{
			pattern: bot.utterances.yes,
			callback: function(response,convo) {
				askSegment(metric);
				//do something else...( store response / make call)
				convo.next();
			}
		},
		{
			pattern: bot.utterances.no,
			callback: function(response,convo) {
				convo.say('Ok. Perhaps later. :simple_smile:');
			  // do nothing
			  convo.next();
			}
		},
		{
			default: true,
			callback: function(response,convo) {
			  // just repeat the question
			  convo.say("Please say `YES` or `NO` :simple_smile: ");
			  convo.repeat();
			  convo.next();
			}
		}
		]);
	})


	function askSegment(metric){
		bot.startConversation(message,function(err,convo) {
			convo.ask('Great! Do you want to segment by `device`, `operating system`, `browser`, `medium` or `country`?',[
			{
				pattern: 'device',
				callback: function(response,convo) {
						//convo.say('you said ' + response.text);

						//CALL GAPI QUERY HERE WITH SEGMENT SELECTED AS RESPONSE.TEXT
						segmentCategory = response.text;
						getAnalytics(bot, message, metric, segmentCategory, startDate, endDate, false)

						//do something else...( store response / make call)
						convo.next();
					}
				},
				{
					pattern: 'operating system',
					callback: function(response,convo) {
						segmentCategory = response.text;
						getAnalytics(bot, message, metric, segmentCategory, startDate, endDate, false)
						//do something else...( store response / make call)
						convo.next();
					}
				},
				{
					pattern: 'browser',
					callback: function(response,convo) {
						segmentCategory = response.text;
						getAnalytics(bot, message, metric, segmentCategory, startDate, endDate, false)
						convo.next();
					}
				},
				{
					pattern: 'medium',
					callback: function(response,convo) {
						segmentCategory = response.text;
						getAnalytics(bot, message, metric, segmentCategory, startDate, endDate, false)
						convo.next();
					}
				},
				{
					pattern: 'country',
					callback: function(response,convo) {
						segmentCategory = response.text;
						getAnalytics(bot, message, metric, segmentCategory, startDate, endDate, false)
						convo.next();
					}
				}

				]);
})
}
}



