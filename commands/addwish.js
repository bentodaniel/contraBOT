const utils = require('../utils/utils')

module.exports = {
    name: 'addwish',
    short_name: 'aw',
    description: 'Add a game to your wish list. I will notify you when the game drops under a specified price (in €).',
    arguments: '[price] <game>',
    arguments_help: 'If [price] is not provided, the current price will be used',
    showOnHelp: true,
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

        const handle_reply_to_game_selection = function(interaction, game_json) {
            interaction.reply({ content: `Adding '**${game_json['title']}**' to your wishlist`, fetchReply: true }).then((response_msg) => {
                // handle adding to db

                if (isNaN(price)) {
                    price = parseFloat(game_json['price'])
                }

                const q = `REPLACE INTO WishList (userID, gameID, gameProductID, price) VALUES('${message.author.id}', '${game_json['title']}', '${game_json['productID']}', ${price})`
                
                db.query(q, async (error, results) => {
                    if (error) {
                        utils.send_error_message(message, `Failed to add the game '${game_json['title']}' to your wishlist`, 'send')
                        console.log(`ERROR :: could not add the game '${game_json['title']}' to user '${message.author.id}' wishlist\n `, error.message)
                    }
                    else {
                        utils.send_success_message(message, `Game '${game_json['title']}' has been added to your wishlist`, 'send')
                    }
                });
            })
        }
        utils.message_search_games_list('allkeyshop', game, message, handle_reply_to_game_selection)
    }
}
