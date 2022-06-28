const cheerio = require('cheerio');

module.exports = {
    execute
}

/**
 * Executes the scraping and parsing of game's news data
 * @param {*} body The html body of the news website
 * @param {*} game The name of the game
 * @param {*} game_recorded_data The recorded data of the game
 * @returns 
 */
async function execute(body, game, game_recorded_data) {
    const json_data = await scrape_parse(body, game)
    const news_data = parse_data(json_data, game_recorded_data)
    return news_data
}

// Execute the scrape function correspondent to the game
async function scrape_parse(body, game) {
    if (game === 'csgo') {
        return await scrape_csgo(body)
    }
    else if (game === 'valorant') {
        return await scrape_valorant(body)
    }
    else if (game === 'lol') {
        return await scrape_lol(body)
    }
    else {
        console.log(`ERROR :: Not implemented. Tried to get news for '${game}'`)
        return undefined
    }
}

// Remove news that are too old
function parse_data(json_data, game_recorded_data) {
    if (json_data === undefined) {
        return undefined
    }
    if (game_recorded_data === {}) {
        return json_data
    }

    var res_data = []
    for (j_data of json_data) {
        // According to the way it is scraped, the most recent should come in first
        // therefore, as soon as we see the same link, just return the ones we found until now
        // otherwise, keep adding
        if (j_data['url'] === game_recorded_data.updateLink) {
            return res_data
        }
        res_data.push(j_data)
    }
    return res_data
}

/**************************************************************
 *              GAME SCRAPE FUNCTIONS
 **************************************************************/

async function scrape_csgo(body) {
    var json_data = []
    const $ = cheerio.load(body);

    // Loop through each of the news posts
    await $('.inner_post').each(function(i, post){
        var data = {}

        // Loop through the children
        for (child of $(post).children()) {
            var cName = $(child).attr('class')

            if (child.name === 'h2') {
                const link_child = $(child).children()[0]
                data['url'] = $(link_child).attr('href')
                data['title'] = $(link_child).text()
            }
            else if (cName === 'post_date') {
                data['date'] = $(child).text().replaceAll(' ', '').replaceAll('-', '')
            }
            else if (child.name === 'p') {
                // post_date is also a <p> but it should not enter here so its ok
                data['content'] = $(child).text()
            }
        }
        json_data.push(data)
    })
    return json_data
}

async function scrape_valorant(body) {

    return []
}

async function scrape_lol(body) {

    return []
}