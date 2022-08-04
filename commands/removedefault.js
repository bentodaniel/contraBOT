const utils = require('../utils/utils');

module.exports = {
    name: 'removedefault',
    short_name: 'remdef',
    description: 'Removed the default channel. The bot will no longer notify your server of any patch notes',
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
            const q = `SELECT * FROM Guilds WHERE guildID = ${message.guild.id} defaultChannelID IS NOT NULL LIMIT 1`
            db.query(q, async (error, results) => {
                if (error) {
                    // TODO
                    // tell the user that there was an error?
                }
                else {
                    
                    // TODO
                    //if it is empty, tell the user a default is not set

                    // else, try to change it to null. tell the user what happened..

                }
            })
        }
    }
}