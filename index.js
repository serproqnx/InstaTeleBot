'use strict'

const Promise = require('bluebird'),
	request = Promise.promisifyAll(require('request'), { multiArgs: true }),		
	cron = require('cron'),	
	TelegramBot = require('node-telegram-bot-api'),	

	InstaBot = {
		targetChatId : 'YOUR_TARGET_CHAT_ID', // send message to bot and check console.log for your id, ignore errors
		token : 'YOUR_BOT_TOKEN', // from http://telegram.me/BotFather
		date : 0,
		users : [ //instagram users names
			'serpro_stock',
			'serpro.qnx'
		],
		setDate() {
			this.date = Math.floor(Date.now() / 1000);			
		} //setDate
	}, //InstaBot

  bot = new TelegramBot(InstaBot.token, {polling: true});

//schedule cron job every 1 min
const cronJob = cron.job("*/1 * * * *", () => {
	if (InstaBot.date !== 0) {	
		Promise
			.map(InstaBot.users, (user) => {
				//get JSON data from each instagram InstaBot.users
				return request
					.getAsync('https://www.instagram.com/'+ user +'/?__a=1')
					.spread((response, body) => {
				    if (response.statusCode != 200)
				        throw new Error('Unsuccessful attempt. Code: ' + response.statusCode);
				    return JSON.parse(body).user.media.nodes;
				  }) //spread
				  //iterate user media, if new, send bot msg with link.
				  .map((media) => {
				  	if (media !== undefined && media !== null ) {
				  		if (media.date > InstaBot.date) {
				  			let msg = 'https://www.instagram.com/p/' + media.code; //channel or user id
				  			console.log(msg);
				  			bot.sendMessage(InstaBot.targetChatId, msg);
				  		} //if new
				  	}	//if undef or null
				  }) //map media
					.catch(console.error);
				},{ concurrency: 1 }) // how many parallel requests
				.then(() => {
					return InstaBot.setDate();
				}); //Promise
	} else { //if InstaBot.date === 0
		InstaBot.setDate();
		bot.sendMessage(InstaBot.targetChatId, 'first run');
	}//else
}); 

cronJob.start();

//msg debug 
bot.on('message', (msg) => {
  console.log(msg);
});