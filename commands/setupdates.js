const constants = require('../utils/constants')
const utils = require('../utils/utils');

module.exports = {
    name: 'setupdates',
    short_name: 'setu',
    description: 'Defines a channel for news about a game',
    arguments: '',
    adminOnly: true,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // only the owner has access to this command
        if (message.author.id !== message.guild.ownerId) {
            utils.send_error_message(message, 'You do not have permissions to use that command', 'send')
        }
        else {
            send_selection_message(constants.games, message).then((msg) => {
                // check if the user is the owner of the request, if it is the owner of the guild and if the interaction is in the same message
                const game_filter = (click) => click.user.id === message.author.id && click.user.id === message.guild.ownerId && click.message.id === msg.id
                const game_collector = message.channel.createMessageComponentCollector({
                    max: 30, // The number of times a user can click on the button
                    time: 1000 * 90, // The amount of time the collector is valid for in milliseconds,
                    game_filter // Add the filter
                });

                game_collector.on("collect", async interaction => {
                    if (interaction.message.id !== msg.id) return
                    const gameID = interaction.values[0]

                    message.guild.channels.fetch().then(channels => {
                        interaction.reply({ 
                            content:  `${interaction.user.toString()}, setting up updates for '**${constants.games[gameID].title}**'`,
                            components: [
                                {
                                    'type': 1,
                                    'components': [
                                        {
                                            "custom_id": `channel_select`,
                                            "placeholder": `Select channel`,
                                            "options": parse_channels(channels),
                                            "min_values": 1,
                                            "max_values": 1,
                                            "type": 3
                                        }
                                    ]
                                }
                            ], 
                            fetchReply: true 
                        })
                        .then(reply_msg => {
                            let allow_time_fail = true

                            const channel_filter = (click) => click.user.id === message.author.id && click.user.id === message.guild.ownerId && click.message.id === reply_msg.id
                            const channel_collector = message.channel.createMessageComponentCollector({
                                max: 1, // The number of times a user can click on the button
                                time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                                channel_filter // Add the filter
                            });
            
                            channel_collector.on("collect", async interaction => {
                                allow_time_fail = false

                                const channelID = interaction.values[0]

                                const channel = await client.channels.fetch(channelID)

                                const q = `REPLACE INTO UpdatesChannels (gameID, channelID, guildID) VALUES('${gameID}', ${channel.id}, ${message.guild.id})`
                                
                                db.query(q, async (error, results) => {
                                    if (error) {
                                        utils.send_error_message(reply_msg, `Failed to set the channel '${channel.name}' as default for '${constants.games[gameID].title}' updates`, 'edit')
                                    }
                                    else {
                                        utils.send_success_message(reply_msg, `Channel '${channel.name}' has been set as default for '${constants.games[gameID].title}' updates`, 'edit', channel.toString())
                                    }
                                });
                            });
                    
                            channel_collector.on("end", (collected) => {
                                if (allow_time_fail) {
                                    //utils.send_error_message(reply_msg, 'Channel selection time is over', 'edit', msg['content'])
                                    const component = reply_msg.components[0]
                                    component.components[0].disabled = true

                                    reply_msg.edit({
                                        components: [component]
                                    })
                                }
                            });
                        })
                    })
                });
        
                game_collector.on("end", (collected) => {
                    //utils.send_error_message(msg, 'Game selection time is over', 'edit', msg['content'])
                    const component = msg.components[0]
                    component.components[0].disabled = true

                    msg.edit({
                        components: [component]
                    })
                });
            })
        }
    }
}

async function send_selection_message(games, message) {
    return message.channel.send({
        'content': `Select the game you would like to set up for news and the channel where these news should show up`,
        'components': [
            {
                'type': 1,
                'components': [
                    {
                        "custom_id": `game_select`,
                        "placeholder": `Select game`,
                        "options": parse_game_data(games),
                        "min_values": 1,
                        "max_values": 1,
                        "type": 3
                    }
                ]
            }
        ]
    })
}

function parse_game_data(games) {
    res = []
    for (const [ game_id, game_data ] of Object.entries(games)) {
        res.push({
            'label': game_data.title,
            'value': '' + game_id,
            'default': false
        })
    }
    return res
}

function parse_channels(channels) {
    res = []
    channels.forEach(element => {
        if (element.type === 'GUILD_TEXT') {
            res.push({
                'label': element.name,
                'description': element.parent.name,
                'value': '' + element.id,
                'default': false
            })
        }
    });
    return res
}
