const puppeteer = require("puppeteer");

module.exports = {
    name: 'gas',
    description: 'This checks the price of gas in maisgasolina',
    execute(client, message, args, Discord) {
        //args = args.split(/\s*\|\s*/);
        message.channel.send("Searching for results...").then(msg => {
            //search_and_scrape(msg, arg)
        });
    }
}


// https://www.maisgasolina.com/pesquisa/santarem/