const utils = require('../utils/utils')

module.exports = {
    name: 'stopwish',
    short_name: 'sw',
    description: 'Remove a game from your wish list.',
    arguments: '',
    showOnHelp: false,
    async execute(client, message, args, Discord, db) {
        message.channel.send(`Getting wishlist data...`).then(msg => {
            utils.get_user_wishlist(db, message.author.id).then(json_data => {
                if (json_data.length === 0) {
                    msg.edit({
                        'content' : ' ',
                        'embeds' : [{
                            'type' : 'rich',
                            'title': `${message.author.username}'s wishlist is empty`,
                            'color' : 0x6fff00
                        }]
                    });
                }
                else {
                    send_selection_message(json_data, msg, message.author)

                    // check if the user is the owner of the request and if the interaction is in the same message
                    const filter = (click) => click.user.id === message.author.id && click.message.id == msg.id
                    const collector = message.channel.createMessageComponentCollector({
                        max: 10, // The number of times a user can click on the button
                        time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                        filter // Add the filter
                    });

                    collector.on("collect", async interaction => {
                        if (interaction.componentType === 'SELECT_MENU') {
                            
                            console.log(interaction)

                            
                            

                            /*
                            const q = `DELETE FROM UpdatesChannels WHERE gameID = '${game}' AND guildID = ${message.guild.id}`
                            
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
                            */







                        }
                    });
            
                    collector.on("end", (collected) => {
                        utils.send_error_message(msg, 'Time is over', 'edit', msg['content'])
                    });
                }
            })
            .catch(err => {
                console.log(err)
                utils.send_error_message(msg, 'Failed to get wishlist data', 'edit')
            })
        })
    }
}

function send_selection_message(json_data, message, user) {
    message.edit({
        'content': `${user.toString()} select the items you would like to remove from your wishlist`,
        'components': [
            {
                'type': 1,
                'components': [
                    {
                    "custom_id": `row_0_select_0`,
                    "placeholder": `Select items to remove from wishlist`,
                    "options": parse_json_data(json_data),
                    "min_values": 1,
                    "max_values": json_data.length,
                    "type": 3
                    }
                ]
            }
        ]
    })
}

function parse_json_data(json_data) {
    res = []
    for (data of json_data) {
        res.push({
            'label': data['gameID'],
            'description': `Desired price: ${data['price']}€`,
            'value': '' + data['gameProductID'],
            'default': false
        })
    }
    return res
}
