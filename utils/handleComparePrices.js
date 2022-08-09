const xhr_req = require('xhr-request');

const utils = require('./utils');
const embedPpagination = require('./embedPagination');

/**
 * Handle compare prices
 * This sends out a paginated message containing the offers for this game
 * @param {*} Discord The Discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The Interaction that originated this execution
 * @param {*} game_json The JSON object representing the game
 * @param {*} timeout The timeout for the buttons
 */
const handleComparePrices = async (Discord, interaction, game_json, timeout=120000) => {
    const selection_message = interaction.message
    const user = interaction.user

    get_game_offers(game_json['productID'], 'eur', 10).then(game_offers_list => {
        if (game_offers_list === undefined) {
            interaction.reply({ content: `Failed to get the data for '${game_json['title']}'.`, ephemeral: true }).catch(error => {})
        }
        else if (game_offers_list.length === 0){
            interaction.reply({ content: `There are no offers for '${game_json['title']}'.`, ephemeral: true }).catch(error => {})
        }
        else {
            const embeds = generate_embeds_buy(game_offers_list, Discord, game_json)

            console.log(embeds)

            interaction.reply({
                content: `Getting offers  for '**${game_json['title']}**'...`,
                fetchReply: true
            })
            .then(reply_msg => {
                const wishlist_btn = new Discord.MessageButton()
                    .setCustomId('wishlistbtn')
                    .setLabel('Add to Wishlist')
                    .setStyle('PRIMARY')
                
                embedPpagination(
                    Discord, reply_msg, embeds, timeout, `${user.toString()}, here are the results for '**${game_json['title']}**'`, wishlist_btn
                )
                .catch(paginate_error => {console.log(paginate_error)})
            })
            .catch(err => {console.log(err)})
        }
    })
    .catch(err => {
        //utils.send_error_message(selection_message, 'Failed to get the data', 'edit')
        console.log(err)
    })
}

// currencies - accepted:  \"eur\", \"gbp\", \"usd\"
async function get_game_offers(gameProductID, currency, limit) {
    return new Promise((success, failure) => {
        var json_data = [];

        xhr_req(`https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php?action=get_offers&product=${gameProductID}&currency=${currency}&region=&edition=&moreq=&use_beta_offers_display=1`, {
            json: true
        }, function (err, req_data) {
            if (err) {
                console.log(`ERROR :: failed to get xhr data for product ${gameProductID}\n `, err)
                failure()
            }
            else {
                Object.entries(req_data['offers']).some(([key, value]) => {
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

                    return json_data.length >= limit
                });
                success(json_data)                   
            }
        })
    })
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

module.exports = handleComparePrices