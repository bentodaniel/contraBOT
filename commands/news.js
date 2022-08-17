const gamesConfig = require('../utils/newsUpdatesHandlers/gamesConfig')
const handleSetUpGameNews = require('../utils/newsUpdatesHandlers/handleSetUpGameNews')
const handleRemoveGameNews = require('../utils/newsUpdatesHandlers/handleRemoveGameNews')

module.exports = {
    name: 'news',
    short_name: 'n',
    description: 'Check what games are set up for news notifications. Set up more games for news notifications or remove them.',
    arguments: '',
    adminOnly: false,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // Get the updates that have been set up
        get_guild_news_updates(db, message.guild.id).then(json_data => {
            // Two default buttons
            const setGameBtn = new Discord.MessageButton()
                .setCustomId('setgamebtn')
                .setLabel('Set Up Game')
                .setStyle('PRIMARY')
            
            const removeGameBtn = new Discord.MessageButton()
                .setCustomId('removegamebtn')
                .setLabel('Remove Game')
                .setStyle('DANGER')
            
            
            // Create the embed and the component, which will serve as placeholders
            const embed  = new Discord.MessageEmbed()
                .setColor('#ffffff')
                .setFooter({ text: message.guild.name });
            
            // By default, only add games button is necessary
            const btns = [setGameBtn]

            if (json_data.length === 0) {
                embed.setTitle('No game has been set for news notifications yet.')
            }
            else {
                embed.setTitle(`Updates List`)
                    .addFields(get_fields(json_data))
                
                // Add the remove game button
                btns.push(removeGameBtn)
            }

            message.channel.send({
                embeds: [embed],
                components: [new Discord.MessageActionRow().addComponents(btns)]
            })
            .then(news_msg => {
                // Handle interaction with buttons
                const filter = (i) =>
                    i.customId === btns[0].customId ||
                    i.customId === btns[btns.length - 1].customId   // If there is only 1 button, then there is no problem

                const collector = news_msg.createMessageComponentCollector({
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
                            case 'setgamebtn':
                                await interaction.deferUpdate()
                                handleSetUpGameNews(client, db, interaction)
                                break;

                            case 'removegamebtn':
                                await interaction.deferUpdate()
                                get_guild_news_updates(db, interaction.message.guild.id).then(json_data => {
                                    handleRemoveGameNews(db, interaction, json_data)
                                })
                                .catch(fetch_guild_updates_error => {
                            
                                })
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
        
                        news_msg.edit({
                            embeds: [embed],
                            components: [disabledRow],
                        })
                        .catch(msg_error => {
                            
                        });
                    }
                });
            })
            .catch(error => {
                
            })
        })
        .catch(error => {
            
        })
    }
}

/**
 * Gets a list of the set up notifications in a given guild as [ { gameID, channelID }, ... ]
 * @param {*} db The DB instance
 * @param {*} guildID The guild ID
 * @returns 
 */
function get_guild_news_updates(db, guildID) {
    return new Promise((success, failure) => {
        const updateslist_query = `SELECT gameID, channelID FROM UpdatesChannels WHERE guildID = '${guildID}'`
        db.query(updateslist_query, async (error, results) => {
            if (error) {
                failure(error)
            }
            else {
                success(results)
            }
        });
    })
}

function get_fields(json_data) {
    let games = ''
    let channels = ''

    for (data of json_data) {
        games += gamesConfig[data['gameID']].title + '\n'
        channels += `<#${data['channelID']}>\n`
    }

    return [
        {
        "name": `Games`,
        "value": games,
        "inline": true
        },
        {
        "name": `Channels`,
        "value": channels,
        "inline": true
        }
    ]
}