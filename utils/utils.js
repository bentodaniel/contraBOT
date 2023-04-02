const { PermissionsBitField, ChannelType } = require('discord.js');

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
async function parse_channels_to_select_options(channels, guild) {
    var promises = []

    if (channels === null || channels === undefined || guild === null || guild === undefined) {
        return promises
    }

    for(channel_data of channels) {
        const channel = channel_data[1]

        if (channel.type === ChannelType.GuildText) {
            var emoji = '❌'
            
            const has_permissions = get_has_permissions(guild, channel)
            if (has_permissions) {
                emoji = '✅'
            }

            promises.push({
                'label': channel.name,
                'emoji': {
                    //'id': null,
                    'name': emoji,
                },
                'description': channel.parent.name,
                'value': '' + channel.id,
                'default': false
            })
        }
    }
    return Promise.all(promises)
}

function get_has_permissions(guild, channel) {
    const perms = guild.members.me?.permissionsIn(channel)
    return perms.has(PermissionsBitField.Flags.ViewChannel) && 
        perms.has(PermissionsBitField.Flags.SendMessages) &&
        perms.has(PermissionsBitField.Flags.EmbedLinks) &&
        perms.has(PermissionsBitField.Flags.AttachFiles)
}

module.exports = {
    embedToJson,
    parse_channels_to_select_options,
    get_has_permissions
}