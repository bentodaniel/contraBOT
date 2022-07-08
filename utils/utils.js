const request = require('request');
const cheerio = require('cheerio');
const xhr_req = require('xhr-request');

const emoji_numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const PAGE_LIMIT = 5;

module.exports = {
    message_search_games_list,
    send_error_message,
    send_success_message,
    get_user_wishlist
}

/**
 * 
 * @param {*} store 
 * @param {*} game_search 
 * @param {*} user_message 
 * @param {*} callback A function callback. Must take 2 arguments: the interaction instance and the embed corresponding to the game selected
 */
function message_search_games_list(store, game_search, user_message, callback) {
    user_message.channel.send("Searching for results...").then(msg => {
        get_games_list(store, game_search).then(games_list => {
            if (games_list === undefined) {
                send_error_message(msg, 'Failed to get the data', 'edit')
            }
            else if (games_list.length === 0){
                send_error_message(msg, 'No results were found', 'edit')
            }
            else {
                reply_search(games_list, msg).then(() => {
                    // check if the user is the owner of the request and if the interaction is in the same message
                    const filter = (click) => click.user.id === user_message.author.id && click.message.id == msg.id
                    const collector = user_message.channel.createMessageComponentCollector({
                        max: 1, // The number of times a user can click on the button
                        time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                        filter // Add the filter
                    });

                    collector.on("collect", async interaction => {
                        msg.edit({
                            "components": []
                        })

                        const target_game = games_list[parseInt(interaction.customId)]

                        callback(interaction, target_game);
                    });
            
                    collector.on("end", (collected) => {
                        // Disable all buttons if time runs out
                        msg.edit({
                            "components": []
                        })
                    });
                })
            }
        })
        .catch(err => {
            send_error_message(msg, 'Failed to get the data', 'edit')
        })
    })
    
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
                console.log(`ERROR :: trying to search for '${game_search}'\n `, error.message);
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

/**
 * Sends a message containing all the search data
 * @param {*} json_data A list containing json game objects
 * @param {*} message The original message we want to edit
 */
async function reply_search(json_data, message) {
    var embeds = generate_search_embeds(json_data);
    var buttons = generate_buttons(embeds.length);

    message.edit({
        "content": `Here are the first results:`,
        "tts": false,
        "embeds": embeds,
        "components": [
            {
                'type' : 1,
                'components' : buttons
            }
        ]
    });
}

/**
 * Generates the embeds for a list of json game objects
 * @param {*} json_data A list containing json game objects (image_link, title, infos, price)
 * @returns A list containing all the generated embeds
 */
function generate_search_embeds(json_data) {
    var embeds = [];
    var count = 0;

    for (game of json_data) {
        var new_embed = {}

        new_embed['type'] = 'rich';
        new_embed['title'] =  emoji_numbers[count] + ' - ' + game['title'];
        new_embed['description'] = game['price'];
        new_embed['color'] = 0x6fff00,
        new_embed['thumbnail'] = {
            'url' : game['image_link'],
            'height' : 0,
            'width' : 0
        };
        new_embed['footer'] = {
            'text' : game['infos']
        }
        new_embed['url'] = game['link'];

        embeds.push(new_embed)

        count += 1;

        if (count >= PAGE_LIMIT) break;
    }
    return embeds;
}

/**
 * Generates a number of buttons
 * @param {*} size The max ammount of buttons
 * @returns A list containing the generated buttons
 */
function generate_buttons(size) {
    var btns = []
    for (let i = 0; i < size; i++) {
        var new_button = {
            "style": 1,
            "label": `${i+1}`,
            "custom_id": i,
            "disabled": false,
            "type": 2
        }
        btns.push(new_button)
    }
    return btns
}

function send_error_message(message, error_msg, type) {
    if (type === 'edit') {
        message.edit({
            'content' : ' ',
            'embeds' : [{
                'type' : 'rich',
                'title': error_msg,
                'color' : 0xff0000,
            }]
        });
    }
    else if (type === 'send') {
        message.channel.send({
            'content' : ' ',
            'embeds' : [{
                'type' : 'rich',
                'title': error_msg,
                'color' : 0xff0000,
            }]
        });
    }
}

function send_success_message(message, success_msg, type) {
    if (type === 'edit') {
        message.edit({
            'content' : ' ',
            'embeds' : [{
                'type' : 'rich',
                'title': success_msg,
                'color' : 0x6fff00,
            }]
        });
    }
    else if (type === 'send') {
        message.channel.send({
            'content' : ' ',
            'embeds' : [{
                'type' : 'rich',
                'title': success_msg,
                'color' : 0x6fff00,
            }]
        });
    }
}

function get_user_wishlist(db, userID) {
    return new Promise((success, failure) => {
        const wishlist_query = `SELECT gameID, gameProductID, price, receiveNotifications FROM WishList WHERE userID = '${userID}'`
        
        db.query(wishlist_query, async (error, results) => {
            if (error) {
                console.log(`ERROR :: failed to get wishlist for user '${userID}'\n `, error.message)
                failure()
            }
            else {
                success(results)
            }
        });
    })
}
