const utils = require('../utils/utils')
const constants = require('../utils/constants')

module.exports = {
    name: 'updateslist',
    short_name: 'ul',
    description: 'Displays info about the games set up for updates',
    arguments: '',
    adminOnly: false,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {
        message.channel.send(`Getting data...`).then(msg => {
            utils.get_guild_updates(db, message.guild.id).then(json_data => {
                
                msg.edit({
                    'content': ' ',
                    'embeds': [
                        {
                            'type': 'rich',
                            'title': `Updates List`,
                            'color': 0x00FFFF,
                            'fields': get_fields(json_data),
                            'footer': {
                                'text': message.guild.name
                            }
                        }
                    ]
                })
            })
        })
    }
}

function get_fields(json_data) {
    let games = ''
    let channels = ''

    for (data of json_data) {
        games += constants.games[data['gameID']].title + '\n'
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

