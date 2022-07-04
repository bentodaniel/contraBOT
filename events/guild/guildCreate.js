module.exports = (Discord, client, db, guild) => {
    
    console.log("Joined a new guild: " + guild.name);
    guild.systemChannel.send({
        'content' : ' ',
        'tts': false,
        'embeds' : [{
            'type' : 'rich',
            'title': 'Just arrived',
            'color' : 0x00FFFF,
            'description': 'Get a list of all my commands with **$help**',
        }]
    })

    try {
        db.query(
            `INSERT INTO Guilds VALUES (${guild.id}, ${guild.ownerId})`
        );
    } catch (err) {
        console.log('ERROR :: failed to insert guild into db', guild.name, guild.id)
        console.log(err.message)
    }
}