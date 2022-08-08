const utils = require('../utils/utils')

module.exports = {
    name: 'addwish',
    short_name: 'aw',
    description: 'Add a game to your wishlist. I will notify you when the game drops under a specified price (in €).',
    arguments: '<game>',
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // Callback
        const handle_reply_to_game_selection = function(interaction, game_json) {
            const selection_message = interaction.message
            const user = interaction.user

            handleAddToWishlist(Discord, db, interaction, game_json, user).then(result => {
                utils.send_success_message(selection_message, result, 'edit', user.toString())
            })
            .catch(error => {
                utils.send_error_message(selection_message, error, 'edit')
            })
        }
        utils.message_search_games_list('allkeyshop', args, message, handle_reply_to_game_selection, false, '\nSelect a game you want to add to your wishlist')
    },
    handleAddToWishlist
}

async function handleAddToWishlist(Discord, db, interaction, game_json, user) {
    return new Promise((success, failure) => {
        // Get games this user has wishlisted
        const select_q = `SELECT gameProductID FROM WishList WHERE userID = ${user.id}`
        db.query(select_q, async (select_error, select_results) => {
            if (select_error) {
                failure(`An error has occurred. Please try again`)
                console.log(`ERROR :: could not get wishlist data for user '${user.id}'\n `, select_error)
            }
            else {
                // Check what type of user this is
                const premium_q = `SELECT 1 FROM PremiumUsers WHERE userID = ${user.id} LIMIT 1`
                db.query(premium_q, async (premium_error, premium_results) => {
                    if (premium_error) {
                        failure(`An error has occurred. Please try again`)
                    }
                    else {
                        // Set the max rows according to the results
                        let entry_limit = process.env.BASE_USER_WISHLIST_LIMIT
                        if (premium_results.length > 0) {
                            entry_limit = process.env.PREMIUM_USER_WISHLIST_LIMIT
                        }

                        // Check if there is still space for more rows
                        if (select_results.length >= entry_limit && !gameInList(game_json['productID'], select_results)) {
                            failure(`You have reached the wishlist limit of ${entry_limit} games`)
                        }
                        else {
                            // Parse title. Max length og label is 45 char
                            let title = game_json['title']
                            if (title.length > 45) {
                                title = title.substring(0, 42)
                                title += '...'
                            }

                            const modal = new Discord.Modal()
                                .setCustomId('priceModal')
                                .setTitle(title)
                                .addComponents([
                                    new Discord.MessageActionRow().addComponents(
                                        new Discord.TextInputComponent()
                                            .setCustomId('priceInput')
                                            .setLabel(`Price target (€)`)
                                            .setStyle('SHORT')
                                            .setMinLength(1)
                                            .setMaxLength(10)
                                            .setPlaceholder(game_json['price'])
                                            .setValue(game_json['price'])
                                            .setRequired(true),
                                    ),
                                ]);

                            await interaction.showModal(modal);

                            // Get the Modal Submit Interaction that is emitted once the User submits the Modal
                            interaction.awaitModalSubmit({
                                // Timeout after a minute of not receiving any valid Modals
                                time: 10000,
                                // Make sure we only accept Modals from the User who sent the original Interaction we're responding to
                                filter: click => click.user.id === interaction.user.id,
                            })
                            .then(submit => {
                                // Get the desired price
                                const value = submit.fields.getTextInputValue('priceInput')
                                let price = parseFloat(value)

                                if (isNaN(price)) {
                                    failure(`'${value}' is not a valid number`)
                                }
                                else {
                                    // Insert or replace a game in wishlist
                                    const replace_q = `REPLACE INTO WishList (userID, gameID, gameProductID, gameLink, gameImageLink, price) VALUES('${user.id}', '${game_json['title']}', '${game_json['productID']}', '${game_json['link']}', '${game_json['image_link']}', ${price})`
                                    db.query(replace_q, async (error, results) => {
                                        if (error) {
                                            failure(`Failed to add the game '${game_json['title']}' to your wishlist`)
                                            console.log(`ERROR :: could not add the game '${game_json['title']}' to user '${user.id}' wishlist\n `, error)
                                        }
                                        else {
                                            success(`Game '${game_json['title']}' has been added to your wishlist`)
                                        }
                                    });
                                }
                                submit.deferUpdate()
                            })
                            .catch(error => {
                                // Catch any Errors that are thrown (e.g. if the awaitModalSubmit times out after 60000 ms)
                                //failure(`An error has occurred or the operation has been canceled`)
                            })
                        }
                    }
                });
            }
        });
    })
}

function gameInList(gameID, games_list) {
    for (dict of games_list) {
        if (dict['gameProductID'] === gameID) {
            return true
        }
    }
    return false
}
