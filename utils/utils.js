const request = require('request');
const cheerio = require('cheerio');
const xhr_req = require('xhr-request');

module.exports = {
    get_game_offers,
    message_search_games_list,
    send_error_message,
    reply_error_interaction,
    send_success_message,
    get_user_wishlist,
    get_guild_updates
}

/**
 * 
 * @param {*} store 
 * @param {*} game_search 
 * @param {*} user_message 
 * @param {*} callback A function callback. Must take 2 arguments: the interaction instance and the embed corresponding to the game selected
 */
function message_search_games_list(store, game_search, user_message, callback, selection_msg_content, selection_limit) {
    user_message.channel.send(`Searching for results on ${game_search}...`).then(msg => {
        get_games_list(store, game_search).then(games_list => {
            if (games_list === undefined) {
                send_error_message(msg, 'Failed to get the data', 'edit')
            }
            else if (games_list.length === 0){
                send_error_message(msg, 'No results were found', 'edit')
            }
            else {
                reply_search_selection(games_list, msg, game_search, selection_msg_content)

                limit_clicks = 30
                if (selection_limit !== undefined) {
                    limit_clicks = selection_limit
                } 

                // check if the interaction is in the same message
                const filter = (click) => click.message.id === msg.id
                const collector = user_message.channel.createMessageComponentCollector({
                    max: limit_clicks, // The number of times a user can click on the button
                    time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                    filter // Add the filter
                });

                collector.on("collect", async interaction => {
                    const target_game = find_productID_data(games_list, interaction.values[0])

                    callback(interaction, target_game, interaction.user);
                });
            
                collector.on("end", (collected) => {
                    //send_error_message(msg, 'Time is over', 'edit', msg['content'])
                    const component = msg.components[0]
                    component.components[0].disabled = true

                    msg.edit({
                        components: [component]
                    })
                    .catch(msg_error => {
                        console.log(`ERROR :: could not edit message_search_games_list message to disable selection to channel ${msg.channelId} in guild ${msg.guildId}\n `, msg_error)
                    });
                });
            }
        })
        .catch(err => {
            send_error_message(msg, 'Failed to get the data', 'edit')
        })
    })
    .catch(msg_error => {
        console.log(`ERROR :: could not send placeholder message on message_search_games_list to channel ${user_message.channelId} in guild ${user_message.guildId}\n `, msg_error)
    });
}

/**
 * Returns a list containing all search results or undefined if it fails
 * @param {*} store The store to search on. Can be allkeyshop
 * @param {*} game_search The game to search
 */
async function get_games_list(store, game_search) {
    if (store === 'allkeyshop') {
        return get_allkeyshop_games_list(game_search)
    }
    else if (store === 'steam') {
        // TODO
        return undefined
    }
    return undefined
}

