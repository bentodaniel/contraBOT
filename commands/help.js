const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'Displays this message',
    arguments: '',
    isImplemented: true,
    execute(client, message, args, Discord) {
        message.channel.send({
            'content' : ' ',
            'tts': false,
            'embeds' : [{
                'type' : 'rich',
                'title': 'Available commands',
                'color' : 0x00FFFF,
                'description': get_commands(),
                'footer' : {
                    'text' : 'Developed by agolf'
                }
            }]
        });
    }
}

function get_commands() {
    res = ''
    for (let file of fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))) {
        const command = require(`../commands/${file}`);

        if (command.name && command.isImplemented) {
            res += `**${command.name} ${command.arguments}** - ${command.description}\n`;
        }
        else {
            continue;
        }
    }
    return res
}