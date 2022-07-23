const utils = require('../utils/utils')

module.exports = {
    name: 'stopwish',
    short_name: 'sw',
    description: 'Remove games from your wish list.',
    arguments: '',
    showOnHelp: true,
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
                    send_selection_message(json_data, msg, message.author).then(select_msg => {
                        // check if the user is the owner of the request and if the interaction is in the same message
                        const filter = (click) => click.user.id === message.author.id && click.message.id == select_msg.id
                        const collector = message.channel.createMessageComponentCollector({
                            max: 1, // The number of times a user can click on the button
                            time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                            filter // Add the filter
                        });

                        collector.on("collect", async interaction => {
                            allow_time_fail = false

                            let gamesProductIDs = ''
                            for (gameProductID of interaction.values) {
                                gamesProductIDs += `'${gameProductID}', `
                            }
                            gamesProductIDs = gamesProductIDs.slice(0, -2)

                            const q = `DELETE FROM WishList WHERE userID = ${message.author.id} AND gameProductID IN (${gamesProductIDs})`

                            db.query(q, async (error, results) => {
                                if (error) {
                                    utils.send_error_message(select_msg, `Failed to remove one or more games from your wishlist`, 'edit')
                                }
                                else {
                                    utils.send_success_message(select_msg, `All selected games have been removed from your wishlist`, 'edit')
                                }
                            });
                        });
                
                        collector.on("end", (collected) => {
                            if (allow_time_fail) {
                                //utils.send_error_message(msg, 'Time is over', 'edit', msg['content'])
                                const component = msg.components[0]
                                component.components[0].disabled = true

                                msg.edit({
                                    components: [component]
                                })
                            }
                        });
                    })
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
    return message.edit({
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
