const dbUtils = require('../database/utils')
const embedPagination = require('../utils/embedPagination')

module.exports = {
    name: 'wishlist',
    short_name: 'wl',
    description: 'Displays a user\'s wish list',
    arguments: '<@user>',
    arguments_help: 'If no user is provided, this will display your wishlist',
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // Check if a user was mentioned. If not, then the author is the target
        var target_user = message.mentions.users.first()
        if (target_user === undefined) {
            target_user = message.author
        }

        // Send placeholder message
        message.channel.send(`Getting data from database...`).then(placeholder_wishlist_msg => {
            dbUtils.get_user_wishlist(db, target_user.id).then(json_data => {
                const embeds = getEmbeds(Discord, json_data, target_user)
                
                // create the button
                // by default, disable
                const removeWishBtn = new Discord.MessageButton()
                    .setCustomId(`removefromwishlistbtn-${target_user.id}`)
                    .setLabel('Remove from Wishlist')
                    .setStyle('DANGER')
                    .setDisabled(json_data.length === 0) // disable if the list is empty

                if (embeds.length === 1) {
                    // if there is nothing or there is only one page (less than 10), there is no need for pagination

                    placeholder_wishlist_msg.edit({
                        embeds: embeds,
                        components: [new Discord.MessageActionRow().addComponents(removeWishBtn)]
                    })
                    .catch(error => {
                        console.log(`ERROR :: Failed to send wishlist message for 'wishlist' command :: `, error)
                    })
                }
                else {
                    // If there is more than one page, then use pagination
                    embedPagination(
                        Discord, placeholder_wishlist_msg, embeds, 120000, null, removeWishBtn
                    )
                    .catch(paginate_error => {
                        console.log(`ERROR :: Failed to send paginated wishlist message for 'wishlist' command :: `, error)
                    })
                }
            })
            .catch(err => {
                console.log(`ERROR :: Failed to get wishlist data on 'wishlist' command :: `, err)

                // Edit placeholder to inform the user
                placeholder_wishlist_msg.edit({
                    embeds : [{
                        'type' : 'rich',
                        'title': `There was an error while trying to get wishlist data from database. Please try again.`,
                        'color' : 0xffffff,
                    }]
                })
                .catch(error => {
                    console.log(`ERROR :: Failed to send error message for 'wishlist' command :: `, error)
                })
            })
        })
        .catch(placeholder_wishlist_msg_error => {
            console.log(`ERROR :: Failed to send placeholder message for 'wishlist' command :: `, placeholder_wishlist_msg_error)
        })
    }
}

/**
 * Generate all embeds needed to display the wishlist
 * @param {*} Discord The Discord instance
 * @param {*} json_data The json containing the wishlist data
 * @param {*} target_user The targeted user
 * @returns 
 */
function getEmbeds(Discord, json_data, target_user) {
    embedList = []

    if (json_data.length === 0) {
        embedList.push(
            new Discord.MessageEmbed()
                .setColor('#ffffff')
                .setTitle(`${target_user.username}'s wishlist is empty.`)
        )
    }
    else {
        var games = ''
        var prices = ''

        for (let i = 0; i < json_data.length; i++) {
            const current_game = `[${json_data[i]['gameID']}](${json_data[i]['gameLink']})\n`
            const current_price = `${json_data[i]['price']}€\n`

            // If we can fit one more row, add it
            if (games.length + current_game.length < 1024 && prices.length + current_price.length < 1024) {
                games += current_game
                prices += current_price
            }
            else {
                const fields = [
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
                
                // create a new embed with current items
                embedList.push(
                    new Discord.MessageEmbed()
                        .setColor('#ffffff')
                        .setTitle(`${target_user.username}'s wishlist`)
                        .addFields(fields)
                )

                // reset games and prices
                games = ''
                prices = ''

                // add current game and price
                games += current_game
                prices += current_price
            }

            // what if it is the last index? just add embed
            if (i === json_data.length - 1) {
                const fields = [
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
                
                // create a new embed with current items
                embedList.push(
                    new Discord.MessageEmbed()
                        .setColor('#ffffff')
                        .setTitle(`${target_user.username}'s wishlist`)
                        .addFields(fields)
                )
            }
        }
    }
    return embedList
}
