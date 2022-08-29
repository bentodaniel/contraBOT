const request = require('request');
const cheerio = require('cheerio');

const embedPagination = require('../utils/embedPagination');

module.exports = {
    name: 'search',
    short_name: 's',
    description: 'Search for info on a game',
    arguments: '<game to search>',
    showOnHelp: true,
    execute(client, message, args, Discord, db) {
        // If a new store is implementes, will have to rework this
        const store = 'allkeyshop'
        const game = args

        // Send placeholder message
        message.channel.send(`Searching for results on ${game}...`).then(placeholder_search_msg => {
            // Get the list of search results
            get_games_list(store, game).then(results_list => {
                if (results_list === undefined) {
                    placeholder_search_msg.edit({
                        content : ' ',
                        embeds : [{
                            'type' : 'rich',
                            'title': `There was an error while trying to get the search results. Please try again.`,
                            'color' : 0xffffff,
                        }]
                    })
                    .catch(error => {
                        console.log(`ERROR :: failed to edit 'null search results' message on 'search' command to channel ${message.channelId} :: `, error)
                    });
                }
                else if (results_list.length === 0){
                    placeholder_search_msg.edit({
                        content : ' ',
                        embeds : [{
                            'type' : 'rich',
                            'title': `There are no results for '${game}'. Try using another search terms.`,
                            'color' : 0xffffff,
                        }]
                    })
                    .catch(error => {
                        console.log(`ERROR :: failed to edit 'there are no search results' message on 'search' command to channel ${message.channelId} :: `, error)
                    });
                }
                else {
                    // Generate the embeds and the buttons for paginated message
                    const embeds = generateEmbeds(Discord, results_list)
                    const extraButtonList = [
                        new Discord.MessageButton()
                            .setCustomId('pricebtn')
                            .setLabel('Compare Prices')
                            .setStyle('PRIMARY'),
                        new Discord.MessageButton()
                            .setCustomId('wishlistbtn')
                            .setLabel('Add to Wishlist')
                            .setStyle('PRIMARY')
                    ]

                    embedPagination(
                        Discord, placeholder_search_msg, embeds, 120000, `${message.author.toString()}, here are the results for '**${game}**'`, extraButtonList
                    )
                    .catch(paginate_error => {
                        console.log(`ERROR :: Failed to send paginated search results message for 'search' command :: `, paginate_error)
                    })
                }
            })
            .catch(fetch_games_list_error => {
                console.log(`ERROR :: Failed to get games list for 'search' command :: `, fetch_games_list_error)

                // Notify the user
                placeholder_search_msg.edit({
                    content : ' ',
                    embeds : [{
                        'type' : 'rich',
                        'title': `There was an error while trying to get the search results. Please try again.`,
                        'color' : 0xffffff,
                    }]
                })
                .catch(error => {
                    console.log(`ERROR :: failed to edit 'failed to get search results' message on 'search' command to channel ${message.channelId} :: `, error)
                });
            })
        })
        .catch(msg_error => {
            console.log(`ERROR :: could not send placeholder message on search to channel ${message.channelId} in guild ${message.guildId} :: `, msg_error)
        });
    }
}

/**
 * Returns a list containing all search results or undefined if it fails
 * Each object has keys: { link, image_link, title, infos, productID, price }
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

/**
 * Gets the search results of a given game on AllKeyShop
 * @param {*} game_search The tag to search
 * @returns An object with keys { link, image_link, title, infos, productID, price }
 */
function get_allkeyshop_games_list(game_search) {
    return new Promise((success, failure) => {
        request(`https://www.allkeyshop.com/blog/catalogue/search-${game_search}/`, function (error, response, body) {
            if (error || !body){
                console.log(`ERROR :: trying to search for '${game_search}' :: `, error);
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
 * Generates the embeds for the search results
 * @param {*} results_list The list of results for a game search
 * @returns A list of MessageEmbed
 */
function generateEmbeds(Discord, results_list) {
    var embeds = [];
    for (game of results_list) {
        var embed = new Discord.MessageEmbed()
            .setTitle(`${game['title']} [${game['productID']}]`)
            .setURL(game['link'])
            .setColor('#ffffff')
            .setThumbnail(game['image_link'])
            .setDescription(game['infos'])
            .addFields(
                { name: `Price`, value: `${game['price']}`, inline: true }
            )
        embeds.push(embed)
    }
    return embeds;
}
