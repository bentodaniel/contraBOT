const gamesConfig = require('./gamesConfig')
const utils = require('../utils');

/**
 * Handle the execution of setting up notifications for game news
 * @param {*} client The bot's client
 * @param {*} db The DB instance
 * @param {*} i The interaction that started this execution
 */
const handleSetUpGameNews = async(client, db, i) => {
    const message = i.message
    const user = i.user

    // reply to interaction with the game selection message
    message.channel.send({
        content : user.toString(),
        embeds : [{
            'type' : 'rich',
            'title': `Select the game you would like to set up for news notifications.`,
            'color' : 0xffffff,
        }],
        components: [{
            'type': 1,
            'components': [{
                "custom_id": `updates_game_select`,
                "placeholder": `Select game`,
                "options": parse_game_data(gamesConfig),
                "min_values": 1,
                "max_values": 1,
                "type": 3
            }]
        }]
    })
    .then(game_select_msg => {
        const filter = (click) => click.customId === 'updates_game_select'

        const collector = game_select_msg.createMessageComponentCollector({
            //max: 1, // The number of times a user can click on the button
            time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
            filter // Add the filter
        });

        collector.on("collect", async interaction => {
            if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
                interaction.reply({ content: `This select menu is for the administrators' use only.`, ephemeral: true }).catch(error => {
                    console.log(`ERROR :: Failed to send 'select menu not for you' reply on 'handleSetUpGameNews' :: `, error)
                })
            }
            else {
                const gameID = interaction.values[0]
                handleGameSelectec(client, db, interaction, gameID)
                game_select_msg.delete().catch(error => {
                    console.log(`ERROR :: Failed to remove selection message on 'handleSetUpGameNews' on success :: `, error)
                });
            }
        })

        collector.on("end", (_, reason) => {
            if (reason !== "messageDelete") {
                game_select_msg.delete().catch(error => {
                    console.log(`ERROR :: Failed to remove selection message on 'handleSetUpGameNews' on timeout :: `, error)
                });
            }
        });
    })
    .catch(game_select_msg_error => {
        console.log(`ERROR :: Failed to send 'game selection' message on 'handleSetUpGameNews' :: `, game_select_msg_error)
    })
}

/**
 * Parses a json file containing games available for notifications into a list of options for a select menu
 * @param {*} games the json containing the games data
 * @returns 
 */
function parse_game_data(games) {
    res = []
    for (const [ game_id, game_data ] of Object.entries(games)) {
        res.push({
            'label': game_data.title,
            'value': '' + game_id,
            'default': false
        })
    }
    return res
}

/**
 * Execute after a game has been selected for news notifications
 * @param {*} client The bot's client
 * @param {*} db The DB instance
 * @param {*} i The interaction that started this execution
 * @param {*} gameID The id if the selected game
 */
