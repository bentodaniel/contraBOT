/**
 * Handles the removal of the default channel
 * @param {*} Discord The Discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @param {*} channelID The id of the current channel set as default
 */
const handleRemoveDefaultChannel = async(Discord, db, interaction, channelID) => {
    const guild = interaction.message.guild
    
    const replace_q = `REPLACE INTO Guilds (guildID, guildOwnerID, defaultChannelID) VALUES(${guild.id}, ${guild.ownerId}, ${null})`
    db.query(replace_q, async (replace_error, replace_results) => {
        if (replace_error) {
            interaction.reply({ content: `Failed to remove the default channel. Please try again.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'failed to remove default channel' reply on 'handleRemoveDefaultChannel' :: `, error)
            })
        }
        else {
            // Send message confirming the removal of the default channel
            interaction.message.channel.send({
                embeds: [
                    new Discord.MessageEmbed()
                        .setColor('#ffffff')
                        .setTitle(`Default Channel Removed`)
                        .setDescription(`Channel <#${channelID}> is no longer the default channel.`)
                ]
            })
            .catch(error => {
                console.log(`ERROR :: Failed to send 'default channel removed' reply on 'handleRemoveDefaultChannel' :: `, error)
            })
        }
    });
}

module.exports = handleRemoveDefaultChannel