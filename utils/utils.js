const MsgType = {
	success: 0x6fff00,
	error: 0xff0000
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

/**
 * Parses a list of channels in a guild into a select menu 'options' format
 * Channels that can not be accessed are marked with ❌ and channels that can, with ✅
 * @param {*} channels The list of channels to be used 
 * @param {*} guild The guild
 * @returns 
 */
 function parse_channels_to_select_options(channels, guild) {
    res = []
    channels.forEach(channel => {
        const has_permissions = channel.permissionsFor(guild.me).has('VIEW_CHANNEL') && 
                                channel.permissionsFor(guild.me).has('SEND_MESSAGES') &&
                                channel.permissionsFor(guild.me).has('EMBED_LINKS') &&
                                channel.permissionsFor(guild.me).has('ATTACH_FILES')

        if (channel.type === 'GUILD_TEXT') {
            var emoji = '❌'
            
            if (has_permissions) {
                emoji = '✅'
            }

            res.push({
                'label': channel.name,
                'emoji': {
                    'id': null,
                    'name': emoji,
                },
                'description': channel.parent.name,
                'value': '' + channel.id,
                'default': false
            })
        }
    });
    return res
}

module.exports = {
    MsgType,
    edit_message,
    embedToJson,
    parse_channels_to_select_options
}