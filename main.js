const Discord = require('discord.js');
require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}` })
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

client.login(process.env.BOT_TOKEN);
