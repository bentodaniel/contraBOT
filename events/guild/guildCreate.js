const utils = require('../../utils/utils');

module.exports = (Discord, client, db, guild) => {
    
    console.log(`Joined guild ${guild.name}, id ${guild.id}`);
    
    const channel = guild.channels.cache.find(channel => 
        channel.type === 'GUILD_TEXT' && 
        channel.permissionsFor(guild.me).has('VIEW_CHANNEL') &&
        channel.permissionsFor(guild.me).has('SEND_MESSAGES') &&
        channel.permissionsFor(guild.me).has('EMBED_LINKS')
    )

    // Add to db.
    try {
        db.query(
            `INSERT INTO Guilds VALUES (${guild.id}, ${guild.ownerId}, ${null})`
        );
    } catch (err) {
        console.log(`ERROR :: failed to insert guild ${guild.name} with id ${guild.id} into db\n `, err)
    }

    guild.channels.fetch().then(channels => {
        // Send a 'greetings' message and then send a 'select default' message
        channel.send({
            embeds : [{
                'type' : 'rich',
                'title': 'Just arrived',
                'color' : 0x00FFFF,
                'description': `Get a list of all my commands with **${process.env.MSG_PREFIX}help**`,
            }]
        })
        .catch(msg_error => {
            console.log(`ERROR :: could not send 'just arrived' message to channel ${channel.id} in guild ${guild.id}\n `, msg_error)
        });
    })
}