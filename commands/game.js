const request = require('request');
const cheerio = require('cheerio');
const xhr_req = require('xhr-request')

const emoji_numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const PAGE_LIMIT = 5;

module.exports = {
    name: 'game',
    description: 'This checks the price of a game in allkeyshop',
    execute(client, message, args, Discord) {
        //args = args.split(/\s*\|\s*/);

        var embeds_list = []
        var buttons_list = [];

        message.channel.send("Searching for results...").then(msg => {

            scrape_search(args, reply_search, msg).then((ret) => {

                embeds_list = ret[0]
                buttons_list = ret[1]
                
                // check if the user is the owner of the request and if the interaction is in the same message
                const filter = (click) => click.user.id === message.author.id && click.message.id == msg.id
                const collector = message.channel.createMessageComponentCollector({
                    max: 1, // The number of times a user can click on the button
                    time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
                    filter // Add the filter
                });

                collector.on("collect", async interaction => {
                    msg.edit({
                        "components": []
                    })
        
                    var i = find_index_of_button(buttons_list, interaction['customId'])
        
                    //interaction.reply('Not implemented yet :>')

                    interaction.reply({ content: `Searching for info on '**${embeds_list[i]['title'].slice(6)}**'`, fetchReply: true }).then((response_msg) => {
                        scrape_buy(embeds_list[i], handle_reply, response_msg);
                    })
                });
        
                collector.on("end", (collected) => {
                    // Disable all buttons if time runs out
                    msg.edit({
                        "components": []
                    })
                });
            })
        });
    }
}

function find_index_of_button(buttons_list, id) {
    for (let i = 0; i < buttons_list.length; i++) {
        if (buttons_list[i]['custom_id'] === id){
            return i;
        }
    }
    return -1;
}

