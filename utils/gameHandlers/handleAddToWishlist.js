/**
 * Handles adding a game to a user's wishlist
 * @param {*} db The DB instance
 * @param {*} interaction The Interaction that originated this execution
 * @param {*} game_json A json containing the game's data { link, image_link, title, infos, productID, price }
 * @param {*} price The target price
 */
const handleAddToWishlist = async (db, interaction, game_json, price) => {
    const selection_message = interaction.message
    const user = interaction.user
    
    // Get all wishlisted games
    getWishlistedGames(db, user).then(wished_games => {
        // Check what type of user issued the command
        checkUserPremium(db, user).then(premium_results => {
            // Set the max rows according to the results
            let entry_limit = process.env.BASE_USER_WISHLIST_LIMIT
            if (premium_results.length > 0) {
                entry_limit = process.env.PREMIUM_USER_WISHLIST_LIMIT
            }

            // Check if there is still space for more rows
            if (wished_games.length >= entry_limit && !gameInList(game_json['productID'], wished_games)) {
                interaction.reply({ content: `You have reached your wishlist's limit (${entry_limit} games).`, ephemeral: true }).catch(error => {})
            }
            else {
                // Insert or replace a game in wishlist
                const replace_q = `REPLACE INTO WishList (userID, gameID, gameProductID, gameLink, gameImageLink, price) VALUES('${user.id}', '${game_json['title']}', '${game_json['productID']}', '${game_json['link']}', '${game_json['image_link']}', ${price})`
                db.query(replace_q, async (error, results) => {
                    if (error) {
                        console.log(error)
                        interaction.reply({ content: `Failed to add the game '${game_json['title']}' to your wishlist.`, ephemeral: true }).catch(error => {})
                    }
                    else {
                        interaction.reply({ content: `The game '${game_json['title']}' has been added to your wishlist with target price of ${price}€.`, ephemeral: true }).catch(error => {})
                    }
                });
            }
        })
        .catch(premium_error => {
            console.log(premium_error)
        })
    })
    .catch(select_wish_error => {
        console.log(select_wish_error)
    })
}

/**
 * Gets all wishlisted games for a user
 * @param {*} db The DB instance
 * @param {*} user The user instance
 * @returns A promise with the results
 */
function getWishlistedGames(db, user) {
    return new Promise((success, failure) => {
        const select_q = `SELECT gameProductID FROM WishList WHERE userID = ${user.id}`
        db.query(select_q, async (select_error, select_results) => {
            if (select_error) {
                failure(`An error has occurred. Please try again.`)                
            }
            else {
                success(select_results)
            }
        })
    })
}

/**
 * Check if a user is premium
 * @param {*} db The DB instance
 * @param {*} user The user instance
 * @returns A promise with the results
 */
function checkUserPremium(db, user) {
    return new Promise((success, failure) => {
        const premium_q = `SELECT 1 FROM PremiumUsers WHERE userID = ${user.id} LIMIT 1`
        db.query(premium_q, async (premium_error, premium_results) => {
            if (premium_error) {
                failure(`An error has occurred. Please try again.`)
            }
            else {
                success(premium_results)
            }
        })
    })
}

/**
 * Checks if a game is in a list
 * @param {*} gameID The ID we are searching for
 * @param {*} games_list The list of json objects
 * @returns 
 */
function gameInList(gameID, games_list) {
    for (dict of games_list) {
        if (dict['gameProductID'] === gameID) {
            return true
        }
    }
    return false
}

module.exports = handleAddToWishlist