function handleGameSelectec(client ,db, i, gameID) {
    const message = i.message
    const user = i.user

    message.guild.channels.fetch().then(channels => {
        message.channel.send({
            content : user.toString(),
            embeds : [{
                'type' : 'rich',
                'title': `Select the channel where I should notify the server of news on '${gamesConfig[gameID].title}'.`,
                'description': `I do not have all necessary permissions in channels marked with ❌\n\nPermissions: 'View Channel', 'Send Messages', 'Embed Links', 'Attach Files' are necessary.`,
                'color' : 0xffffff,
            }],
            components: [{
                'type': 1,
                'components': [{
                    "custom_id": `updates_channel_select`,
                    "placeholder": `Select channel`,
                    "options": utils.parse_channels_to_select_options(channels, message.guild),
                    "min_values": 1,
                    "max_values": 1,
                    "type": 3
                }]
            }]
        })
        .then(channel_select_msg => {
            const filter = (click) => click.customId === 'updates_channel_select'

            const collector = channel_select_msg.createMessageComponentCollector({
                //max: 1, // The number of times a user can click on the button
                time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                filter // Add the filter
            });

            collector.on("collect", async interaction => {
                if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
                    interaction.reply({ content: `This select menu is for the administrators' use only.`, ephemeral: true }).catch(error => {
                        console.log(`ERROR :: Failed to send 'select menu not for you' reply on 'handleSetUpGameNews.handleGameSelectec' :: `, error)
                    })
                }
                else {
                    const channelID = interaction.values[0]
                    handleAddGameToUpdatesDB(client ,db, interaction, gameID, channelID)
                    channel_select_msg.delete().catch(error => {
                        console.log(`ERROR :: Failed to remove channel selection message on 'handleSetUpGameNews.handleGameSelectec' on success :: `, error)
                    });
                }
            })

            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    channel_select_msg.delete().catch(error => {
                        console.log(`ERROR :: Failed to remove channel selection message on 'handleSetUpGameNews.handleGameSelectec' on timeout :: `, error)
                    });
                }
            });
        })
        .catch(channel_select_msg_error => {
            console.log(`ERROR :: Failed to send 'channel select' message on 'handleSetUpGameNews.handleGameSelectec' :: `, channel_select_msg_error)
        })
    })
    .catch(channel_fetch_error => {
        console.log(`ERROR :: Failed to fetch guild channels on 'handleSetUpGameNews.handleGameSelectec' :: `, channel_fetch_error)

        i.reply({ content: `Failed to fetch channels in this server. Please try again`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'fail to get channels' reply on 'handleSetUpGameNews.handleGameSelectec' :: `, error)
        })
    })
}

/**
 * Handle the process of adding a game and a channel to the game notifications database
 * @param {*} client The bot's client
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @param {*} gameID The id of the game
 * @param {*} channelID The id of the channel
 */
async function handleAddGameToUpdatesDB(client, db, interaction, gameID, channelID) {
    const guild = interaction.message.guild

    // check if the guild is in guilds table, if not, then try to add it
    const guilds_query = `SELECT * FROM Guilds WHERE guildID = ${guild.id} LIMIT 1`
    db.query(guilds_query, async (guilds_error, guilds_results) => {
        // if there are results, and the list is empty, we need to insert it
        if (!guilds_error && guilds_results.length === 0) {
            // add to table Guilds
            try {
                db.query(
                    `INSERT INTO Guilds VALUES (${guild.id}, ${guild.ownerId}, ${null})`
                );
            } catch (err) {
                console.log(`ERROR :: failed to insert guild ${guild.name} with id ${guild.id} into db during setupdates :: `, err)
            }
        }

        // then, try to add to UpdatesChannels
        //  - there was an error getting the guild from table or the guild is in table (doesnt matter)

        const channel = await client.channels.fetch(channelID)

        const insert_updates_query = `REPLACE INTO UpdatesChannels (gameID, channelID, guildID) VALUES('${gameID}', ${channel.id}, ${guild.id})`
        db.query(insert_updates_query, async (error, results) => {
            if (error) {
                interaction.reply({ content: `Failed to set up news notifications for '${gamesConfig[gameID].title}'.`, ephemeral: true }).catch(error => {
                    console.log(`ERROR :: Failed to send 'failed to set up' reply on 'handleSetUpGameNews.handleAddGameToUpdatesDB' :: `, error)
                })
            }
            else {
                // Send message confirming the removal of the default channel
                interaction.message.channel.send({
                    embeds : [{
                        'type' : 'rich',
                        'title': `Game news notifications set up.`,
                        'description': `Channel ${channel.toString()} has been set as default for '**${gamesConfig[gameID].title}**' news notifications.`,
                        'color' : 0xffffff,
                    }]
                })
                .catch(error => {
                    console.log(`ERROR :: Failed to send 'success' message on 'handleSetUpGameNews.handleAddGameToUpdatesDB' :: `, error)
                })
            }
        });
    });
}

module.exports = handleSetUpGameNews
