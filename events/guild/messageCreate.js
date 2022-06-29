require('dotenv').config();

module.exports = (Discord, client, db, message) => {
    var prefix = '$'; // Default to prod
    if (process.env.ENV_TYPE === 'test') {
        prefix = process.env.TEST_MSG_PREFIX;
    }
    
    if (!message.content.startsWith(prefix) || message.author.bot)
        return;

    const content = message.content.slice(prefix.length).split(/\s(.*)/s);

    const args = content.length > 1 ? content[1] : ''
    const command = content[0].toLowerCase();

    // Get the file info from commands
    const command_file = client.commands.get(command)

    if (command_file) {
        command_file.execute(client, message, args, Discord, db);
    }
    else {
        message.channel.send({
            'content' : ' ',
            'tts': false,
            'embeds' : [{
                'type' : 'rich',
                'title': 'Bad command',
                'color' : 0xff0000,
                'description': 'I don\'t recognize that command.\nTry using \'**$help**\''
            }]
        });
    }
}