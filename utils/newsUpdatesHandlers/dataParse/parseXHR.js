const parseXHR = (game, request_data, entry_limit) => {
    if (game === 'lol') {
        return parse_lol(request_data, entry_limit)
    }
    else if (game === 'valorant') {
        return parse_valorant(request_data, entry_limit)
    }
    else {
        return parse_steamAPI(request_data, entry_limit)
    }
}

module.exports = parseXHR

/**************************************************************
 *              PARSE FUNCTIONS
 **************************************************************/

async function parse_lol(request_data, entry_limit) {
    var json_data = []

    const articles = request_data.result.data.articles.nodes

    Object.entries(articles).some(([key, value]) => {
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

        return json_data.length >= entry_limit
    })
    return json_data
}

// -----------------------------------------------

async function parse_valorant(request_data, entry_limit) {
    var json_data = []

    const articles = request_data.result.pageContext.data.articles

    Object.entries(articles).some(([key, value]) => {
        var data = {}

        data['title'] = value.title
        data['date'] = value.date.split('T')[0]
        data['content'] = value.description
        data['url'] = value.external_link
        if (data['url'] === '') {
            data['url'] = 'https://playvalorant.com/en-us' + value.url.url
        }
        json_data.push(data)

        return json_data.length >= entry_limit
    })
    return json_data
}

// -----------------------------------------------

async function parse_steamAPI(request_data, entry_limit) {
    var json_data = []

    const news_data = request_data.appnews
    for (const [ index, item_data ] of Object.entries(news_data.newsitems)) {
        if (item_data.feedname !== 'steam_community_announcements'){
            continue
        }

        var data = {}

        data['title'] = item_data.title
        data['date'] = new Date(item_data.date * 1000).toISOString() // note that item_data.date is a unix timestamp
            .replace(/T.*/, '')     // remove T and everything after
        data['content'] = item_data.contents
            .replace(/{STEAM_CLAN_IMAGE}\/.*.png/g, '')
        data['url'] = item_data.url.replace(' ', '%20')

        json_data.push(data)

        if (json_data.length >= entry_limit) {
            break
        }
    }
    return json_data
}