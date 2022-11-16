# discord_price_checker_bot
A Discord bot that checks the price of items on AllKeyShop andallows the user to add a
game to their wishlist. The bot will notify the user once the price drops under a 
specified amount.

This bot can also notify servers of news and patch notes on games.


## Development
To add a game to the list available for news/patch notes, it is as simple as modifying
`gamesConfig.js` IF the patch notes come from Steam. Otherwise, it is also necessary
to change `parseHTML.js` or ``parseXHR.js`. 
The emoji should be created in a "test" server. Bots have nitro permissions and can use emojis from different servers.

If the news/patch notes come from steam, some useful websites may be:
  
  - Steam API - https://steamcommunity.com/dev .
  - SteamDB - https://steamdb.info/ - when searching for a game, under "Information" we can find info on the icon used (note that .ico files can not be used as thumbnails in discordjs).
  - Steam - https://store.steampowered.com/ - search for a game and get its productID.
