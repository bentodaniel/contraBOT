const utils = require('../../utils/utils')

module.exports = (Discord, client, db, message) => {
    var prefix = process.env.MSG_PREFIX

    if (!message.content.startsWith(prefix) || message.author.bot)
        return;

    const content = message.content.slice(prefix.length).split(/\s(.*)/s);

    const args = content.length > 1 ? content[1] : ''
    const command = content[0].toLowerCase();

    // Get the file info from commands
    const command_file = client.commands.get(command)

    if (command_file) {
        // If it has all needed permissions, execute
        if (utils.get_has_permissions(message.channel, message.guild.me)) {
            command_file.execute(client, message, args, Discord, db);
        }
        else {
            // Otherwise, try to inform the user
            message.channel.send({
                content : `I do not have all necessary permissions.\nI require: 'View Channel', 'Send Messages', 'Embed Links', 'Attach Files'`
            })
            .catch(msg_error => {
                console.log(`ERROR :: Failed to send 'no permissions' message to channel ${message.channelId} in guild ${message.guildId} :: `, msg_error)
            });
        }
    }
    else {
        message.channel.send({
            'content' : ' ',
            'tts': false,
            'embeds' : [{
                'type' : 'rich',
                'title': 'Bad command',
                'color' : 0xff0000,
                'description': `I don't recognize that command.\nTry using '**${process.env.MSG_PREFIX}help**'`
            }]
        })
        .catch(msg_error => {
            console.log(`ERROR :: Failed to send 'wrong command' message to channel ${message.channelId} in guild ${message.guildId} :: `, msg_error)
        });
    }
}