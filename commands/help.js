module.exports = {
    name: 'help',
    description: 'Displays list of available commands',
    execute(client, message, args, Discord) {
        message.channel.send('Noone\'s gonna help you now');
    }
}