function get_allkeyshop_games_list(game_search) {
    return new Promise((success, failure) => {
        request(`https://www.allkeyshop.com/blog/catalogue/search-${game_search}/`, function (error, response, body) {
            if (error || !body){
                console.log(`ERROR :: trying to search for '${game_search}'\n `, error);
                failure()
            }
            else {
                var json_data = [];
                const $ = cheerio.load(body);

                // Loop through each of the link results
                $('.search-results-row-link').each(function(i, link_child){
                    var data = {}

                    var link_url = $(link_child).attr('href')
                    data['link'] = link_url;
                    
                    // Loop through the children
                    for (child of $(link_child).children()) {
                        var cName = $(child).attr('class')

                        if (cName === 'search-results-row-image') {
                            var image_div_url = $(child).children()[0].attribs['style']
                            image_div_url = image_div_url.replace(/.*url\(/g, '').slice(0, -1) // keep only the link
                            data['image_link'] = image_div_url;
                        }
                        else if (cName === 'search-results-row-game') {
                            for (gamec of $(child).children()) {
                                if ($(gamec).attr('class') === 'search-results-row-game-title') {
                                    data['title'] = $(gamec).text();
                                }
                                else if ($(gamec).attr('class') === 'search-results-row-game-infos') {
                                    data['infos'] = $(gamec).text();
                                }
                            }
                        }
                        else if (cName === 'metacritic d-none d-xl-block') {
                            const metacriticChild = $(child).children()[0]
                            var productId = $(metacriticChild).attr('data-product-id')
                            data['productID'] = parseInt(productId)
                        }
                        else if (cName === 'search-results-row-price') {
                            data['price'] = $(child).text().trim().replace(/(\r\n|\n|\r)/gm, "");
                        }
                    }
                    json_data.push(data)
                });
                success(json_data)
            }
        });
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

function reply_search_selection(json_data, message, game_search, selection_msg_extra_content) {
    if (selection_msg_extra_content === undefined) {
        selection_msg_extra_content = ''
    }

    message.edit({
        'content': `Here is the list of search results for '**${game_search}**'` + selection_msg_extra_content,
        'components': [
            {
                'type': 1,
                'components': [
                    {
                    "custom_id": `search_selection`,
                    "placeholder": `Select an item to get more info on prices`,
                    "options": parse_json_data(json_data),
                    "min_values": 1,
                    "max_values": 1,
                    "type": 3
                    }
                ]
            }
        ]
    })
    .catch(msg_error => {
        console.log(`ERROR :: could not send selection message on reply_search_selection to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
    });
}

function parse_json_data(json_data) {
    res = []
    for (game of json_data) {
        res.push({
            'label': `${game['title']}\u1CBC|\u1CBC${game['price']}`,
            'description': `${game['infos']}`,
            'value': '' + game['productID'],
            'default': false
        })
    }
    return res
}

function find_productID_data(json_data, productID) {
    for(game of json_data) {
        if (game['productID'] === parseInt(productID)) {
            return game
        }
    }
    return undefined
}

function send_error_message(message, error_msg, type, content) {
    content = typeof content  !== 'undefined' ? content : ' ';
    if (type === 'edit') {
        message.edit({
            'content' : content,
            'embeds' : [{
                'type' : 'rich',
                'title': error_msg,
                'color' : 0xff0000,
            }],
            'components': []
        })
        .catch(msg_error => {
            console.log(`ERROR :: failed to edit message on send_error_message to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
        });
    }
    else if (type === 'send') {
        message.channel.send({
            'content' : content,
            'embeds' : [{
                'type' : 'rich',
                'title': error_msg,
                'color' : 0xff0000,
            }],
            'components': []
        })
        .catch(msg_error => {
            console.log(`ERROR :: failed to send message on send_error_message to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
        });
    }
}

function reply_error_interaction(interaction, error_msg, content) {
    interaction.reply({ 
        content: content, 
        embeds: [
            {
                'type' : 'rich', 
                'title': error_msg, 
                'color' : 0xff0000,
            }
        ], 
        components: [], 
        fetchReply: true 
    })
    .catch(msg_error => {
        console.log(`ERROR :: failed to reply to interaction on reply_error_interaction to channel ${interaction.channelId} in guild ${interaction.guildId}\n `, msg_error)
    });
}

function send_success_message(message, success_msg, type, content) {
    content = typeof content  !== 'undefined' ? content : ' ';
    if (type === 'edit') {
        message.edit({
            'content' : content,
            'embeds' : [{
                'type' : 'rich',
                'title': success_msg,
                'color' : 0x6fff00,
            }],
            'components': []
        })
        .catch(msg_error => {
            console.log(`ERROR :: failed to edit message on send_success_message to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
        });
    }
    else if (type === 'send') {
        message.channel.send({
            'content' : content,
            'embeds' : [{
                'type' : 'rich',
                'title': success_msg,
                'color' : 0x6fff00,
            }],
            'components': []
        })
        .catch(msg_error => {
            console.log(`ERROR :: failed to send message on send_success_message to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
        });
    }
}

function get_user_wishlist(db, userID) {
    return new Promise((success, failure) => {
        const wishlist_query = `SELECT gameID, gameProductID, gameLink, price, receiveNotifications, store FROM WishList WHERE userID = '${userID}'`
        
        db.query(wishlist_query, async (error, results) => {
            if (error) {
                console.log(`ERROR :: failed to get wishlist for user '${userID}'\n `, error)
                failure()
            }
            else {
                success(results)
            }
        });
    })
}

function get_guild_updates(db, guildID) {
    return new Promise((success, failure) => {
        const updateslist_query = `SELECT gameID, channelID FROM UpdatesChannels WHERE guildID = '${guildID}'`

        db.query(updateslist_query, async (error, results) => {
            if (error) {
                console.log(`ERROR :: failed to get updates list for guild '${guildID}'\n `, error)
                failure()
            }
            else {
                success(results)
            }
        });
    })
}
