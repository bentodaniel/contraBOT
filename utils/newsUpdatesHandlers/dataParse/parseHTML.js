const cheerio = require('cheerio');
const request = require('request');

const parseHTML = (game, request_data, entry_limit) => {
    if (game === 'free') {
        return scrape_free(request_data, entry_limit)
    }
    else if (game === 'wow') {
        return scrape_wow(request_data, entry_limit)
    }
}

module.exports = parseHTML

/**************************************************************
 *              PARSE FUNCTIONS ONLY HTML
 **************************************************************/

async function scrape_free(body, entry_limit) {
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

        return json_data.length < entry_limit
    })
    return json_data
}

// -----------------------------------------------

async function scrape_wow(body, entry_limit) {
    var json_data = []
    const $ = cheerio.load(body);

    // Loop through each of the news posts
    await $('.NewsBlog').each(function(i, item){
        var data = {}

        // Loop through the children
        for (child of $(item).children()) {

            if (child.name === 'div') {
                const list_block = $(child).children()[0]
                const content_block = $(list_block).children()[1]

                for (block_child of $(content_block).children()) {
                    var cName = $(block_child).attr('class')

                    if (cName === 'contain-large contain-left') {
                        // its the title and description
                        for (content_data of $(block_child).children()) {
                            var contentCName = $(content_data).attr('class')

                            if (contentCName === 'NewsBlog-title') {
                                data['title'] = $(content_data).text()
                            }
                            else if (contentCName === 'NewsBlog-desc color-beige-medium font-size-xSmall') {
                                data['content'] = $(content_data).text()
                            }
                        }
                    }
                    else {
                        // its the time
                        const date_div = $(block_child).find('.NewsBlog-date')
                        const data_props = $(date_div).attr('data-props')

                        var re = new RegExp('\{\"iso8601\"\:\"(.*)T.*');
                        var r = data_props.match(re);

                        if (r) {
                            data['date'] = r[1]
                        }
                        else {
                            data['date'] = 'N/A'
                        }
                    }
                }
            }
            else if (child.name === 'a') {
                const base_link = 'https://worldofwarcraft.com'
                data['url'] = base_link + $(child).attr('href')
            } 
        }
        json_data.push(data)

        return json_data.length < entry_limit
    })
    return json_data
}

/**************************************************************
 *              PARSE FUNCTIONS ALTERNATIVE HTML
 **************************************************************/

async function scrape_apex(body, entry_limit) {
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

        return json_data.length < entry_limit
    })
    return json_data
}

// -----------------------------------------------

async function scrape_csgo(body, entry_limit) {
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

        return json_data.length < entry_limit
    })
    return json_data
}

// -----------------------------------------------

async function scrape_cycle(body, entry_limit) {
    const $ = cheerio.load(body);

    var urls = []

    // Loop through each of the news posts
    await $('.group.blog-item').each(function(i, post){
        const link_child = $(post).children()[0]
        urls.push('https://thecycle.game' + $(link_child).attr('href'))

        return urls.length < entry_limit
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
                            const date = new Date($(child).text())
                            data['date'] = date.toISOString() // note that item_data.date is a unix timestamp
                                .replace(/T.*/, '')
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