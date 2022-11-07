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
    brawlhalla : {
        title : 'Brawlhalla',
        xhr_url : get_steam_link(291550),
        logo : 'https://i.dlpng.com/static/png/6829432_preview.png',
        emoji : {
            id : '1039244307997139026',
            name : 'game_brawlhalla'
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
    destiny2 : {
        title : 'Destiny 2',
        xhr_url : get_steam_link(1085660),
        logo : 'https://pngimage.net/wp-content/uploads/2018/05/destiny-logo-png-2.png',
        emoji : {
            id : '1039153879327199272',
            name : 'game_destiny2'
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
    gta5 : {
        title : 'Grand Theft Auto V',
        xhr_url : get_steam_link(271590),
        logo : 'https://i.pinimg.com/originals/62/0c/89/620c89a5f0347147ea17036be706fc1b.png',
        emoji : {
            id : '1039150627059683368',
            name : 'game_gta5'
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
    pubg : {
        title : 'PUBG: BATTLEGROUNDS',
        xhr_url : get_steam_link(578080),
        logo : 'https://www.pngkey.com/png/full/28-280593_logo-pubg-logo-png-white.png',
        emoji : {
            id : '1039152471341285426',
            name : 'game_pubg'
        }
    },
    r6s : {
        title : 'Tom Clancy\'s Rainbow Six Siege',
        xhr_url : get_steam_link(359550),
        logo : 'https://static.wikia.nocookie.net/logopedia/images/7/79/R6S_old_icon.png',
        emoji : {
            id : '1039245587587006584',
            name : 'game_r6s'
        }
    },
    rust : {
        title : 'Rust',
        xhr_url : get_steam_link(252490),
        logo : 'https://aws1.discourse-cdn.com/business20/uploads/facepunch1/original/3X/e/a/ea6186e222e07c6ad661259bfda0cbce94288ffb.png',
        emoji : {
            id : '1039149945418174535',
            name : 'game_rust'
        }
    },
    tf2 : {
        title : 'Team Fortress 2',
        xhr_url : get_steam_link(440),
        logo : 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Team_Fortress_2_style_logo.svg/1024px-Team_Fortress_2_style_logo.svg.png',
        emoji : {
            id : '1039242884903354518',
            name : 'game_tf2'
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
    warframe : {
        title : 'Warframe',
        xhr_url : get_steam_link(230410),
        logo : 'https://n9e5v4d8.ssl.hwcdn.net/images/longlanding/lotusIcon.jpg',
        emoji : {
            id : '1039135568606539778',
            name : 'game_warframe'
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
