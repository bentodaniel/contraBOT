const fs = require('fs');

module.exports = (client, Discord, db) => {
    const command_files = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

    for (const file of command_files) {
        const command = require(`../commands/${file}`);

        if (command.name) {
            client.commands.set(command.name, command);
            //client.commands.set(command.short_name, command); // This will double the ammount of commands.. might not be a good idea in the future?
        }
        else {
            continue;
        }
    }
}