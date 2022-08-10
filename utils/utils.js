const MsgType = {
	success: 0x6fff00,
	error: 0xff0000
}

/**
 * Sends a message to a channel
 * @param {*} channel The channel where to send a message
 * @param {*} content The content of the message
 * @param {*} title The title of the embed
 * @param {MsgType} type The type of message
 */
function send_message(channel, content, title, type) {
    channel.send({
        'content' : content,
        'embeds' : [{
            'type' : 'rich',
            'title': title,
            'color' : type,
        }],
        'components': []
    })
    .catch(msg_error => {
        console.log(`ERROR :: failed to send message on utils.send_message to channel ${channel.id}\n `, msg_error)
    });
}

/**
 * Edits a message
 * @param {*} message The message to edit
 * @param {*} content The content of the message
 * @param {*} title The title of the embed
 * @param {MsgType} type The type of message
 */
 function edit_message(message, content, title, type) {
    message.edit({
        'content' : content,
        'embeds' : [{
            'type' : 'rich',
            'title': title,
            'color' : type,
        }],
        'components': []
    })
    .catch(msg_error => {
        console.log(`ERROR :: failed to edit message on utils.edit_message to channel ${message.channelId}\n `, msg_error)
    });
}

/**
 * Parses a search results embed back into a json format { link, image_link, title, productID, price }
 * @param {*} embed The embed to parse
 */
 function embedToJson(embed) {
    try {
        var game_json = {}

        game_json['link'] = embed.url
        game_json['image_link'] = embed.thumbnail.url

        // Get the productID from the embed's title
        const regex = new RegExp('(.*) \\[(\\w+)\\]$');
        const result  = embed.title.match(regex);

        if (result) {
            game_json['title'] = result[1]
            game_json['productID'] = parseInt(result[2])
        }

        for (field of embed.fields) {
            if (field.name === 'Price'){
                game_json['price'] = field.value
            }
        }

        return game_json
    }
    catch (err) {
        return undefined
    }
}

module.exports = {
    MsgType,
    send_message,
    edit_message,
    embedToJson,

    send_error_message,
    send_success_message,
    get_user_wishlist,
    get_guild_updates,
    parse_channels_to_select_options
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

function parse_channels_to_select_options(channels, guild) {
    //const emojis = ['❌ ', '✔️ '] // ✅ 

    res = []
    channels.forEach(channel => {

        const has_permissions = channel.permissionsFor(guild.me).has('VIEW_CHANNEL') && 
                                channel.permissionsFor(guild.me).has('SEND_MESSAGES') &&
                                channel.permissionsFor(guild.me).has('EMBED_LINKS')

        if (channel.type === 'GUILD_TEXT') {
            if (has_permissions) {
                res.push({
                    'label': channel.name,
                    'emoji': {
                        'id': null,
                        'name': `✅`,
                    },
                    'description': channel.parent.name,
                    'value': '' + channel.id,
                    'default': false
                })
            }
            else {
                res.push({
                    'label': channel.name,
                    'emoji': {
                        'id': null,
                        'name': `❌`,
                    },
                    'description': channel.parent.name,
                    'value': '' + channel.id,
                    'default': false
                })
            }
        }
    });
    return res
}
