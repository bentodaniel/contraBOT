

module.exports = {
    name: 'top',
    short_name: 't',
    description: 'Checks the top deals at CheapShark',
    arguments: '',
    showOnHelp: false,
    execute(client, message, args, Discord, db) {
        //args = args.split(/\s*\|\s*/);
        message.channel.send("Searching for results...").then(msg => {
            //search_and_scrape(msg, arg)
        });
    }
}

// https://www.cheapshark.com/