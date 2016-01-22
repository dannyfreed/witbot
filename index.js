var Botkit = require('botkit')
var Witbot = require('witbot')
var moment = require('moment');


var slackToken = process.env.SLACK_TOKEN
var witToken = process.env.WIT_TOKEN
var openWeatherApiKey = process.env.OPENWEATHER_KEY

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


var Botkit = require('botkit');

var witbot = Witbot(witToken)


//TODO: ADD ONBOARDING BOT :)

controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  witbot.process(message.text, bot, message)
})

// witbot.hears('hello', 0.5, function (bot, message, outcome) {
//   bot.reply(message, 'Hello to you as well!')
// })



var weather = require('./weather')(openWeatherApiKey)

witbot.hears('weather', 0.5, function (bot, message, outcome) {
  console.log(outcome.entities.location)
  if (!outcome.entities.location || outcome.entities.location.length === 0) {
    bot.reply(message, 'I\'d love to give you the weather but for where?')
    return
  }

  var location = outcome.entities.location[0].value

  weather.get(location, function (error, msg) {
    if (error) {
      console.error(error)
      bot.reply(message, 'uh oh, there was a problem getting the weather')
      return
    }
    bot.reply(message, msg)
  })
})


var analytics = require('./analytics')();

witbot.hears('performance', 0.5, function (bot, message, outcome) {

	//set defaults (before checks?)
	var segment = null;	
	var metric = null;



	//TODO: error handling for bad input data

	//check if no date recognized
	if (!outcome.entities.datetime || outcome.entities.datetime.length === 0) {
		console.log(outcome.entities)
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
		console.log(outcome.entities);
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
	
	console.log(segment);
	


  	analytics.get(metric, segment, startDate, endDate, function (error, msg2) {
	    if (error) {
	      console.error("error?" + error)
	      bot.reply(message, 'uh oh, there was a problem getting the analytics')
	      return
	    }
	    // console.log(msg2)
	    bot.reply(message, msg2)
	    console.log('no error..')
  })
})


controller.on('channel_joined',function(bot,message) {
    bot.say(
      {
        text: "Hi, I am Guru. Say `@guru help` to see what I can do",
        channel: message.channel.id
      }
    );
});



//ONLY WORKS WITH AMBIENT ON???
controller.hears(['help'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

  // start a conversation to handle this response.
  bot.startConversation(message,function(err,convo) {
    convo.say("Ready to become an analytics guru? :nerd_face:  I can help!");
    convo.say("I'm here to answer all your questions around data, analytics, metrics and insights. Ask me a question like `How many new users signed up last week?` or `How many daily active users over the past week?` and I will answer. You can also start by just mentioning a specific `<metric>` and `<period>`, and we can segment it out from there. :simple_smile: ");
    convo.say("To see a full list of supported metrics, type `@guru: list metrics`");
  })

});

controller.hears(['list metrics'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

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



	  //attachments.push(attachment);

	  bot.reply(message,{
	    text: "Here are all the metrics I know how to calculate. Pair one of these with a `<period>` of time, and I'll get to crunching them numbers!",
	    attachments: attachments,
	  },function(err,resp) {
	    console.log(err,resp);
	  });

});




// function onboard(){
//   witbot.say(
//     {
//       text: 'Hello. Beep Beoop bop boop. I am a robot! :simplesmile:',
//       channel: '#general'
//     }
//   );
// };

// onboard();





