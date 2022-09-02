module.exports = (Discord, client, db, channel) => {
    if (channel.type === 'GUILD_TEXT') {
        console.log(`Channel ${channel.id} has been removed. Trying to remove it from database...`)

        // A channel can be associated with both, default and notifications, so we must execute queries for both cases

        // Try to remove from UpdatesChannels
        const updates_channels_query = `DELETE FROM UpdatesChannels WHERE channelID = ${channel.id}`
        db.query(updates_channels_query, async (error, results) => {
            if (error) {
                console.log(`Failed to remove channel ${channel.id} from UpdatesChannels :: `, error)
            }
            else {
                if (results.affectedRows >= 1) {
                    console.log(`Successfully removed channel ${channel.id} from UpdatesChannels`)
                }
            }
        });

        // Try to remove from default channels
        const default_channels_query = `UPDATE Guilds SET defaultChannelID = ${null} WHERE defaultChannelID = ${channel.id}`
        db.query(default_channels_query, async (error, results) => {
            if (error) {
                console.log(`Failed to remove default channel ${channel.id} from Guilds :: `, error)
            }
            else {
                if (results.affectedRows >= 1) {
                    console.log(`Successfully removed default channel ${channel.id} from Guilds`)
                }
            }
        });
    }
}