const Discord = require('discord.js');
require('dotenv').config();
require('console-stamp')(console, { 
    format: ':date(yyyy/mm/dd HH:MM:ss)' 
});

const db = require('./database/db')

const allIntents = { 
    intents: [
        "GUILDS",
        "GUILD_MESSAGES",
    ] 
};

const client = new Discord.Client(allIntents);

client.commands = new Discord.Collection();
client.events = new Discord.Collection();

['command_handler', 'event_handler'].forEach(handler => {
    require(`./handlers/${handler}`)(client, Discord, db);
})

if (process.env.ENV_TYPE === 'test') {
    client.login(process.env.TEST_BOT_TOKEN);
}
else if (process.env.ENV_TYPE === 'production') {
    client.login(process.env.PROD_BOT_TOKEN);
}
else {
    console.log('Using wrong env type')
    process.exit(1)
}
