module.exports = {
    name: 'ping',
    description: 'Check the bot\'s status',
    arguments: '',
    isImplemented: true,
    execute(client, message, args, Discord) {
        message.channel.send({
            'content' : ' ',
            'tts': false,
            'embeds' : [{
                'type' : 'rich',
                'title': 'I\'m alive',
                'color' : 0x6fff00,
                'description': '\\o/'
            }]
        });
    }
}