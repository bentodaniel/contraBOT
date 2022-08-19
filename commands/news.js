const gamesConfig = require('../utils/newsUpdatesHandlers/gamesConfig')
const handleSetUpGameNews = require('../utils/newsUpdatesHandlers/handleSetUpGameNews')
const handleRemoveGameNews = require('../utils/newsUpdatesHandlers/handleRemoveGameNews')
const dbUtils = require('../database/utils')
const embedPagination = require('../utils/embedPagination')

module.exports = {
    name: 'news',
    short_name: 'n',
    description: 'Check what games are set up for news notifications. Set up more games for news notifications or remove them.',
    arguments: '',
    adminOnly: false,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        // Send placeholder message
        message.channel.send(`Getting data from database...`).then(placeholder_news_msg => {
            // Get the updates that have been set up
            dbUtils.get_guild_news_updates(db, message.guild.id).then(json_data => {
                const embeds = getEmbeds(Discord, json_data)
                
                // Two default buttons
                const setGameBtn = new Discord.MessageButton()
                    .setCustomId('setupgamenewsbtn')
                    .setLabel('Set Up Game')
                    .setStyle('PRIMARY')
                
                const removeGameBtn = new Discord.MessageButton()
                    .setCustomId('removegamenewsbtn')
                    .setLabel('Remove Game')
                    .setStyle('DANGER')
                    .setDisabled(json_data.length === 0) // disable if the list is empty
                
                const btns = [setGameBtn, removeGameBtn]

                if (embeds.length === 1) {
                    // if there is nothing or there is only one page (less than 10), there is no need for pagination

                    placeholder_news_msg.edit({
                        embeds: embeds,
                        components: [new Discord.MessageActionRow().addComponents(btns)]
                    })
                    .catch(error => {
                        
                    })
                }
                else {
                    // If there is more than one page, then use pagination
                    embedPagination(
                        Discord, placeholder_news_msg, embeds, 120000, null, btns
                    )
                    .catch(paginate_error => {
                        //console.log(paginate_error)
                    })
                }
            })
            .catch(fetch_guild_news_updates_error => {
                console.log(fetch_guild_news_updates_error)
            })
        })
        .catch(placeholder_news_msg => {
                
        })
    }
}

function getEmbeds(Discord, json_data) {
    embedList = []

    if (json_data.length === 0) {
        embedList.push(
            new Discord.MessageEmbed()
                .setColor('#ffffff')
                .setTitle('No game has been set for news notifications yet.')
        )
    }
    else {
        const chunkSize = 10;
        for (let i = 0; i < json_data.length; i += chunkSize) {
            const chunk = json_data.slice(i, i + chunkSize);

            embedList.push(
                new Discord.MessageEmbed()
                    .setColor('#ffffff')
                    .setTitle('Updates List')
                    .addFields(get_fields(chunk))
            )
        }
    }
    return embedList
}

function get_fields(json_data) {
    let games = ''
    let channels = ''

    for (data of json_data) {
        games += gamesConfig[data['gameID']].title + '\n'
        channels += `<#${data['channelID']}>\n`
    }

    return [
        {
        "name": `Games`,
        "value": games,
        "inline": true
        },
        {
        "name": `Channels`,
        "value": channels,
        "inline": true
        }
    ]
}