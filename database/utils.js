/**
 * Gets a list of the set up notifications in a given guild as [ { gameID, channelID }, ... ]
 * @param {*} db The DB instance
 * @param {*} guildID The guild ID
 * @returns 
 */
 function get_guild_news_updates(db, guildID) {
    return new Promise((success, failure) => {
        const updateslist_query = `SELECT gameID, channelID FROM UpdatesChannels WHERE guildID = '${guildID}'`
        db.query(updateslist_query, async (error, results) => {
            if (error) {
                failure(error)
            }
            else {
                success(results)
            }
        });
    })
}

/**
 * Get the wishlisted items for a user
 * @param {*} db The DB instance
 * @param {*} userID The target user's id
 * @returns 
 */
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

module.exports = {
    get_guild_news_updates,
    get_user_wishlist
}