async function scrape_search(search_val, callback, message) {
    const res = new Promise((success, failure) => {
        request(`https://www.allkeyshop.com/blog/catalogue/search-${search_val}/`, function (error, response, body) {
            if (error || !body){
                console.log(error);
                failure ([[], []])
            }
            else {
                var json_data = [];
                const $ = cheerio.load(body);

                // Loop through each of the link results
                $('.search-results-row-link').each(function(i, link_child){
                    var data = {}

                    var link_url = $(link_child).attr('href')
                    data['link'] = link_url;
                    
                    // Loop through the children
                    for (child of $(link_child).children()) {
                        var cName = $(child).attr('class')

                        if (cName === 'search-results-row-image') {
                            var image_div_url = $(child).children()[0].attribs['style']
                            image_div_url = image_div_url.replace(/.*url\(/g, '').slice(0, -1) // keep only the link
                            data['image_link'] = image_div_url;
                        }
                        else if (cName === 'search-results-row-game') {
                            for (gamec of $(child).children()) {
                                if ($(gamec).attr('class') === 'search-results-row-game-title') {
                                    data['title'] = $(gamec).text();
                                }
                                else if ($(gamec).attr('class') === 'search-results-row-game-infos') {
                                    data['infos'] = $(gamec).text();
                                }
                            }
                        }
                        else if (cName === 'search-results-row-price') {
                            data['price'] = $(child).text().trim().replace(/(\r\n|\n|\r)/gm, "");
                        }
                    }
                    json_data.push(data)
                });
                var callback_res = callback(json_data, message);
                success(callback_res)
            }
        });
    })
    return res
}

async function reply_search(json_data, message) {
    if (json_data === undefined) {
        message.edit({
            "content": '-',
            'embeds' : [{
                'type' : 'rich',
                'title': 'Could not get the data',
                'color' : 0xff0000,
            }]
        });
    }

    var embeds = generate_embeds_search(json_data);
    var buttons = generate_buttons(embeds);

    message.edit({
        "content": `Here are the first five results:`,
        "tts": false,
        "embeds": embeds,
        "components": [
            {
                'type' : 1,
                'components' : buttons
            }
        ]
    });
    return [embeds, buttons]
}

function generate_embeds_search(json_data) {
    var embeds = [];
    var count = 0;

    for (game of json_data) {
        var new_embed = {}

        new_embed['type'] = 'rich';
        new_embed['title'] =  emoji_numbers[count] + ' - ' + game['title'];
        new_embed['description'] = game['price'];
        new_embed['color'] = 0x6fff00,
        new_embed['thumbnail'] = {
            'url' : game['image_link'],
            'height' : 0,
            'width' : 0
        };
        new_embed['footer'] = {
            'text' : game['infos']
        }
        new_embed['url'] = game['link'];

        embeds.push(new_embed)

        count += 1;

        if (count >= PAGE_LIMIT) break;
    }
    return embeds;
}

function generate_buttons(embeds) {
    var btns = []
    for (let i = 0; i < embeds.length; i++) {
        var new_button = {
            "style": 1,
            "label": `${i+1}`,
            "custom_id": `row_0_button_${i}`,
            "disabled": false,
            "type": 2
        }
        btns.push(new_button)
    }
    return btns
}

async function scrape_buy(embed, callback, msg) {
    request(embed['url'], function (error, response, body) {
        if (error || !body){
            console.log(error);
        }
        else {
            var json_data = [];
            const $ = cheerio.load(body);

            const game_id = $('footer').next().text().replace('var game_id=','').replaceAll('\"', '')
            
            // TODO - could also get with other currencies - accepted:  \"eur\", \"gbp\", \"usd\"
            const currency = 'eur'

            xhr_req(`https://www.allkeyshop.com/blog/wp-admin/admin-ajax.php?action=get_offers&product=${game_id}&currency=${currency}&region=&edition=&moreq=&use_beta_offers_display=1`, {
                json: true
            }, function (err, req_data) {
                if (err) {
                    console.log(err)
                }
                else {
                
                    // the JSON result
                    //console.log(req_data)

                    Object.entries(req_data['offers']).forEach(([key, value]) => {
                        var data = {}
                        //console.log(key , value); // key ,value

                        data['buy_link'] = value.affiliateUrl
                        data['market'] = req_data['merchants'][value.merchant].name
                        data['region'] = req_data['regions'][value.region].filterName
                        data['edition'] = req_data['editions'][value.edition].name

                        var price_data = value.price[currency]

                        data['og_price'] = price_data.priceWithoutCoupon
                        data['price'] = price_data.price

                        var coupon_data = price_data.bestCoupon
                        if (coupon_data === null || coupon_data === undefined) {
                            data['coupon_value'] = 'N/A'
                            data['coupon_code'] = 'No coupon'
                        }
                        else {
                            data['coupon_code'] = coupon_data.code
                        }
                        json_data.push(data)
                    });

                    //console.log(json_data)
                    callback(json_data, msg, embed['title'].slice(6));
                }
            })
        }
    })
}


async function handle_reply(json_data, message, game_title) {
    if (json_data === undefined) {
        message.edit({
            "content": '-',
            'embeds' : [{
                'type' : 'rich',
                'title': 'Could not get the data',
                'color' : 0xff0000,
            }]
        });
    }    

    var embeds = generate_embeds_buy(json_data);

    message.edit({
        "content": `Here are the first five results for '**${game_title}**':`,
        "tts": false,
        "embeds": embeds,
    });
}

function generate_embeds_buy(json_data) {
    var embeds = [];
    var count = 1;
    for (game of json_data) {
        var new_embed = {}

        new_embed['type'] = 'rich';
        new_embed['title'] =  game['market'] + ' - BUY';
        new_embed['description'] = '';
        new_embed['color'] = 0x6fff00,
        new_embed['fields'] = [
            {
                "name": `Region`,
                "value": `${game['region']}`,
                "inline": true
            },
            {
                "name": `Edition`,
                "value": `${game['edition']}`,
                "inline": true
            },
            {
                'name': '\u200B',
                'value': '\u200B',
                'inline': true
            },
            {
                "name": `Old Price`,
                "value": `${game['og_price'] === '' ? 'N/A' : game['og_price']}`,
                "inline": true
            },
            {
                "name": `Coupon`,
                "value": `*${game['coupon_code']}*`,
                "inline": true
            },
            {
                "name": `Price`,
                "value": `${game['price']}`,
                "inline": true
            }
        ]
        new_embed['url'] = game['buy_link'];

        embeds.push(new_embed)

        count += 1
        if (count > 10) break
    }
    return embeds;
}