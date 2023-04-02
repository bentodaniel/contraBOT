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
            const contactBtn = new Discord.ButtonBuilder()
                .setCustomId('contactbtn')
                .setLabel('Contact Developer')
                .setStyle('Secondary')

            // Create the embed and the component, which will serve as placeholders
            const embed  = new Discord.EmbedBuilder()
                .setColor('#ffffff')
                .setTitle(`Available Commands`)
                .setDescription(get_commands())
                .setFooter({ text: `Developed by ${dev_user.username}`, iconURL: dev_user.avatarURL() });

            message.channel.send({
                embeds: [embed],
                components: [new Discord.ActionRowBuilder().addComponents(contactBtn)]
            })
            .catch(msg_error => {
                console.log(`ERROR :: Could not send 'help' message to channel ${message.channelId} in guild ${message.guildId} :: `, msg_error)
            });
        })
    }
}

function get_commands() {
    commands = ''
    for (let file of fs.readdirSync('./commands/').filter(file => file.endsWith('.js'))) {
        const command = require(`../commands/${file}`);

        if (command.showOnHelp) {
            commands += `[${command.short_name}] **${command.name} ${command.arguments}** - ${command.description}\n`;
            if (command.arguments_help) {
                commands += `\u1CBC\u1CBC\u1CBC\u1CBC - ${command.arguments_help}\n`
            }
        }
    }
    return commands
}