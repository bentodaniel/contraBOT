const Discord = require('discord.js');
const config = require('dotenv').config();

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
    require(`./handlers/${handler}`)(client, Discord);
})

client.login(process.env.BOT_TOKEN);