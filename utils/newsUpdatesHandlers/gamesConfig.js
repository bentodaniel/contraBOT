/**
 * Returns the steam web API link according to an app ID
 * @param {*} appID 
 * @returns 
 */
function get_steam_link(appID) {
    const max_entries = 50
    const max_length = 500
    const steamAPIcallVersion = 'v0002'
    return `https://api.steampowered.com/ISteamNews/GetNewsForApp/${steamAPIcallVersion}/?appid=${appID}&count=${max_entries}&maxlength=${max_length}`
}

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
        xhr_url : get_steam_link(1172470),
        html_url : 'https://www.ea.com/games/apex-legends/news',
        logo : 'https://logodownload.org/wp-content/uploads/2019/02/apex-legends-logo-1.png',
        emoji : {
            id : '1038940457268412416',
            name : 'game_apex_legends'
        }
    },
    cod_mw2 : {
        title : 'Call of Duty: Modern Warfare II',
        xhr_url : get_steam_link(1938090),
        logo : 'https://www.gamespot.com/a/uploads/scale_landscape/1179/11799911/3970376-screenshot2022-04-28at1.24.23pm.png',
        emoji : {
            id : '1038946315121463306',
            name : 'game_cod_mw2'
        }
    },
    csgo : {
        title : 'Counter-Strike: Global Offensive',
        xhr_url : get_steam_link(730),
        html_url : 'https://blog.counter-strike.net/index.php/category/updates/',
        logo : 'https://cnlgaming.gg/wp-content/uploads/ava-CSGO.png',
        emoji : {
            id : '1038946953616179351',
            name : 'game_csgo'
        }
    },
    cycle : {
        title : 'The Cycle: Frontier',
        xhr_url : get_steam_link(868270),
        html_url : 'https://thecycle.game/news-and-media',
        logo : 'https://yt3.ggpht.com/CJ4b0OKg5izpM6wl0LxIOcZ9cixUtOM0ZO6_-4B8lQnAJTjkzb3Th6pXVneSV1wPFcSo_B3bl8o=s900-c-k-c0x00ffffff-no-rj',
        emoji : {
            id : '1038947428780490872',
            name : 'game_cycle'
        }
    },
    dota2 : {
        title : 'Dota 2',
        xhr_url : get_steam_link(570),
        logo : 'https://i.pinimg.com/originals/c1/ec/da/c1ecda477bc92b6ecfc533b64d4a0337.png',
        emoji : {
            id : '1038951592700940350',
            name : 'game_dota2'
        }
    },
    lol : {
        title : 'League of Legends',
        xhr_url : 'https://www.leagueoflegends.com/page-data/en-us/news/tags/patch-notes/page-data.json',
        logo : 'https://styles.redditmedia.com/t5_2rfxx/styles/communityIcon_9yj66cjf8oq61.png',
        emoji : {
            id : '1038950591478648923',
            name : 'game_lol'
        }
    },
    payday2 : {
        title : 'Payday 2',
        xhr_url : get_steam_link(218620),
        logo : 'https://cdn2.steamgriddb.com/file/sgdb-cdn/icon/8b0dc65f996f98fd178a9defd0efa077/32/256x256.png',
        emoji : {
            id : '1038952193044263012',
            name : 'game_payday2'
        }
    },
    valorant : {
        title : 'Valorant',
        xhr_url : 'https://playvalorant.com/page-data/en-us/news/game-updates/page-data.json',
        logo : 'https://images.cults3d.com/4QqRV9kLYYEuw9ur_X3yjQl1sjk=/516x516/https://files.cults3d.com/uploaders/15024335/illustration-file/a86d53e4-2bd9-4a8f-9550-986686c3131a/gi0mAjIh_400x400.png',
        emoji : {
            id : '1038949650301980717',
            name : 'game_valorant'
        }
    },
    wow : {
        title : 'World of Warcraft',
        html_url : 'https://worldofwarcraft.com/en-us/news',
        logo : 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/WoW_icon.svg/2048px-WoW_icon.svg.png',
        emoji : {
            id : '1038949881672376380',
            name : 'game_wow'
        }
    },
}
