const request = require('request');
const cheerio = require('cheerio');
const xhr_req = require('xhr-request');
const utils = require('../utils/utils')

module.exports = {
    name: 'price',
    short_name: 'p',
    description: 'Check the price of a game in allkeyshop',
    arguments: '<game to search>',
    showOnHelp: true,
    execute(client, message, args, Discord, db) {
        const handle_reply_to_game_selection = function(interaction, game_json) {
            interaction.reply({ content: `Searching offers for '**${game_json['title']}**'`, fetchReply: true }).then((response_msg) => {
                scrape_buy(game_json).then(games_list => {
                    if (games_list === undefined) {
                        utils.send_error_message(response_msg, 'Failed to get the data')
                    }
                    else if (games_list.length === 0){
                        utils.send_error_message(response_msg, 'There are no offers for this product')
                    }
                    else {
                        handle_reply(games_list, response_msg, game_json['title']);
                    }
                })
                .catch(err => {
                    console.log(`ERROR :: trying to search for '${game_search}'`)
                })
            })
        }

        utils.message_search_games_list('allkeyshop', args, message, handle_reply_to_game_selection)
    }
}

async function scrape_buy(game_json) {
    return new Promise((success, failure) => {
        var json_data = [];
                
        // TODO - could also get with other currencies - accepted:  \"eur\", \"gbp\", \"usd\"
        const currency = 'eur'

        xhr_req(`https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php?action=get_offers&product=${game_json['productID']}&currency=${currency}&region=&edition=&moreq=&use_beta_offers_display=1`, {
            json: true
        }, function (err, req_data) {
            if (err) {
                console.log(err)
            }
            else {
                Object.entries(req_data['offers']).forEach(([key, value]) => {
                    var data = {}

                    data['buy_link'] = value.affiliateUrl
                    data['market'] = req_data['merchants'][value.merchant].name
                    data['region'] = req_data['regions'][value.region].filterName
                    data['edition'] = req_data['editions'][value.edition].name

                    var price_data = value.price[currency]

                    data['og_price'] = price_data.priceWithoutCoupon
                    data['price'] = price_data.price

                    var coupon_data = price_data.bestCoupon
                    if (coupon_data === null || coupon_data === undefined) {
                        data['coupon_value'] = 'N/A'
                        data['coupon_code'] = 'No coupon'
                    }
                    else {
                        data['coupon_code'] = coupon_data.code
                    }
                    json_data.push(data)
                });
                success(json_data)                   
            }
        })
    })
}

async function handle_reply(json_data, message, game_title) {
    var embeds = generate_embeds_buy(json_data);

    message.edit({
        "content": `Here are the top results for '**${game_title}**':`,
        "tts": false,
        "embeds": embeds,
    });
}

function generate_embeds_buy(json_data) {
    var embeds = [];
    var count = 1;
    for (game of json_data) {
        var new_embed = {}

        new_embed['type'] = 'rich';
        new_embed['title'] =  game['market'] + ' - BUY';
        new_embed['description'] = '';
        new_embed['color'] = 0x6fff00,
        new_embed['fields'] = [
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
        ]
        new_embed['url'] = game['buy_link'];

        embeds.push(new_embed)

        count += 1
        if (count > 10) break
    }
    return embeds;
}