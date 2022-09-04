const max_entries = 50
const max_length = 500
const steamAPIcallVersion = 'v0002'

/**
 * Data for each of the items available for constant notifications on updates
 * By default, we will use the APIs, however, we will keep the html side up, in case we need it at some point
 */

module.exports = {
    free : {
        title : 'Free Games',
        html_url : 'https://www.indiegamebundles.com/category/free/',
        logo : ''
    },
    apex : {
        title : 'Apex Legends',
        xhr_url: `http://api.steampowered.com/ISteamNews/GetNewsForApp/${steamAPIcallVersion}/?appid=1172470&count=${max_entries}&maxlength=${max_length}`,
        html_url : 'https://www.ea.com/games/apex-legends/news',
        logo : 'https://logodownload.org/wp-content/uploads/2019/02/apex-legends-logo-1.png'
    },
    csgo : {
        title : 'Counter-Strike: Global Offensive',
        xhr_url: `http://api.steampowered.com/ISteamNews/GetNewsForApp/${steamAPIcallVersion}/?appid=730&count=${max_entries}&maxlength=${max_length}`,
        html_url : 'https://blog.counter-strike.net/index.php/category/updates/',
        logo : 'https://cnlgaming.gg/wp-content/uploads/ava-CSGO.png'
    },
    cycle : {
        title : 'The Cycle: Frontier',
        xhr_url: `http://api.steampowered.com/ISteamNews/GetNewsForApp/${steamAPIcallVersion}/?appid=868270&count=${max_entries}&maxlength=${max_length}`,
        html_url : 'https://thecycle.game/news-and-media',
        logo : 'https://yt3.ggpht.com/CJ4b0OKg5izpM6wl0LxIOcZ9cixUtOM0ZO6_-4B8lQnAJTjkzb3Th6pXVneSV1wPFcSo_B3bl8o=s900-c-k-c0x00ffffff-no-rj'
    },
    lol : {
        title : 'League of Legends',
        xhr_url : 'https://www.leagueoflegends.com/page-data/en-us/news/tags/patch-notes/page-data.json',
        logo : 'https://pentagram-production.imgix.net/cc7fa9e7-bf44-4438-a132-6df2b9664660/EMO_LOL_02.jpg?rect=0%2C0%2C1440%2C1512&w=640&crop=1&fm=jpg&q=70&auto=format&fit=crop&h=672'
    },
    valorant : {
        title : 'Valorant',
        xhr_url : 'https://playvalorant.com/page-data/en-us/news/game-updates/page-data.json',
        logo : 'https://images.cults3d.com/4QqRV9kLYYEuw9ur_X3yjQl1sjk=/516x516/https://files.cults3d.com/uploaders/15024335/illustration-file/a86d53e4-2bd9-4a8f-9550-986686c3131a/gi0mAjIh_400x400.png'
    },
    wow : {
        title : 'World of Warcraft',
        html_url : 'https://worldofwarcraft.com/en-us/news',
        logo : 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/WoW_icon.svg/2048px-WoW_icon.svg.png'
    },
}
