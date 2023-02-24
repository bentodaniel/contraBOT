module.exports = (Discord, client, db, guild) => {
    
    if (!guild.available) {
        return
    }

    console.log(`Left guild ${guild.name}, id ${guild.id}`);

    try {
        db.query(
            `DELETE FROM Guilds WHERE guildID = ${guild.id}`
        );
    } catch (err) {
        console.log(`ERROR :: failed to delete guild ${guild.name} with id ${guild.id} into db :: `, err)
    }
}

// when leaving a server, check if the server has set any channels for updates. if so, remove them

// also, maybe check if a user has a wishlist . maybe if this user is only registered in the channel the bot is leaving, delete his wishlist? MAYBE