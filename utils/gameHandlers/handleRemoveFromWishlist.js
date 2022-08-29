const dbUtils = require('../../database/utils')

/**
 * Handle the execution of removing wishlisted items
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @param {*} json_data The json containing all data about wishlisted items
 */
const handleRemoveFromWishlist = async(db, interaction, json_data) => {
    const message = interaction.message
    const user = interaction.user

    message.channel.send({
        content : user.toString(),
        embeds : [{
            'type' : 'rich',
            'title': `Select the items you would like to remove from your wishlist.`,
            'color' : 0xffffff,
        }],
        components: [{
            'type': 1,
            'components': [{
                "custom_id": `remove_from_wishlist_select`,
                "placeholder": `Select items to remove from wishlist`,
                "options": parse_json_data(json_data),
                "min_values": 1,
                "max_values": json_data.length,
                "type": 3
            }]
        }]
    })
    .then(select_remove_from_wishlist_msg => {
        const filter = (click) => click.customId === 'remove_from_wishlist_select'
                
        const collector = select_remove_from_wishlist_msg.createMessageComponentCollector({
            //max: 1, // The number of times a user can click on the button
            time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
            filter // Add the filter
        });

        collector.on("collect", async i => {
            if (i.user.id !== user.id) {
                i.reply({ content: `This button is not for you.`, ephemeral: true }).catch(error => {
                    console.log(`ERROR :: Failed to send 'button not for you' reply on 'handleRemoveFromWishlist' :: `, error)
                })
            }
            else {
                let gamesProductIDs = ''

                for (gameProductID of i.values) {
                    gamesProductIDs += `'${gameProductID}', `
                }
                gamesProductIDs = gamesProductIDs.slice(0, -2) // remove the ', '

                const q = `DELETE FROM WishList WHERE userID = ${user.id} AND gameProductID IN (${gamesProductIDs})`

                db.query(q, async (error, results) => {
                    if (error) {
                        i.reply({ content: `Failed to remove one or more games from your wishlist.`, ephemeral: true }).catch(error => {
                            console.log(`ERROR :: Failed to send 'failed to remove' reply on 'handleRemoveFromWishlist' :: `, error)
                        })
                    }
                    else {
                        // Send message confirming the removal of items from the wishlist
                        i.reply({ content: `Successfully removed one or more games from your wishlist.`, ephemeral: true }).catch(error => {
                            console.log(`ERROR :: Failed to send 'success' reply on 'handleRemoveFromWishlist' :: `, error)
                        })
                    }
                });

                select_remove_from_wishlist_msg.delete().catch(error => {
                    console.log(`ERROR :: Failed to remove select message on 'handleRemoveFromWishlist' on success :: `, error)
                });
            }            
        })

        collector.on("end", (_, reason) => {
            if (reason !== "messageDelete") {
                select_remove_from_wishlist_msg.delete().catch(error => {
                    console.log(`ERROR :: Failed to remove select message on 'handleRemoveFromWishlist' on timeout :: `, error)
                });
            }
        })
    })
    .catch(select_remove_from_wishlist_msg_error => {
        console.log(`ERROR :: Failed to send selection message on 'handleRemoveFromWishlist' :: `, select_remove_from_wishlist_msg_error)
    });
}

/**
 * Parses json formatted data containing wishlist info into select menus options 
 * @param {*} json_data The db retrieved data
 * @returns 
 */
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

module.exports = handleRemoveFromWishlist