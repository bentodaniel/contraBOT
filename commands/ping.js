module.exports = {
    name: 'ping',
    description: 'This is a ping command',
    execute(client, message, args, Discord) {
        message.channel.send('I\'m alive!! \\o/');
    }
}