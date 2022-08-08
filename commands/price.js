const utils = require('../utils/utils');
const embedPpagination = require('../utils/embedPagination');

module.exports = {
    name: 'price',
    short_name: 'p',
    description: 'Check the price of a game in allkeyshop',
    arguments: '<game to search>',
    showOnHelp: true,
    execute(client, message, args, Discord, db) {
        const handle_reply_to_game_selection = function(interaction, game_json) {
            const selection_message = interaction.message
            const user = interaction.user

            utils.get_game_offers(game_json['productID'], 'eur', 10).then(game_offers_list => {
                if (game_offers_list === undefined) {
                    utils.send_error_message(selection_message, 'Failed to get the data', 'edit', user.toString())
                }
                else if (game_offers_list.length === 0){
                    utils.send_error_message(selection_message, 'There are no offers for this product', 'edit', user.toString())
                }
                else {
                    const embeds = generate_embeds_buy(game_offers_list, Discord, game_json)

                    selection_message.edit({content: `Getting offers  for '**${game_json['title']}**'...`}).then(reply_msg => {
                        const wishlist_btn = new Discord.MessageButton()
                                                .setCustomId('wishlistbtn')
                                                .setLabel('Add to Wishlist')
                                                .setStyle('PRIMARY')
                        
                        embedPpagination(
                            Discord, reply_msg, embeds, 120000, `${user.toString()}, here are the results for '**${game_json['title']}**'`, wishlist_btn
                        )
                        .then(embed_msg => {
                            const wish_filter = (click) => click.customId === wishlist_btn.customId
                            const wish_collector = message.channel.createMessageComponentCollector({
                                wish_filter // Add the filter
                            });
            
                            wish_collector.on("collect", async interaction => {
                                if (interaction.customId === wishlist_btn.customId) {
                                    const addwish = require('./addwish')

                                    const selection_message = interaction.message
                                    const user = interaction.user

                                    addwish.handleAddToWishlist(Discord, db, interaction, game_json, user).then(result => {
                                        utils.send_success_message(selection_message, result, 'send', user.toString())
                                    })
                                    .catch(error => {
                                        utils.send_error_message(selection_message, error, 'send')
                                    })

                                    wish_collector.resetTimer();
                                }
                            });
                    
                            wish_collector.on("end", (collected) => {
                                // Everything is handled on pagination side
                            });
                        })
                        .catch(paginate_error => {})
                    })
                    .catch(err => {})
                }
            })
            .catch(err => {
                utils.send_error_message(selection_message, 'Failed to get the data', 'edit')
            })
        }
        utils.message_search_games_list('allkeyshop', args, message, handle_reply_to_game_selection, true)
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
