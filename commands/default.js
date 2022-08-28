const dbUtils = require('../database/utils')

module.exports = {
    name: 'default',
    short_name: 'd',
    description: `Check what channel is set as the guild's default channel. Set, modify or remove the default channel.`,
    arguments: '',
    adminOnly: false,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        const guild = message.guild

        // Get the default channel
        dbUtils.get_guild_default_channel(db, guild.id).then(default_channel_results => {            
            // Two default buttons
            const setDefaultBtn = new Discord.MessageButton()
                .setCustomId('setdefaultbtn')
                .setLabel('Set Default')
                .setStyle('PRIMARY')
            
            const removeDefaultBtn = new Discord.MessageButton()
                .setCustomId('removedefaultbtn')
                .setLabel('Remove Default')
                .setStyle('DANGER')
                .setDisabled(default_channel_results.length === 0) // disable if there is no default channel set
            
            const btns = [setDefaultBtn, removeDefaultBtn]

            // Create the embed and the component, which will serve as placeholders
            const embed  = new Discord.MessageEmbed()
                .setColor('#ffffff')

            if (default_channel_results.length === 0) {
                embed.setTitle('A default channel has not been set yet.')
            }
            else {
                embed.setTitle(`Default Channel`)
                    .setDescription(`'${guild.name}'s default channel is <#${default_channel_results[0]['defaultChannelID']}>`)
            }

            message.channel.send({
                embeds: [embed],
                components: [new Discord.MessageActionRow().addComponents(btns)]
            })
            .catch(error => {
                console.log(error)
            })
        })
        .catch(error => {
            //`There was an error while trying to get info of the default channel. Please try again.`
            console.log(error)
        })
    }
}
