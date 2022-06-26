const constants = require('../utils/constants')

module.exports = {
    name: 'removeupdates',
    description: 'Stop receiving news about a game',
    arguments: '<game>',
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
                const q = `DELETE FROM UpdatesChannels WHERE gameID = '${game}' AND guildID = ${message.guild.id}`

                // This is not optimal as it says a game is deleted even if the game did not exist in the first place, but it is still acceptable
                
                db.query(q, async (error, results) => {
                    if (error) {
                        message.channel.send({
                            'content' : ' ',
                            'tts': false,
                            'embeds' : [{
                                'type' : 'rich',
                                'title': 'Error',
                                'color' : 0xff0000,
                                'description': `Failed to remove the game '${game}' from the updates list`
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
                                'description': `Game '${game}' has been removed from the updates list`
                            }]
                        });
                    }
                });
            }
        }
    }
}