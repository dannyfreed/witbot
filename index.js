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

	//TODO: error handling for bad input data

	//check if no date recognized
	if (!outcome.entities.datetime || outcome.entities.datetime.length === 0) {
		console.log(outcome.entities)
	    bot.reply(message, 'I\'d love to give you the answer. But I need you to specify a date!')
	    return
	}
	//check if no metric recognized
	if (!outcome.entities.ga_metric || outcome.entities.ga_metric.length === 0) {
		console.log(outcome.entities);
		bot.reply(message, "Hmmm, I can't understand what you're trying to get. Can you try phrasing it differently? :)");
		return
	}

	//set defaults (before checks?)
	var segment = null;


	
	var metric = outcome.entities.ga_metric[0].value

	//check if there is a range
	var dateType = outcome.entities.datetime[0].type;

	if (dateType === "interval"){
		var startDate = outcome.entities.datetime[0].from.value
		var endDate =outcome.entities.datetime[0].to.value
	}

	else if (dateType === "value"){
		var startDate = outcome.entities.datetime[0].value
		var endDate = moment();
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

    convo.say("Ready to become an analytics guru? :nerd_face:  Here's how I can help you.");
    convo.say("To get started, you have to let me know what type of metric you're interested in learning more about. For example, `users`, `sessions`, `pageviews`, just to name a few.");
    convo.say("To see a full list of supported metrics, type `@guru: list metrics`");



  })

});

controller.hears(['list metrics'],['direct_message','direct_mention','mention','ambient'],function(bot,message) {

	// var attachments = [];
	//   var attachment = {
	//     title: 'Users',
	//     color: '#0099ff',
	//     fields: [],
	//   };

	//   attachment.fields.push({
	//     label: 'Users',
	//     value: "`users` ```new users``` `existing users` `one-time users` ",
	//     short: false,
	//   });

	  var attachments  = [
        {
            "title": "Users",
            "text": "`users` `new users` `existing users` `one-time users`",

            "mrkdwn_in": ["text"]
        },
        {
            "title": "Sessions",
            "text": "`sessions` `bounces` `bounce rate` `session duration` `avg session duration`",
            "mrkdwn_in": ["text"]
        }
    ]




	  //attachments.push(attachment);

	  bot.reply(message,{
	    text: 'Here are all the metrics I can currently pull...',
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





