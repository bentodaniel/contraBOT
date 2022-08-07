const utils = require('../utils/utils');

module.exports = {
    name: 'setdefault',
    short_name: 'setdef',
    description: 'Defines a channel for bot patch notes',
    arguments: '',
    adminOnly: true,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // only the owner has access to this command
        if (message.author.id !== message.guild.ownerId) {
            utils.send_error_message(message, 'You do not have permissions to use that command', 'send')
        }
        else {
            message.guild.channels.fetch().then(channels => {
                message.channel.send({
                    content : message.author.toString(),
                    embeds : [{
                        'type' : 'rich',
                        'title': `Select the channel you would like to set as default if you wish to be notified regarding patch notes.\nI can not see channels marked with ❌`,
                        'color' : 0x00FFFF,
                    }],
                    components: [{
                        'type': 1,
                        'components': [{
                            "custom_id": `channel_select`,
                            "placeholder": `Select default channel`,
                            "options": utils.parse_channels_to_select_options(channels, message.guild),
                            "min_values": 1,
                            "max_values": 1,
                            "type": 3
                        }]
                    }]
                })
                .then(select_msg => {
                    this.handleSelectDefault(client, db, message.guild, select_msg)
                })
                .catch(msg_error => {
                    console.log(`ERROR :: could not send 'channel selection' message on setdefault to channel ${message.channelId} in guild ${message.guildId}\n `, msg_error)
                });
            })
        }
    },
    async handleSelectDefault(client, db, guild, select_msg) {
        let allow_time_fail = true

        const channel_filter = (click) => click.user.id === guild.ownerId && click.message.id === select_msg.id
        const channel_collector = select_msg.createMessageComponentCollector({
            max: 1, // The number of times a user can click on the button
            time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
            channel_filter // Add the filter
        });
    
        channel_collector.on("collect", async interaction => {
            allow_time_fail = false

            const channelID = interaction.values[0]

            const channel = await client.channels.fetch(channelID)

            // check if the guild is in guilds table, if not, then try to add it
            const q = `REPLACE INTO Guilds (guildID, guildOwnerID, defaultChannelID) VALUES(${guild.id}, ${guild.ownerId}, ${channel.id})`
            db.query(q, async (error, results) => {
                if (error) {
                    utils.send_error_message(select_msg, `Failed to set the channel '${channel.name}' as default`, 'edit')
                }
                else {
                    utils.send_success_message(select_msg, `Channel '${channel.name}' has been set as default`, 'edit', channel.toString())
                }
            });
        });
            
        channel_collector.on("end", (collected) => {
            if (allow_time_fail) {
                //utils.send_error_message(select_msg, 'Channel selection time is over', 'edit', msg['content'])
                const component = select_msg.components[0]
                component.components[0].disabled = true

                select_msg.edit({
                    components: [component]
                })
                .catch(msg_error => {
                    console.log(`ERROR :: could not edit setupdates message to disable channel selection to channel ${select_msg.channelId} in guild ${guild.id}\n `, msg_error)
                });
            }
        });
    }
}


