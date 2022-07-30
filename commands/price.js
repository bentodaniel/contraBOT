const utils = require('../utils/utils');
const embedPpagination = require('../utils/embedPagination');

module.exports = {
    name: 'price',
    short_name: 'p',
    description: 'Check the price of a game in allkeyshop',
    arguments: '<game to search>',
    showOnHelp: true,
    execute(client, message, args, Discord, db) {
        const handle_reply_to_game_selection = function(interaction, game_json, user) {
            utils.get_game_offers(game_json['productID'], 'eur', 10).then(game_offers_list => {
                if (game_offers_list === undefined) {
                    utils.reply_error_interaction(interaction, 'Failed to get the data', user.toString())
                }
                else if (game_offers_list.length === 0){
                    utils.reply_error_interaction(interaction, 'There are no offers for this product', user.toString())
                }
                else {
                    const embeds = generate_embeds_buy(game_offers_list, Discord, game_json)

                    interaction.reply({content: `Getting offers  for '**${game_json['title']}**'...`, fetchReply: true }).then(reply_msg => {
                        embedPpagination(Discord, reply_msg, embeds, 120000).then(paginated_msg => {
                            // todo - possibly could also add a 'add to wishlist' button
    
                            paginated_msg.edit({'content': `${user.toString()}, here are the results for '**${game_json['title']}**'`})
                        })
                    })
                }
            })
            .catch(err => {
                console.log(err)
                utils.reply_error_interaction(interaction, 'Failed to get the data', user.toString())
            })
        }
        utils.message_search_games_list('allkeyshop', args, message, handle_reply_to_game_selection)
    }
}

function generate_embeds_buy(game_offers_list, Discord, game_json) {
    var embeds = [];
    for (game of game_offers_list) {
        var embed = new Discord.MessageEmbed()
            .setTitle(game['market'] + ' - BUY')
            .setURL(game['buy_link'])
            .setColor('#6fff00')
            .setThumbnail(game_json['image_link'])
            .addFields(
                {
                    "name": `Region`,
                    "value": `${game['region']}`,
                    "inline": true
                },
                {
                    "name": `Edition`,
                    "value": `${game['edition']}`,
                    "inline": true
                },
                {
                    'name': '\u200B',
                    'value': '\u200B',
                    'inline': true
                },
                {
                    "name": `Old Price`,
                    "value": `${game['og_price'] === '' ? 'N/A' : game['og_price']}€`, // Note that it could not be eur
                    "inline": true
                },
                {
                    "name": `Coupon`,
                    "value": `*${game['coupon_code']}*`,
                    "inline": true
                },
                {
                    "name": `Price`,
                    "value": `${game['price']}€`, // Note that it could not be eur
                    "inline": true
                }
            );
        embeds.push(embed)
    }
    return embeds;
}
