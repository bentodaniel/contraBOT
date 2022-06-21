const puppeteer = require("puppeteer");

module.exports = {
    name: 'tech',
    description: 'This checks the price of a tech product in zwame',
    execute(client, message, args, Discord) {
        //args = args.split(/\s*\|\s*/);
        message.channel.send("Searching for results...").then(msg => {
            //search_and_scrape(msg, arg)
        });
    }
}

// https://comparador.zwame.pt