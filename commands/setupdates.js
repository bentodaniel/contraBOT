const constants = require('../utils/constants')

module.exports = {
    name: 'setupdates',
    short_name: 'setu',
    description: 'Defines a channel for news about a game',
    arguments: '<game> <channel>',
    arguments_help: `<game> can be one of the following: ${Object.keys(constants.games)}`,
    adminOnly: true,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // only the owner has access to this command
        if (message.author.id !== message.guild.ownerId) {
            message.channel.send({
                'content' : ' ',
                'embeds' : [{
                    'type' : 'rich',
                    'title': 'You do not have permissions to use that command',
                    'color' : 0xff0000,
                }]
            })
        }
        else {
            args = args.split(' ')
            const game = args[0]

            if (!constants.games.hasOwnProperty(game)) {
                message.channel.send({
                    'content' : ' ',
                    'tts': false,
                    'embeds' : [{
                        'type' : 'rich',
                        'title': 'Error',
                        'color' : 0xff0000,
                        'description': `The game '${game}' is not valid.\nCheck '**$help**' for more info.`
                    }]
                });
            }
            else {
                const channel = await client.channels.fetch(args[1].replace(/\D/g,''))

                const q = `REPLACE INTO UpdatesChannels (gameID, channelID, guildID) VALUES('${game}', ${channel.id}, ${message.guild.id})`
                
                db.query(q, async (error, results) => {
                    if (error) {
                        message.channel.send({
                            'content' : ' ',
                            'tts': false,
                            'embeds' : [{
                                'type' : 'rich',
                                'title': 'Error',
                                'color' : 0xff0000,
                                'description': `Failed to set the channel ${channel.toString()} as default for ${game} updates`
                            }]
                        });
                    }
                    else {
                        message.channel.send({
                            'content' : ' ',
                            'tts': false,
                            'embeds' : [{
                                'type' : 'rich',
                                'title': 'Game updates have been set',
                                'color' : 0x6fff00,
                                'description': `Channel ${channel.toString()} has been set as default for ${game} updates`
                            }]
                        });
                    }
                });
            }
        }
    }
}
