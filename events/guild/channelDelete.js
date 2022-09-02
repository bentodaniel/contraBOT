module.exports = (Discord, client, db, channel) => {
    if (channel.type === 'GUILD_TEXT') {
        console.log(`Channel ${channel.id} has been removed. Trying to remove it from UpdatesChannels...`)

        const q = `DELETE FROM UpdatesChannels WHERE channelID = ${channel.id}`

        db.query(q, async (error, results) => {
            if (error) {
                console.log(`Failed to remove channel ${channel.id} from UpdatesChannels`)
            }
            else {
                console.log(`Successfully removed channel ${channel.id} from UpdatesChannels`)
                // if the channel was not associated with any set up notifications, its still ok... this way we just dont do an extra call to the db
            }
        });
    }
}