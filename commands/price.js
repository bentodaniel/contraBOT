const request = require('request');
const cheerio = require('cheerio');
const xhr_req = require('xhr-request');
const paginationEmbed = require('discordjs-button-pagination');
const utils = require('../utils/utils');

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
                    const embeds = generate_embeds_buy(game_offers_list, Discord)
                    const buttons = get_pagination_buttons(Discord)

                    paginationEmbed(interaction, embeds, buttons, 120000).then(paginated_msg => {
                        paginated_msg.edit({'content': `${user.toString()}, here are the results for '**${game_json['title']}**'`})
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

function get_pagination_buttons(Discord) {
    const button1 = new Discord.MessageButton()
        .setCustomId('previousbtn')
        .setLabel('Previous')
        .setStyle('SECONDARY');

    const button2 = new Discord.MessageButton()
        .setCustomId('nextbtn')
        .setLabel('Next')
        .setStyle('SECONDARY');

    return [button1, button2]
}

function generate_embeds_buy(json_data, Discord) {
    var embeds = [];
    for (game of json_data) {
        var embed = new Discord.MessageEmbed()
            .setTitle(game['market'] + ' - BUY')
            .setURL(game['buy_link'])
            .setColor('#6fff00')
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
