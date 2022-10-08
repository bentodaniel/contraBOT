const utils = require('../../utils/utils');

module.exports = (Discord, client, db, guild) => {
    
    console.log(`Joined guild ${guild.name}, id ${guild.id}`);
    
    // Add to db.
    try {
        db.query(
            `INSERT INTO Guilds VALUES (${guild.id}, ${guild.ownerId}, ${null})`
        );
    } catch (err) {
        console.log(`ERROR :: failed to insert guild ${guild.name} with id ${guild.id} into db :: `, err)
    }

    var msg_content = {
        embeds : [{
            'type' : 'rich',
            'title': 'Just arrived',
            'color' : 0x00FFFF,
            'description': `Get a list of all my commands with **${process.env.MSG_PREFIX}help**`,
        }]
    }

    // Find a channel where the bot has all required permissions
    var channel = guild.channels.cache.find(channel => 
        channel.type === 'GUILD_TEXT' && utils.get_has_permissions(channel, guild.me)
    )

    // If no valid channel was found, try to find one with little permissions
    if (channel === undefined || channel === null) {
        channel = guild.channels.cache.find(channel => 
            channel.type === 'GUILD_TEXT' &&
            channel.permissionsFor(guild.me).has('VIEW_CHANNEL') && 
            channel.permissionsFor(guild.me).has('SEND_MESSAGES')
        )

        msg_content = {
            content : `I do not have all necessary permissions.\nI require: 'View Channel', 'Send Messages', 'Embed Links', 'Attach Files'`
        }
    }

    // If there is a channel with required permissions
    if (channel !== undefined && channel !== null){
        // Send a 'greetings' message
        channel.send(
            msg_content
        )
        .catch(msg_error => {
            console.log(`ERROR :: Failed to send 'just arrived' message to channel ${channel.id} in guild ${guild.id} :: `, msg_error)
        });
    }
}