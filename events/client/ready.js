const request = require('request');
const xhr_req = require('xhr-request');
const constants = require('../../utils/constants')
const updates = require('../../utils/updates')
const utils = require('../../utils/utils')

module.exports = (Discord, client, db, message) => {
    console.log('IM ONLINE');

    client.user.setActivity(' out for games\' data', {
        type: 'WATCHING' //PLAYING: WATCHING: LISTENING: STREAMING:
    });
    client.user.setStatus("online");

    // Execute and then only execute once in a while
    handle_news(client, db)
    setInterval( function() { handle_news(client, db); }, 3600000 * 6 ); // 1 hour * 6  (3600000 * 12)
    
    handle_wishlist(client, db)
    // todo - repeat every.. something
}

/********************************************
 *      NEWS UPDATES FUNCTIONS
 ********************************************/

async function handle_news(client, db) {
    console.log('Starting news update...')
    const patch_query = `SELECT * FROM LastUpdates`
    db.query(patch_query, async (error, recorded_results) => {
        if (error) {
            // No need to tell the users
            console.log(`ERROR :: failed to get last patches`)
            console.log(error.message)
        }
        else {
            for (const [ key, value ] of Object.entries(constants.games)) {
                new Promise(resolve => {
                    if (value.is_xhr) { // Get xhr data
                        xhr_req(value.url, {
                            json: true
                        }, function (err, req_data) {
                            if (err) {
                                console.log(err)
                            }
                            else {
                                // Get last recorded news from db
                                const game_recorded_data = get_recorded_game_data(recorded_results, key)
                                // Get news according to recorded data
                                const game_news_data = updates.execute(req_data, key, game_recorded_data)
                                resolve(game_news_data)
                            }
                        })
                    }
                    else { // Get html data
                        request(value.url, function (error, response, body) {
                            if (error || !body){
                                console.log(error);
                            }
                            else {
                                // Get last recorded news from db
                                const game_recorded_data = get_recorded_game_data(recorded_results, key)
                                // Get news according to recorded data
                                const game_news_data = updates.execute(body, key, game_recorded_data)
                                resolve(game_news_data)
                            }
                        })
                    }
                }).then(news_data => {
                    handle_news_messaging(client, db, key, news_data, value)

                    record_into_db(db, key, news_data)
                })
            }
        }
    })
}

/**
 * Gets the stored data about a game
 * @param {*} game_data A list containing stored game data
 * @param {*} game The game we are looking for
 * @returns 
 */
function get_recorded_game_data(game_data, game) {
    for (gdata of game_data) {
        if (gdata.gameID === game) {
            return gdata
        }
    }
    return {}
}

/**
 * Handles the messaging about games' news
 * @param {*} client The discord client
 * @param {*} db The db connection
 * @param {*} game The game's name
 * @param {*} news_data Json news data about the game
 * @param {*} game_data Json constant data about the game
 */
function handle_news_messaging(client, db, game, news_data, game_data) {
    const channels_query = `SELECT channelID FROM UpdatesChannels WHERE gameID = '${game}'`
        
    db.query(channels_query, async (error, results) => {
        if (error) {
            // No need to tell the users
            console.log(`ERROR :: failed to get update channels for game '${game}'`)
            console.log(error.message)
        }
        else {
            send_news_messages(results, client, news_data, game_data)
        }
    });
}

/**
 * Send the necessary messages to every channel
 * @param {*} db_data the channelID's that will receive a message for some game
 * @param {*} client the discord client
 * @param {*} data the game's parsed news json data
 * @param {*} value the const data for some game
 */
async function send_news_messages(db_data, client, data, value) {
    for (entry_point of db_data) {
        const channel = await client.channels.fetch(entry_point['channelID'])

        // Loop in reverse to print oldest first
        for (var i = data.length - 1; i >= 0; i--) {
            var d = data[i]
            channel.send({
                'content' : ' ',
                'tts': false,
                'embeds' : [{
                    'type' : 'rich',
                    'title': `${d['title']}`,
                    'color' : 0xff7d00,
                    'description': `${d['content']}`,
                    'footer': {
                        'text': `${value.title} - ${d['date']}`
                    },
                    'url' : `${d['url']}`,
                    'thumbnail': {
                        'url': `${value.logo}`,
                        'height': 0,
                        'width': 0
                      }
                }]
            });
        }
    }
}

function record_into_db(db, game, news_data) {
    if (news_data.length >= 1) {
        const url = news_data[0]['url']
        const q = `REPLACE INTO LastUpdates (gameID, updateLink) VALUES('${game}', '${url}')`

        db.query(q, async (error, results) => {
            if (error) {
                console.log(`ERROR :: Coundn't record last news into db for game ${game}\n`, error.message)
            }
            else {
                console.log(`Recorded '${url}' as last news into db for game ${game}`)
            }
        })
    }
}

/********************************************
 *      WISHLIST UPDATES FUNCTIONS
 ********************************************/

function handle_wishlist(client, db) {
    console.log('Starting wishlist update...')
    const games_query = `SELECT DISTINCT gameProductID FROM WishList`
    db.query(games_query, async (games_error, games_results) => {
        if (games_error) {
            // No need to tell the users
            console.log(`ERROR :: failed to get the games from wishlist for update\n `, games_error.message)
        }
        else {
            // execute for each game
            for(game of games_results) {
                const gameProductID = game['gameProductID']

                // get the offers for this game
                utils.get_game_offers(gameProductID, 'eur', 10).then(game_offers_list => {
                    // find what users have this game in their wishlist
                    const users_query = `SELECT userID, gameID, gameLink, price FROM WishList WHERE gameProductID = ${gameProductID} AND receiveNotifications = 1`
                    db.query(users_query, async (users_error, users_results) => {
                        if (users_error) {
                            // No need to tell the users
                            console.log(`ERROR :: failed to get the users with game ${gameProductID} on their wishlist\n `, users_error.message)
                        }
                        else {
                            console.log(users_results)

                            // now we have to loop through each user and check if there are offers that are ok with his price
                            // if so, we then need to notify the user
                            for (user_data of users_results) {
                                // Create a list containing the offers with an equal or lower price than requested
                                var offers = []
                                for (offer of game_offers_list) {
                                    if (offer['price'] <= user_data['price']) {
                                        offers.push(offer)
                                    }
                                }

                                // Send a notification to the user if the list is not empty
                                if (offers.length > 0) {

                                    // TODO - send correct msg
                                    client.users.fetch(user_data['userID'], false).then((user) => {
                                        user.send({
                                            'content' : ' ',
                                            'embeds' : [{
                                                'type' : 'rich',
                                                'title': 'there are games that satisfy something in your wishlist',
                                                'color' : 0x6fff00,
                                            }],
                                            'components': []
                                        });
                                    })
                                    .catch(user_fetch_error => {
                                        //console.log(`WARNING :: Could not find user ${user_data['userID']} during wishlist update. Disabling notifications\n `, user_fetch_error.message)
                                    
                                        // TODO - update all wishlist table to not receive notifications

                                        // for now, just dont do enything, but with increasing rows, we should disable notifications
                                    });;
                                }
                            }
                        }
                    })
                })
            }
            
            
            
            
        }
    })
}










// checks https://www.indiegamebundles.com/category/free/
// https://gg.deals/deals/?maxPrice=0
// https://www.epicbundle.com/category/article/for-free/
function checkFreeDeals() {
    console.log('its time')
}