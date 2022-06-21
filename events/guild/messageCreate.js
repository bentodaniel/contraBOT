module.exports = (Discord, client, message) => {
    const prefix = '$';
    
    if (!message.content.startsWith(prefix) || message.author.bot)
        return;

    const content = message.content.slice(prefix.length).split(/\s(.*)/s);

    const args = content.length > 1 ? content[1] : ''
    const command = content[0].toLowerCase();

    // Get the file info from commands
    const command_file = client.commands.get(command)

    if (command_file) {
        command_file.execute(client, message, args, Discord);
    }
    else {
        message.channel.send('What?!');
    }
}