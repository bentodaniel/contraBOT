const gamesConfig = require('../../utils/newsUpdatesHandlers/gamesConfig')
const handleFetchNews = require('../../utils/newsUpdatesHandlers/handleFetchNews')
const handleComparePrices = require('../../utils/gameHandlers/handleComparePrices')
const embedPagination = require('../../utils/embedPagination');

module.exports = (Discord, client, db, message) => {
    console.log('IM ONLINE');

    client.user.setActivity(` out for games\' data`, {
        type: 'WATCHING' //PLAYING: WATCHING: LISTENING: STREAMING:
    });
    client.user.setStatus("online");

    // Execute and then only execute once in a while
    handle_news(client, db)
    setInterval( function() { handle_news(client, db); }, 3600000 * 6 ); // 1 hour * 6  (3600000 * 12)

    // Wait and then execute every so often
    setTimeout(function() {
        // Execute and then only execute once in a while
        handle_wishlist(Discord, client, db)
        setInterval( function() { handle_wishlist(Discord, client, db); }, 3600000 * 2 ); // 1 hour * 3  (3600000 * 12)
    }, 3600000 * 1)

    // Send patch notes messages
    handle_patch_notes(client, Discord, db)
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
            console.log(`ERROR :: failed to get last patches :: `, error)
        }
        else {
            for (const [ key, value ] of Object.entries(gamesConfig)) {
                handleFetchNews(
                    key, 
                    value, 
                    5
                ).then(news_data => {
                    // Get last recorded news from db
                    const game_recorded_data = get_game_recorded_data(recorded_results, key)
                    
                    if (game_recorded_data !== undefined && game_recorded_data !== {}) {
                        // Get only the valid news
                        const valid_news_data = validate_news(news_data, game_recorded_data.setDate, game_recorded_data.updateLink, 2)

                        handle_news_messaging(client, db, key, valid_news_data, value)

                        record_into_db(db, key, valid_news_data)
                    }
                })
                .catch(error => {
                    console.log(`ERROR :: Something went wrong during 'handle_news' :: `, error)
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
function get_game_recorded_data(game_data, game) {
    for (gdata of game_data) {
        if (gdata.gameID === game) {
            return gdata
        }
    }
    return {}
}

/**
 * Gets and returns the valid news from a list of news
 * News are valid if they are newer than the latest_date, their url is different than the recorded_url and if they are not older than now - max_days_old
 * @param {*} news_data The list containing news in the format { url, title, date, content }. This data is ordered from newest to oldest
 * @param {*} latest_date The Date of the last recorded entry
 * @param {*} recorded_url The recorded url of the latest news
 * @param {*} max_days_old How old can the news be?
 */
function validate_news(news_data, latest_date, recorded_url, max_days_old) {
    var valid_news = []

    for (n_data of news_data) {
        if (n_data.url === recorded_url) {
            break
        }

        const date = new Date(n_data.date) 

        if (date > latest_date) {
            const diffTime = Math.abs(new Date() - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= max_days_old) {
                valid_news.push(n_data)
            }
        }
    }
    return valid_news
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
            console.log(`ERROR :: failed to get update channels for game '${game}' :: `, error)
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
        try {
            const channel = await client.channels.fetch(entry_point['channelID'])

            // TODO vvvv - this should only send if the date is at max 1 day difference
            // this is because of downtime, to prevent spam of old news

            // Loop in reverse to print oldest first
            for (var i = data.length - 1; i >= 0; i--) {
                var d = data[i]
                channel.send({
                    'content' : ' ',
                    'tts': false,
                    'embeds' : [{
                        'type' : 'rich',
                        'title': `${d['title']}`.substring(0, 256),
                        'color' : 0xff7d00,
                        'description': `${d['content']}`.substring(0, 4096),
                        'footer': {
                            'text': `${value.title} - ${d['date']}`.substring(0, 2048)
                        },
                        'url' : `${d['url']}`,
                        'thumbnail': {
                            'url': `${value.logo}`,
                            'height': 0,
                            'width': 0
                        }
                    }]
                })
                .catch(msg_error => {
                    console.log(`ERROR :: Failed to send news message to channel ${channel.id} :: `, msg_error)
                });
            }
        }
        catch (err) {
            console.log('ERROR :: something went wrong while trying to send a news message :: ', err)
        }
    }
}

function record_into_db(db, game, news_data) {
    if (news_data.length >= 1) {
        const url = news_data[0]['url']
        const q = `REPLACE INTO LastUpdates (gameID, updateLink) VALUES('${game}', '${url}')`

        db.query(q, async (error, results) => {
            if (error) {
                console.log(`ERROR :: Coundn't record last news into db for game ${game} :: `, error)
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

function handle_wishlist(Discord, client, db) {
    console.log('Starting wishlist update...')
    const games_query = `SELECT DISTINCT gameProductID FROM WishList`
    db.query(games_query, async (games_error, games_results) => {
        if (games_error) {
            // No need to tell the users
            console.log(`ERROR :: failed to get the games from wishlist for update :: `, games_error)
        }
        else {
            // execute for each game
            for(game of games_results) {
                const gameProductID = game['gameProductID']

                // get the offers for this game
                handleComparePrices.get_game_offers(gameProductID, 'eur', 10, 'allkeyshop').then(game_offers_list => {
                    // find what users have this game in their wishlist
                    const users_query = `SELECT userID, gameID, gameLink, gameImageLink, price FROM WishList WHERE gameProductID = ${gameProductID} AND receiveNotifications = 1`
                    db.query(users_query, async (users_error, users_results) => {
                        if (users_error) {
                            // No need to tell the users
                            console.log(`ERROR :: failed to get the users with game ${gameProductID} on their wishlist :: `, users_error)
                        }
                        else {
                            // now we have to loop through each user and check if there are offers that are ok with his price
                            // if so, we then need to notify the user
                            for (user_data of users_results) {
                                notify_user(client, Discord, user_data, game_offers_list)
                            }
                        }
                    })
                })
                .catch(get_game_offers_error => {
                    console.log(`ERROR :: Failed to get game offers on 'ready.handle_wishlist' :: `, get_game_offers_error)
                })
            }
        }
    })
}

function notify_user(client, Discord, user_data, game_offers_list) {
    client.users.fetch(user_data['userID'], false).then((user) => {
        // Create a list containing the offers with an equal or lower price than requested
        var offers = []
        for (offer of game_offers_list) {
            if (offer['price'] <= user_data['price']) {
                offers.push(offer)
            }
        }

        // Send a notification to the user if the list is not empty
        if (offers.length > 0) {
            user.send({
                'content' : `There are available offers for a game in your wishlist`,
            })
            .then(user_msg => {
                const embeds = generate_game_notification_embeds(Discord, offers, user_data)

                embedPagination(Discord, user_msg, embeds, 120000, ' ')
            })
            .catch(msg_error => {
                console.log(`ERROR :: Failed to notify user ${user.id} about a wishlisted game :: `, msg_error)
            });
        }
    })
    .catch(user_fetch_error => {
        console.log(`ERROR :: Failed to get user from client on 'ready.notify_user' :: `, user_fetch_error)

        //console.log(`WARNING :: Could not find user ${user_data['userID']} during wishlist update. Disabling notifications\n `, user_fetch_error)
    
        // TODO - update all wishlist table to not receive notifications

        // for now, just dont do enything, but with increasing rows, we should disable notifications
    });;
}

function generate_game_notification_embeds(Discord, offers, user_data) {
    var embeds = [];
    for (game of offers) {
        var embed = new Discord.MessageEmbed()
            .setTitle(user_data['gameID'])
            .setURL(user_data['gameLink'])
            .setDescription(`Target price: ${user_data['price']}€\n\n[${game['market']} - BUY](${game['buy_link']})\n`)
            .setColor('#6fff00')
            .setThumbnail(user_data['gameImageLink'])
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

/********************************************
 *      PATCH NOTES FUNCTIONS
 ********************************************/

function handle_patch_notes(client, Discord, db) {
    // Get all guilds that have set a default channel
    const q = `SELECT * FROM Guilds WHERE defaultChannelID IS NOT NULL`
    db.query(q, async (error, results) => {
        if (error) {
            // No need to inform any user
            console.log(`ERROR :: failed to get guilds with set default channel :: `, error)
        }
        else {
            var fs = require('fs');
            var obj = JSON.parse(fs.readFileSync('patch-notes.json', 'utf8'));

            // This wont be a problem, as I know there is at least one
            const last = obj[obj.length-1]

            // If it is not a shaddow patch, then notify the servers
            if (last.display) {
                // Loop through each server's data
                for (guild_data of results) {
                    notify_server(client, Discord, guild_data, last)
                }
            }

        }
    })
}

function notify_server(client, Discord, guild_data, patch_data) {
    client.channels.fetch(guild_data['defaultChannelID']).then(channel => {
        const embed = new Discord.MessageEmbed()
                        .setColor(0xFFFFFF)
                        .setTitle(patch_data.title)
                        .setDescription(patch_data.description)
                        .setThumbnail('attachment://contraLOGO.png')
                        .setTimestamp()
                        .setFooter({ text: 'contraBOT'})
        
        channel.send({
            embeds: [embed],
            files: ['./images/contraLOGO.png']
        })
        .catch(msg_error => {
            console.log(`ERROR :: Failed to notify guild ${guild_data['guildID']} in channel ${guild_data['defaultChannelID']} about patch notes :: `, msg_error)
        });
    })
    .catch(channel_fetch_error => {
        console.log(`ERROR :: Failed to get channel from client on 'ready.notify_server' :: `, channel_fetch_error)

        // TODO - no need to notify anyone (?)
    });;
}
