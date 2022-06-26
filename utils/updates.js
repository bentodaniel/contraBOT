const request = require('request');
const cheerio = require('cheerio');
const xhr_req = require('xhr-request');

function get_updates(db, game_data) {
    for (const [ key, value ] of Object.entries(game_data)) {
        // do something with `key` and `value`
    }
}

module.exports = {
    get_updates
}

