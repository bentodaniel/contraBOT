module.exports = (Discord, client, db, guild) => {
    
    console.log("Left a guild: " + guild.name);

    try {
        db.query(
            `DELETE FROM Guilds WHERE guildID = ${guild.id}`
        );
    } catch (err) {
        console.log('ERROR :: failed to insert guild into db', guild.name, guild.id)
    }
}

// when leaving a server, check if the server has set any channels for updates. if so, remove them

// also, maybe check if a user has a wishlist . maybe if this user is only registered in the channel the bot is leaving, delete his wishlist? MAYBE