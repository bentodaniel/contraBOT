const xhr_req = require('xhr-request');

const embedPagination = require('../embedPagination');

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

    get_game_offers(game_json['productID'], 'eur', 10, 'allkeyshop').then(game_offers_list => {
        if (game_offers_list === undefined) {
            interaction.reply({ content: `Failed to get the data for '${game_json['title']}'.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'fail to get data' reply on 'handleComparePrices' :: `, error)
            })
        }
        else if (game_offers_list.length === 0){
            interaction.reply({ content: `There are no offers for '${game_json['title']}'.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'no offers' reply on 'handleComparePrices' :: `, error)
            })
        }
        else {
            const embeds = generate_compare_prices_embeds(Discord, game_offers_list, game_json)

            interaction.reply({
                content: `Getting offers  for '**${game_json['title']}**'...`,
                fetchReply: true
            })
            .then(reply_msg => {
                const wishlist_btn = new Discord.ButtonBuilder()
                    .setCustomId('wishlistbtn')
                    .setLabel('Add to Wishlist')
                    .setStyle('Primary')
                
                embedPagination(
                    Discord, reply_msg, embeds, timeout, `${user.toString()}, here are the results for '**${game_json['title']}**'`, wishlist_btn
                )
                .catch(paginate_error => {console.log(paginate_error)})
            })
            .catch(err => {
                console.log(`ERROR :: Failed to send placeholder reply on 'handleComparePrices' :: `, err)
            })
        }
    })
    .catch(get_game_offers_error => {
        console.log(`ERROR :: Failed to fetch offers for a game in handleComparePrices :: `, get_game_offers_error)

        interaction.reply({ content: `Failed to get offers for this game. Please try again`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'fail to get offers' reply on 'handleComparePrices' :: `, error)
        })
    })
}

/**
 * Gets a number of available offers for a certain game
 * @param {*} gameProductID The ID of the product
 * @param {*} currency The currency
 * @param {*} limit The maximum number of entries
 * @param {*} store The store. Can be 'allkeyshop'
 * @returns 
 */
function get_game_offers(gameProductID, currency, limit, store) {
    if (store === 'allkeyshop') {
        return get_allkeyshop_game_offers(gameProductID, currency, limit)
    }
    return undefined
}

/**
 * Gets a list of game offers in AllKeyShop
 * Offers come in JSON formar { buy_link, market, region, edition, og_price, price, coupon_value, coupon_code }
 * @param {*} gameProductID The allkeyshop product id
 * @param {*} currency The currency to use. Can be \"eur\", \"gbp\", \"usd\"
 * @param {*} limit The limit number of entries in the list
 * @returns 
 */
async function get_allkeyshop_game_offers(gameProductID, currency, limit) {
    return new Promise((success, failure) => {
        var json_data = [];

        xhr_req(`https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php?action=get_offers&product=${gameProductID}&currency=${currency}&region=&edition=&moreq=&use_beta_offers_display=1`, {
            json: true
        }, function (err, req_data) {
            if (err) {
                console.log(`ERROR :: failed to get xhr data for product ${gameProductID} :: `, err)
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

/**
 * Generated the embeds for game offers
 * @param {*} Discord The Discord instance
 * @param {*} game_offers_list A list containing all offers for a game as { buy_link, market, region, edition, og_price, price, coupon_value, coupon_code }
 * @param {*} game_json The JSON game we are searching { link, image_link, title, infos, productID, price }
 * @returns 
 */
function generate_compare_prices_embeds(Discord, game_offers_list, game_json) {
    var embeds = [];
    for (game_offer of game_offers_list) {
        const embed = new Discord.EmbedBuilder()
            .setTitle(`${game_json['title']} [${game_json['productID']}]`)
            .setURL(game_json['link'])
            .setDescription(`[${game_offer['market']} - BUY](${game_offer['buy_link']})\n`)
            .setColor('#ffffff')
            .setThumbnail(game_json['image_link'])
            .addFields(
                {
                    "name": `Region`,
                    "value": `${game_offer['region']}`,
                    "inline": true
                },
                {
                    "name": `Edition`,
                    "value": `${game_offer['edition']}`,
                    "inline": true
                },
                {
                    'name': '\u200B',
                    'value': '\u200B',
                    'inline': true
                },
                {
                    "name": `Old Price`,
                    "value": `${game_offer['og_price'] === '' ? 'N/A' : game_offer['og_price']}€`, // Note that it could not be eur
                    "inline": true
                },
                {
                    "name": `Coupon`,
                    "value": `*${game_offer['coupon_code']}*`,
                    "inline": true
                },
                {
                    "name": `Price`,
                    "value": `${game_offer['price']}€`, // Note that it could not be eur
                    "inline": true
                }
            );
        embeds.push(embed)
    }
    return embeds;
}

module.exports = {
    handleComparePrices,
    get_game_offers
}