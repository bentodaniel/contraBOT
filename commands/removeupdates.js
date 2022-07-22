const constants = require('../utils/constants')
const utils = require('../utils/utils')

module.exports = {
    name: 'removeupdates',
    short_name: 'remu',
    description: 'Stop receiving news about a game',
    arguments: '',
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
            message.channel.send(`Getting updates list data...`).then(msg => {
                utils.get_guild_updates(db, message.guild.id).then(json_data => {
                    if (json_data.length === 0) {
                        msg.edit({
                            'content' : ' ',
                            'embeds' : [{
                                'type' : 'rich',
                                'title': `${message.guild.name} has no game updates setup`,
                                'color' : 0x6fff00
                            }]
                        });
                    }
                    else {
                        send_selection_message(json_data, msg, client).then(select_msg => {
                            let allow_time_fail = true

                            // check if the interaction is in the same message
                            const filter = (click) => click.user.id === message.author.id && click.user.id === message.guild.ownerId && click.message.id == select_msg.id
                            const collector = message.channel.createMessageComponentCollector({
                                max: 1, // The number of times a user can click on the button
                                time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                                filter // Add the filter
                            });

                            collector.on("collect", async interaction => {
                                allow_time_fail = false

                                let gamesIDs = ''
                                for (gameid of interaction.values) {
                                    gamesIDs += `'${gameid}', `
                                }
                                gamesIDs = gamesIDs.slice(0, -2)

                                const q = `DELETE FROM UpdatesChannels WHERE guildID = ${message.guild.id} AND gameID IN (${gamesIDs})`

                                db.query(q, async (error, results) => {
                                    if (error) {
                                        utils.send_error_message(select_msg, `Failed to remove one or more games from the updates list`, 'edit')
                                    }
                                    else {
                                        utils.send_success_message(select_msg, `All selected games have been removed from the updates list`, 'edit')
                                    }
                                });
                            });
                        
                            collector.on("end", (collected) => {
                                if (allow_time_fail) {
                                    utils.send_error_message(select_msg, 'Game selection time is over', 'edit', select_msg['content'])
                                }
                            });
                        })
                    }
                })
            })
        }
    }
}

function send_selection_message(json_data, message, client) {
    return message.edit({
        'content': `Select the games you want to stop receiving news about`,
        'components': [
            {
                'type': 1,
                'components': [
                    {
                    "custom_id": `row_0_select_0`,
                    "placeholder": `Select games to remove from updates list`,
                    "options": parse_json_data(json_data, client),
                    "min_values": 1,
                    "max_values": json_data.length,
                    "type": 3
                    }
                ]
            }
        ]
    })
}

function parse_json_data(json_data, client) {
    let res = []
    for (data of json_data) {
        const game = constants.games[data['gameID']]

        res.push({
            'label': game.title,
            'value': data['gameID'],
            'default': false
        })
    }
    return res
}
