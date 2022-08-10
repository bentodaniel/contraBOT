const utils = require('../utils/utils');

module.exports = {
    name: 'default',
    short_name: 'def',
    description: `Gets info on this guild's default channel`,
    arguments: '',
    adminOnly: false,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        const guild = message.guild

        // Get the default channel
        getDefaultChannel(db, guild).then(default_channel_results => {
            // Two default buttons
            const setDefaultBtn = new Discord.MessageButton()
                .setCustomId('setdefaultbtn')
                .setLabel('Set Default')
                .setStyle('PRIMARY')
            
            const removeDefaultBtn = new Discord.MessageButton()
                .setCustomId('removedefaultbtn')
                .setLabel('Remove Default')
                .setStyle('DANGER')
            
            
            // Create the embed and the component, which will serve as placeholders
            const embed  = new Discord.MessageEmbed()
                .setColor('#ffffff')
            
            // By default, only set default button is necessary
            const btns = [setDefaultBtn]

            if (default_channel_results.length === 0) {
                embed.setTitle('A default channel has not been set yet.')
            }
            else {
                embed.setTitle(`Default Channel`)
                    .setDescription(`'${guild.name}'s default channel is <#${default_channel_results[0]['defaultChannelID']}>`)
                
                // Add the remove default button
                btns.push(removeDefaultBtn)
            }

            message.channel.send({
                embeds: [embed],
                components: [new Discord.MessageActionRow().addComponents(btns)]
            })
            .then(default_msg => {
                // Handle interaction with buttons
                const filter = (i) =>
                    i.customId === btns[0].customId ||
                    i.customId === btns[btns.length - 1].customId   // If there is only 1 button, then there is no problem

                const collector = default_msg.createMessageComponentCollector({
                    max: 1, // This way, once clicked, the buttons will be disabled
                    time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                    filter // Add the filter
                });

                collector.on("collect", async interaction => {
                    // Check if the author of the interaction is admin.
                    // Only admins should be able to use the buttons
                    if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
                        interaction.reply({ content: `This button is for the administrators' use only.`, ephemeral: true }).catch(error => {})
                    }
                    else {
                        switch (interaction.customId) {
                            case 'setdefaultbtn':
                                await interaction.deferUpdate()
                                handleSetDefaultChannel(client, Discord, db, interaction)
                                break;

                            case 'removedefaultbtn':
                                await interaction.deferUpdate()
                                handleRemoveDefaultChannel(Discord, db, interaction, default_channel_results[0]['defaultChannelID'])
                                break;

                            default:
                                break;
                        } 
                    }
                });
                
                collector.on("end", (_, reason) => {
                    if (reason !== "messageDelete") {
                        const disabledRow = new Discord.MessageActionRow().addComponents(
                            btns.map(function(btn) {
                                return btn.setDisabled(true)
                            })
                        );
        
                        default_msg.edit({
                            embeds: [embed],
                            components: [disabledRow],
                        })
                        .catch(msg_error => {
                            console.log(msg_error)
                        });
                    }
                });
            })
            .catch(error => {
                console.log(error)
            })
        })
        .catch(error => {
            console.log(error)
        })
    }
}

/**
 * Get the default channel for a specified guild
 * @param {*} db The DB instance
 * @param {*} guild The guild to check in
 * @returns 
 */
function getDefaultChannel(db, guild) {
    return new Promise((success, failure) => {
        const q = `SELECT defaultChannelID FROM Guilds WHERE guildID = ${guild.id} AND defaultChannelID IS NOT NULL LIMIT 1`
        db.query(q, async (select_error, select_results) => {
            if (select_error) {
                failure(`There was an error while trying to get info of the default channel. Please try again.`)
            }
            else {
                success(select_results)
            }
        })
    })
}

/**
 * Handle removal of default channel in a guild
 * @param {*} Discord The Discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @param {*} channelID The channel id that was set as default
 * @returns 
 */
function handleRemoveDefaultChannel(Discord, db, interaction, channelID) {
    const guild = interaction.message.guild

    const replace_q = `REPLACE INTO Guilds (guildID, guildOwnerID, defaultChannelID) VALUES(${guild.id}, ${guild.ownerId}, ${null})`
    db.query(replace_q, async (replace_error, replace_results) => {
        if (replace_error) {
            interaction.reply({ content: `Failed to remove the default channel. Please try again.`, ephemeral: true }).catch(error => {})
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
                
            })
        }
    });
}

/**
 * Handles the execution of setting a default channel
 * Sends a message to select a default channel. 
 * Once selected, this message is deleted and, if successfull, the guild will be notified. If not, only the user will be notified
 * @param {*} client The bot's client
 * @param {*} Discord The Discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 */
function handleSetDefaultChannel(client, Discord, db, interaction) {
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
                    "custom_id": `channel_select`,
                    "placeholder": `Select default channel`,
                    "options": utils.parse_channels_to_select_options(channels, message.guild),
                    "min_values": 1,
                    "max_values": 1,
                    "type": 3
                }]
            }]
        })
        .then(select_msg => {
            const filter = (i) => i.customId === 'channel_select'

            const collector = select_msg.createMessageComponentCollector({
                max: 1, // The number of times a user can click on the button
                time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                filter // Add the filter
            });

            collector.on("collect", async interaction => {
                if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
                    interaction.reply({ content: `This select menu is for the administrators' use only.`, ephemeral: true }).catch(error => {})
                }
                else {
                    const guild = interaction.message.guild
                    const channelID = interaction.values[0]

                    const channel = await client.channels.fetch(channelID)

                    // check if the guild is in guilds table, if not, then try to add it
                    const q = `REPLACE INTO Guilds (guildID, guildOwnerID, defaultChannelID) VALUES(${guild.id}, ${guild.ownerId}, ${channel.id})`
                    db.query(q, async (error, results) => {
                        if (error) {
                            interaction.reply({ content: `Failed to set default channel.`, ephemeral: true }).catch(error => {})
                        }
                        else {
                            // Send message confirming the removal of the default channel
                            interaction.message.channel.send({
                                embeds: [
                                    new Discord.MessageEmbed()
                                        .setColor('#ffffff')
                                        .setTitle(`Default Channel Set`)
                                        .setDescription(`Channel <#${channelID}> has been set as default.`)
                                ]
                            })
                            .catch(error => {
                                
                            })
                        }
                    });
                }
            });

            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    select_msg.delete().catch(error => { });
                }
            });
        })
        .catch(msg_error => {
            //console.log(`ERROR :: could not send 'channel selection' message on setdefault to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
        });
    })
}
