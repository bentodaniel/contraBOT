const constants = require('../utils/constants')

module.exports = {
    name: 'setupdates',
    description: 'Defines a channel for news about a game',
    arguments: '<game> <channel>',
    arguments_help: `<game> can be one of the following: ${Object.keys(constants.games)}`,
    adminOnly: true,
    showOnHelp: true,
    execute(client, message, args, Discord) {

        // todo - check if it is the owner of the server

        message.channel.send('Soon...');
    }
}