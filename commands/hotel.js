const puppeteer = require("puppeteer");

module.exports = {
    name: 'hotel',
    description: 'This checks the price of hotels in trivago',
    execute(client, message, args, Discord) {
        //args = args.split(/\s*\|\s*/);
        message.channel.send("Searching for results...").then(msg => {
            //search_and_scrape(msg, arg)
        });
    }
}

// https://www.trivago.pt/