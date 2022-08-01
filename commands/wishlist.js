const utils = require('../utils/utils')

module.exports = {
    name: 'wishlist',
    short_name: 'wl',
    description: 'Displays a user\'s wish list',
    arguments: '<@user>',
    arguments_help: 'If no user is provided, this will display your wishlist',
    showOnHelp: true,
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
                    })
                    .catch(msg_error => {
                        console.log(`ERROR :: could not send 'empty wishlist' message on wishlist to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
                    });
                }
                else {
                    embed = new Discord.MessageEmbed()
                        .setTitle(`${user.username}'s wishlist`)
                        .setColor('#6fff00')
                    
                    embed = get_fields(json_data, embed)

                    msg.edit({
                        'content' : ' ',
                        'embeds' : [embed]
                    })
                    .catch(msg_error => {
                        console.log(`ERROR :: could not send 'wishlist' message on wishlist to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
                    });
                }
            })
            .catch(err => {
                //console.log('ERROR :: failed to get wishlist\n ', err) // already logged when executing function
                utils.send_error_message(msg, 'Failed to get wishlist data', 'edit')
            })
        })
        .catch(msg_error => {
            console.log(`ERROR :: could not send placeholder message on wishlist to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
        });
    }
}

function get_fields(json_data, embed) {
    var games = ''
    var prices = ''

    for (data of json_data) {
        games += `[${data['gameID']}](${data['gameLink']})\n`
        prices += `${data['price']}€\n`
    }

    embed.addFields(
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
    )

    // TODO - in the future, could also display the store, if steam is integrated
    
    return embed
}