const gamesConfig = require('./gamesConfig')
const utils = require('../utils')

/**
 * Handle the execution of removing notifications for game news
 * @param {*} db The DB instance
 * @param {*} i The interaction that started this execution
 * @param {*} json_data The json containing all data about set up games
 */
const handleRemoveGameNews = async(db, i, json_data) => {
    const message = i.message
    const user = i.user

    if (json_data.length === 0) {
        i.reply({ content: `There are no set up game news notifications.`, ephemeral: true }).catch(error => {})
    }
    else {
        message.channel.send({
            content : user.toString(),
            embeds : [{
                'type' : 'rich',
                'title': `Select the games for which you want to stop receiving notifications.`,
                'color' : 0xffffff,
            }],
            components: [{
                'type': 1,
                'components': [{
                    "custom_id": `updates_remove_game_select`,
                    "placeholder": `Select channel`,
                    "options": parse_json_data(json_data),
                    "min_values": 1,
                    "max_values": json_data.length,
                    "type": 3
                }]
            }]
        })
        .then(select_remove_game_msg => {
            const filter = (click) => click.customId === 'updates_remove_game_select'
                
            const collector = select_remove_game_msg.createMessageComponentCollector({
                max: 1, // The number of times a user can click on the button
                time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                filter // Add the filter
            });

            collector.on("collect", async interaction => {
                if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
                    interaction.reply({ content: `This select menu is for the administrators' use only.`, ephemeral: true }).catch(error => {})
                }
                else {
                    let gamesIDs = ''
                    for (gameid of interaction.values) {
                        gamesIDs += `'${gameid}', `
                    }
                    gamesIDs = gamesIDs.slice(0, -2) // remove the ', '

                    const q = `DELETE FROM UpdatesChannels WHERE guildID = ${message.guild.id} AND gameID IN (${gamesIDs})`

                    db.query(q, async (error, results) => {
                        if (error) {
                            i.reply({ content: `There was an error while trying to remove games from the news notifications list.`, ephemeral: true }).catch(error => {})
                        }
                        else {
                            // Send message confirming the removal of the default channel
                            interaction.message.channel.send({
                                embeds : [{
                                    'type' : 'rich',
                                    'title': `Game news notifications removed.`,
                                    'description': `Some of the set up games for news notifications have been removed.\nUse '**${process.env.MSG_PREFIX}news**' to check the updated set up games list.`,
                                    'color' : 0xffffff,
                                }]
                            })
                            .catch(error => {
                                
                            })
                        }
                    });
                }
            })

            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    select_remove_game_msg.delete().catch(error => { });
                }
            });
        })
        .catch(select_remove_game_msg_error => {

        })
    }
}

/**
 * Parses json data of set up games for notifications into a list of select options
 * @param {*} json_data The json data to parse
 * @returns 
 */
function parse_json_data(json_data) {
    let res = []
    for (data of json_data) {
        const game = gamesConfig[data['gameID']]

        res.push({
            'label': game.title,
            'value': data['gameID'],
            'default': false
        })
    }
    return res
}

module.exports = handleRemoveGameNews
