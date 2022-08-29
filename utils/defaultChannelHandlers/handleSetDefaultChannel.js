const utils = require('../../utils/utils');

/**
 * Handles the execution of setting a default channel
 * Sends a message to select a default channel. 
 * Once selected, this message is deleted and, if successfull, the guild will be notified. If not, only the user will be notified
 * @param {*} client The bot's client
 * @param {*} Discord The Discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 */
const handleSetDefaultChannel = async(client, Discord, db, interaction) => {
    const message = interaction.message
    const user = interaction.user

    message.guild.channels.fetch().then(channels => {
        message.channel.send({
            content : user.toString(),
            embeds : [{
                'type' : 'rich',
                'title': `Select the channel you would like to set as default.`,
                'description': `I do not have all necessary permissions in channels marked with ❌\n\nPermissions: 'View Channel', 'Send Messages', 'Embed Links', 'Attach Files' are necessary.`,
                'color' : 0xffffff,
            }],
            components: [{
                'type': 1,
                'components': [{
                    "custom_id": `default_channel_select`,
                    "placeholder": `Select default channel`,
                    "options": utils.parse_channels_to_select_options(channels, message.guild),
                    "min_values": 1,
                    "max_values": 1,
                    "type": 3
                }]
            }]
        })
        .then(select_msg => {
            const filter = (i) => i.customId === 'default_channel_select'

            const collector = select_msg.createMessageComponentCollector({
                //max: 1, // The number of times a user can click on the button
                time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                filter // Add the filter
            });

            collector.on("collect", async i => {
                if (!i.memberPermissions.has('ADMINISTRATOR')) {
                    i.reply({ content: `This select menu is for the administrators' use only.`, ephemeral: true }).catch(error => {
                        console.log(`ERROR :: Failed to send 'select menu for admins' reply on 'handleSetDefaultChannel' :: `, error)
                    })
                }
                else {
                    const guild = i.message.guild
                    const channelID = i.values[0]

                    const channel = await client.channels.fetch(channelID)

                    // check if the guild is in guilds table, if not, then try to add it
                    const q = `REPLACE INTO Guilds (guildID, guildOwnerID, defaultChannelID) VALUES(${guild.id}, ${guild.ownerId}, ${channel.id})`
                    db.query(q, async (error, results) => {
                        if (error) {
                            i.reply({ content: `Failed to set default channel.`, ephemeral: true }).catch(error => {
                                console.log(`ERROR :: Failed to send 'fail to set default' reply on 'handleSetDefaultChannel' :: `, error)
                            })
                        }
                        else {
                            // Send message confirming the removal of the default channel
                            i.message.channel.send({
                                embeds: [
                                    new Discord.MessageEmbed()
                                        .setColor('#ffffff')
                                        .setTitle(`Default Channel Set`)
                                        .setDescription(`Channel <#${channelID}> has been set as default.`)
                                ]
                            })
                            .catch(error => {
                                console.log(`ERROR :: Failed to send 'success' reply on 'handleSetDefaultChannel' :: `, error)
                            })
                        }
                    });
                    select_msg.delete().catch(error => {
                        console.log(`ERROR :: Failed to delete select msg on 'handleSetDefaultChannel' success :: `, error)
                    });
                }
            });

            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    select_msg.delete().catch(error => {
                        console.log(`ERROR :: Failed to delete select msg on 'handleSetDefaultChannel' timeout :: `, error)
                    });
                }
            });
        })
        .catch(msg_error => {
            console.log(`ERROR :: Failed to send 'channel selection' message on handleSetDefaultChannel :: `, msg_error)
        });
    })
    .catch(channel_fetch_error => {
        console.log(`ERROR :: Failed to fetch channels in guild on handleSetDefaultChannel :: `, channel_fetch_error)

        interaction.reply({ content: `Failed to fetch channels in this server. Please try again`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'fail' reply on 'handleSetDefaultChannel' :: `, error)
        })
    })
}

module.exports = handleSetDefaultChannel