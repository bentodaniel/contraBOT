const utils = require('../utils/utils')

module.exports = {
    name: 'addwish',
    short_name: 'aw',
    description: 'Add a game to your wish list. I will notify you when the game drops under a specified price (in €).',
    arguments: '<game> [price]',
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {

        // TODO - handle the arguments...

        const handle_reply_to_game_selection = function(interaction, game_json) {
            interaction.reply({ content: `Adding '**${game_json['title']}**' to your wishlist`, fetchReply: true }).then((response_msg) => {
                // TODO - handle adding to db   
            })
        }

        utils.message_search_games_list('allkeyshop', args, message, handle_reply_to_game_selection)
    }
}

