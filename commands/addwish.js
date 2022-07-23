const utils = require('../utils/utils')

module.exports = {
    name: 'addwish',
    short_name: 'aw',
    description: 'Add a game to your wish list. I will notify you when the game drops under a specified price (in €).',
    arguments: '[price] <game>',
    arguments_help: 'If [price] is not provided, the current price will be used',
    showOnHelp: false,
    async execute(client, message, args, Discord, db) {
        // Parse arguments and get price
        const args_list = args.split(' ')
        if (args_list.length === 0) {
            utils.send_error_message(message, `No arguments were provided`, 'send')
            return
        }

        var price = parseFloat(args_list[0])
        if (!isNaN(price)) {
            // as a valid price was given, remove it from the list
            args_list.shift()
        }
        
        // join the remaining into a string
        const game = args_list.join(' ')

        // Callback
        const handle_reply_to_game_selection = function(interaction, game_json, user) {
            interaction.reply({ content: `Adding '**${game_json['title']}**' to your wishlist`, fetchReply: true }).then((response_msg) => {
                // handle adding to db

                if (isNaN(price)) {
                    price = parseFloat(game_json['price'])
                }

                const select_q = `SELECT gameProductID FROM WishList WHERE userID = ${user.id}`

                db.query(select_q, async (select_error, select_results) => {
                    if (select_error) {
                        utils.send_error_message(response_msg, `Failed to get wishlist data`, 'edit')
                        console.log(`ERROR :: could not get wishlist data for user '${user.id}'\n `, select_error.message)
                    }
                    else {
                        let entry_limit = 5

                        const premium_q = `SELECT 1 FROM PremiumUsers WHERE userID = ${message.author.id} LIMIT 1`

                        db.query(premium_q, async (premium_error, premium_results) => {
                            if (!premium_error) {
                                if (premium_results.length > 0) {
                                    entry_limit = 20
                                }
                            }

                            if (select_results.length >= entry_limit && !gameInList(game_json['productID'], select_results)) {
                                utils.send_error_message(response_msg, `You can not have more than ${entry_limit} games in your wishlist`, 'edit')
                            }
                            else {
                                const replace_q = `REPLACE INTO WishList (userID, gameID, gameProductID, price) VALUES('${user.id}', '${game_json['title']}', '${game_json['productID']}', ${price})`
                    
                                db.query(replace_q, async (error, results) => {
                                    if (error) {
                                        utils.send_error_message(response_msg, `Failed to add the game '${game_json['title']}' to your wishlist`, 'edit')
                                        console.log(`ERROR :: could not add the game '${game_json['title']}' to user '${user.id}' wishlist\n `, error.message)
                                    }
                                    else {
                                        utils.send_success_message(response_msg, `Game '${game_json['title']}' has been added to your wishlist`, 'edit', user.toString())
                                    }
                                });
                            }
                        });
                    }
                });
            })
        }
        utils.message_search_games_list('allkeyshop', game, message, handle_reply_to_game_selection, '\nSelect a game you want to add to your wishlist')
    }
}

function gameInList(gameID, games_list) {
    for (dict of games_list) {
        if (dict['gameProductID'] === gameID) {
            return true
        }
    }
    return false
}
