const utils = require('../utils/utils');

module.exports = {
    name: 'removedefault',
    short_name: 'remdef',
    description: 'Removes the default channel. The bot will no longer notify your server of any patch notes',
    arguments: '',
    adminOnly: true,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // only the owner has access to this command
        if (message.author.id !== message.guild.ownerId) {
            utils.send_error_message(message, 'You do not have permissions to use that command', 'send')
        }
        else {
             // Get all guilds that have set a default channel
            const q = `SELECT 1 FROM Guilds WHERE guildID = ${message.guild.id} AND defaultChannelID IS NOT NULL LIMIT 1`
            db.query(q, async (select_error, select_results) => {
                if (select_error) {
                    utils.send_error_message(message, `There was an error while trying to remove the default channel`, 'send')
                }
                else {
                    if (select_results.length === 0) {
                        utils.send_success_message(message, `A default channel has not been set yet`, 'send')
                    }
                    else {
                        // Replace guild's row
                        const replace_q = `REPLACE INTO Guilds (guildID, guildOwnerID, defaultChannelID) VALUES(${message.guild.id}, ${message.guild.ownerId}, ${null})`
                        db.query(replace_q, async (replace_error, replace_results) => {
                            if (replace_error) {
                                utils.send_error_message(message, `Failed to remove the default channel`, 'send')
                            }
                            else {
                                utils.send_success_message(message, `Default channel has been successfully removed`, 'send')
                            }
                        });
                    }
                }
            })
        }
    }
}