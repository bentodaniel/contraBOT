const puppeteer = require("puppeteer");

const emoji_numbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const PAGE_LIMIT = 5;

module.exports = {
    name: 'game',
    description: 'This checks the price of a game in allkeyshop',
    execute(client, message, args, Discord) {
        //args = args.split(/\s*\|\s*/);

        var embeds_list = []
        var buttons_list = [];
        var bot_msg = undefined;

        // check if the user is the owner of the request and if the interaction is in the same message
        const filter = (click) => click.user.id === message.author.id && click.message.id == bot_msg.id
        const collector = message.channel.createMessageComponentCollector({
            max: 1, // The number of times a user can click on the button
            time: 1000 * 30, // The amount of time the collector is valid for in milliseconds,
            filter // Add the filter
        });

        message.channel.send("Searching for results...").then(msg => {
            bot_msg = msg; // Define first~

            search_and_scrape(msg, args).then(data => {
                embeds_list = data[0]
                buttons_list = data[1]
                bot_msg = data[2]
            })
        });

        collector.on("collect", async interaction => {
            bot_msg.edit({
                "components": []
            })

            var i = find_index_of_button(buttons_list, interaction['customId'])

            interaction.reply({ content: `Searching for info on '**${embeds_list[i]['title'].slice(6)}**'`, fetchReply: true }).then((msg) => {
                handle_reply(embeds_list[i], msg)
            })
        });

        collector.on("end", (collected) => {
            // Disable all buttons if time runs out
            bot_msg.edit({
                "components": []
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

async function search_and_scrape(message, search_val) {
    var json_data = await scrape_search(search_val);
    if (json_data === undefined) {
        message.edit({
            "content": '',
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

    return [embeds, buttons, message]
}

async function scrape_search(search_val) {
    const browser = await puppeteer.launch({})
    const page = await browser.newPage()

    try {
        await page.goto(`https://www.allkeyshop.com/blog/catalogue/search-${search_val}/`)
    } catch (error) {
        console.log("error :: ", error.message)
        return undefined
    }
    
    var element = await page.waitForSelector('.search-results')

    var json_data = await page.evaluate((el) => {
        var data = [];

        for (c of el.children) {
            var child_data = {};
            
            var link_child = c.children[0];
            child_data['link'] = link_child.href;

            for (lc of link_child.children) {
                if (lc.className === 'search-results-row-image') {
                    var image_div = lc.children[0]
                    child_data['image_link'] = image_div.style.backgroundImage.slice(4, -1).replace(/"/g, "");;
                }
                else if (lc.className === 'search-results-row-game') {
                    for (gamec of lc.children) {
                        if (gamec.className === 'search-results-row-game-title') {
                            child_data['title'] = gamec.textContent;
                        }
                        else if (gamec.className === 'search-results-row-game-infos') {
                            child_data['infos'] = gamec.textContent;
                        }
                    }
                }
                else if (lc.className === 'search-results-row-price') {
                    child_data['price'] = lc.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                }
            }

            data.push(child_data);
        }
        return data
    }, element);

    browser.close();

    return json_data;
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
    buttons = []

    for (let i = 0; i < embeds.length; i++) {
        var new_button = {}
        new_button = {
            "style": 1,
            "label": `${i+1}`,
            "custom_id": `row_0_button_${i}`,
            "disabled": false,
            "type": 2
        }
        buttons.push(new_button)
    }
    return buttons
}

async function handle_reply(embed, message) {
    var json_data = await scrape_buy(embed['url']);
    if (json_data === undefined) {
        message.edit({
            "content": '',
            'embeds' : [{
                'type' : 'rich',
                'title': 'Could not get the data',
                'color' : 0xff0000,
            }]
        });
    }    

    var embeds = generate_embeds_buy(json_data);

    message.edit({
        "content": `Here are the first five results for '**${embed['title'].slice(6)}**':`,
        "tts": false,
        "embeds": embeds,
    });
}

async function scrape_buy(search_link) {
    const browser = await puppeteer.launch({})
    const page = await browser.newPage()

    try {
        await page.goto(search_link)
    } catch (error) {
        console.log("error :: ", error.message)
        return undefined
    }
    
    var element = await page.waitForSelector('.offers-table.x-offers').catch((error) => { 
        console.log('error :: ', error.message)   
        return undefined; 
    })  

    var json_data = await page.evaluate((el) => {
        var data = [];
        
        for (c_row of el.children) {
            var child_data = {};

            for (c_div of c_row.children) {
                if (c_div.className === 'offers-table-row-cell offers-table-row-cell-first') {  // MARKET
                    for (c of c_div.children){
                        if (c.className === 'x-offer-merchant-title offers-merchant text-truncate') {
                            child_data['market'] = c.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                        }
                    }
                }
                else if (c_div.className === 'x-offer-region offers-table-row-cell text-center x-popover d-none d-md-table-cell') {     // REGION
                    // Contains a sprite and text, so it should be ok
                    child_data['region'] = c_div.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                }
                else if (c_div.className === 'x-offer-edition offers-table-row-cell text-center d-none d-md-table-cell') {  // EDITION
                    child_data['edition'] = c_div.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                }
                else if (c_div.className === 'offers-table-row-cell text-right d-none d-md-table-cell') {   // OG PRICE (note that one could also get the fees)
                    for (c of c_div.children){
                        if (c.className === 'old-price') {
                            child_data['og_price'] = c.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                        }
                    }
                }
                else if (c_div.className === 'offers-table-row-cell text-center') {     // COUPON
                    // Can get the coupon itself and the percentage of discount
                    for (c of c_div.children[0].children[0].children) {
                        if (c.className === 'x-offer-coupon-value coupon-value text-truncate') { // discount percentage
                            child_data['coupon_value'] = c.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                        }
                        else if (c.className === 'x-offer-coupon-code coupon-code text-truncate') { // ciscount code
                            child_data['coupon_code'] = c.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                        }
                    }
                }
                else if (c_div.className === 'offers-table-row-cell buy-btn-cell') {    // PRICE
                    for (c of c_div.children) {
                        if (c.className === 'd-lg-none buy-btn x-offer-buy-btn text-center') {
                            child_data['price'] = c.textContent.trim().replace(/(\r\n|\n|\r)/gm, "");
                            child_data['buy_link'] = c.href
                        }
                    }
                }
            }
            data.push(child_data);
        }
        return data;
    }, element);

    console.log(json_data)

    browser.close();

    return json_data;
}

function generate_embeds_buy(json_data) {
    var embeds = [];

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
                "name": `Coupon ${game['coupon_value']}`,
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
    }
    return embeds;
}