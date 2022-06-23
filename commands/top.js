

module.exports = {
    name: 'top',
    description: 'Checks the top deals at CheapShark',
    execute(client, message, args, Discord) {
        //args = args.split(/\s*\|\s*/);
        message.channel.send("Searching for results...").then(msg => {
            //search_and_scrape(msg, arg)
        });
    }
}

// https://www.cheapshark.com/