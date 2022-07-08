const utils = require('../utils/utils')

module.exports = {
    name: 'wishlist',
    short_name: 'wl',
    description: 'Displays your wish list',
    arguments: '',
    showOnHelp: false,
    async execute(client, message, args, Discord, db) {
        var user = message.mentions.users.first()
        if (user === undefined) {
            user = message.author
        }

        message.channel.send(`Getting ${user.username}'s wishlist...`).then(msg => {
            utils.get_user_wishlist(db, user.id).then(json_data => {

                if (json_data.length === 0) {
                    msg.edit({
                        'content' : ' ',
                        'embeds' : [{
                            'type' : 'rich',
                            'title': `${user.username}'s wishlist is empty`,
                            'color' : 0x6fff00
                        }]
                    });
                }
                else {
                    msg.edit({
                        'content' : ' ',
                        'embeds' : [{
                            'type' : 'rich',
                            'title': `${user.username}'s wishlist`,
                            'color' : 0x6fff00,
                            'fields': get_fields(json_data)
                        }]
                    });
                }
            })
            .catch(err => {
                utils.send_error_message(msg, 'Failed to get wishlist data', 'edit')
            })
        })
    }
}

function get_fields(json_data) {
    var games = ''
    var prices = ''

    for (data of json_data) {
        games += `${data['gameID']}\n`
        prices += `${data['price']}€\n`
    }

    return [
        {
          "name": `Game Title`,
          "value": games,
          "inline": true
        },
        {
          "name": `Desired Price`,
          "value": prices,
          "inline": true
        }
    ]
}