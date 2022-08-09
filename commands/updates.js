const utils = require('../utils/utils')
const constants = require('../utils/constants')

module.exports = {
    name: 'updates',
    short_name: 'u',
    description: 'Check what games are set up for updates. Set up more games for updates or remove them.',
    arguments: '',
    adminOnly: false,
    showOnHelp: true,
    async execute(client, message, args, Discord, db) {

    }
}

// This command should work as list
// However, should have 2 butons: set up and remove - which should only be available for admin or owner