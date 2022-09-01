const cheerio = require('cheerio');
const request = require('request');

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
    try {
        const json_data = await scrape_parse(body, game)
        const news_data = parse_data(json_data, game_recorded_data)
        return news_data
    }
    catch(err) {
        console.log(`ERROR :: There was an error while trying to scrape news data for ${game} :: `, err)
        return {}
    }
}

// Execute the scrape function correspondent to the game
async function scrape_parse(body, game) {
    if (game === 'free') {
        return await scrape_free(body)
    }
    else if (game === 'apex') {
        return await scrape_apex(body)
    }
    else if (game === 'csgo') {
        return await scrape_csgo(body)
    }
    else if (game === 'cycle') {
        return await scrape_cycle(body)
    }
    else if (game === 'lol') {
        return await scrape_lol(body)
    }
    else if (game === 'valorant') {
        return await scrape_valorant(body)
    }
    else {
        console.log(`ERROR :: Not implemented. Tried to get news for '${game}'`)
        return undefined
    }
}

// Remove news that are too old
// Limit to 10
function parse_data(json_data, game_recorded_data) {
    if (json_data === undefined) {
        return undefined
    }
    if (game_recorded_data === {}) {
        return json_data
    }

    var res_data = []
    count = 0
    for (j_data of json_data) {
        // According to the way it is scraped, the most recent should come in first
        // therefore, as soon as we see the same link, just return the ones we found until now
        // otherwise, keep adding
        if (j_data['url'] === game_recorded_data.updateLink) {
            return res_data
        }
        res_data.push(j_data)
        count += 1

        if (count >= 10) {
            break
        }
    }
    return res_data
}

/**************************************************************
 *              GAME SCRAPE FUNCTIONS
 **************************************************************/

 async function scrape_free(body) {
    var json_data = []
    const $ = cheerio.load(body);

    // Loop through each of the free game news posts
    await $('.td-module-container.td-category-pos-image').each(function(i, post){
        var data = {}

        const contentData = $(post).children()[1]

        // Loop through the children
        for (child of $(contentData).children()) {
            var cName = $(child).attr('class')

            if (child.name === 'h3') {
                const link_child = $(child).children()[0]
                data['url'] = $(link_child).attr('href')
                data['title'] = $(link_child).text()
            }
            else if (cName === 'td-editor-date') {
                data['date'] = $(child).text().match(/(\w+\s+\d+\,\s+\d+)/g)[0]
            }
            else if (cName === 'td-excerpt') {
                data['content'] = $(child).text()
            }
        }
        json_data.push(data)
    })
    return json_data
}

// -----------------------------------------------

async function scrape_apex(body) {
    var json_data = []
    const $ = cheerio.load(body);

    // Loop through each of the news posts
    await $('ea-tile').each(function(i, tile){
        var data = {}

        // Loop through the children
        for (child of $(tile).children()) {
            if (child.name === 'h3') {
                data['title'] = $(child).text()
            }
            else if (child.name === 'div') {
                // we will have 2 divs, first 'Apex Legends' then the date. just replace it
                data['date'] = $(child).text()
            }
            else if (child.name === 'ea-tile-copy') {
                data['content'] = 'N/A'

                const parsed_text = $(child).text().split(/\s*\n\s*/g)

                if (parsed_text.length >= 2) {
                    data['content'] = parsed_text[1] // This should work out, as long as they dont change it
                }
            }
            else if (child.name === 'ea-cta') {
                const baseLink = 'https://www.ea.com'

                data['url'] = baseLink

                const link_child = $(child).children()[0]
                const href = $(link_child).attr('href')
                if (href !== undefined) {
                    data['url'] += href
                }
            }
        }
        json_data.push(data)
    })
    return json_data
}

// -----------------------------------------------

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

// -----------------------------------------------

async function scrape_cycle(body) {
    const $ = cheerio.load(body);

    var urls = []

    // Loop through each of the news posts
    await $('.group.blog-item').each(function(i, post){
        const link_child = $(post).children()[0]
        urls.push('https://thecycle.game' + $(link_child).attr('href'))
    })

    var promises = []
    for (url of urls) {
        const data = scrape_cycle_helper(url)
        promises.push(data)
    }
    return Promise.all(promises)
}

async function scrape_cycle_helper(url) {
    return new Promise(resolve => {
        var data = {}
        request(url, function (error, response, body) {
            if (error || !body){
                console.log(`ERROR :: couldn't get request data for scrape_cycle_helper in ${url} :: `, error);
            }
            else {
                data['url'] = url

                const $ = cheerio.load(body);

                $('.grid.grid-cols-1').each(function(i, grid_header){
                    const header_content = $(grid_header).children()[0]

                    for (child of $(header_content).children()) {
                        if (child.name === 'span') {
                            data['date'] = $(child).text()
                        }
                        else if (child.name === 'h1') {
                            data['title'] = $(child).text()
                        }
                    }
                })

                $('.main-content.relative').each(function(i, grid_content){
                    const content_data = $(grid_content).children()[0]

                    data['content'] = ''
                    for (let i = 0; i < 3; i++) {
                        const element = $(content_data).children()[i];
                        data['content'] += $(element).text() + '\n'
                    }
                })
                resolve(data)
            }
        })
    })
}

// -----------------------------------------------

async function scrape_lol(body) {
    var json_data = []

    const articles = body.result.data.articles.nodes

    Object.entries(articles).forEach(([key, value]) => {
        var data = {}

        data['title'] = value.title
        data['date'] = value.date.split('T')[0]
        data['content'] = value.description
        data['url'] = value.youtube_link
        if (data['url'] === '') {
            data['url'] = value.external_link
            
            if (data['url'] === '') {
                data['url'] = 'https://www.leagueoflegends.com/en-us' + value.url.url
            }
        }
        json_data.push(data)
    })
    return json_data
}

// -----------------------------------------------

async function scrape_valorant(body) {
    var json_data = []

    const articles = body.result.pageContext.data.articles

    Object.entries(articles).forEach(([key, value]) => {
        var data = {}

        data['title'] = value.title
        data['date'] = value.date.split('T')[0]
        data['content'] = value.description
        data['url'] = value.external_link
        if (data['url'] === '') {
            data['url'] = 'https://playvalorant.com/en-us' + value.url.url
        }
        json_data.push(data)
    })
    return json_data
}