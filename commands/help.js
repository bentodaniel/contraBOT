const fs = require('fs');

const dev_id = '422462317498728448'

module.exports = {
    name: 'help',
    short_name: 'h',
    description: 'Displays this message',
    arguments: '',
    showOnHelp: true,
    execute(client, message, args, Discord, db) {
        client.users.fetch(dev_id).then(dev_user => {
            message.channel.send({
                'content' : ' ',
                'tts': false,
                'embeds' : [{
                    'type' : 'rich',
                    'title': 'Available commands',
                    'color' : 0x00FFFF,
                    'description': get_commands(),
                    'footer' : {
                        'text' : `Developed by ${dev_user.username}`,
                        'icon_url': `${dev_user.avatarURL()}`
                    }
                }]
            });
        })
    }
}

function get_commands() {
    general = ''
    admin = ''
    for (let file of fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))) {
        const command = require(`../commands/${file}`);

        if (command.showOnHelp) {
            if (command.adminOnly) {
                admin += `[${command.short_name}] **${command.name} ${command.arguments}** - ${command.description}\n`;
                if (command.arguments_help) {
                    admin += `\u1CBC\u1CBC\u1CBC\u1CBC - ${command.arguments_help}\n`
                }
            }
            else {
                general += `[${command.short_name}] **${command.name} ${command.arguments}** - ${command.description}\n`;
                if (command.arguments_help) {
                    general += `\u1CBC\u1CBC\u1CBC\u1CBC - ${command.arguments_help}\n`
                }
            }
        }
        else {
            continue;
        }
    }
    return `__General__\n${general}\n\n__Admin Only__\n${admin}`
}