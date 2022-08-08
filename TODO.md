---1. finish updateslist---
---2. improve on addwish. Only allow for 10 entries for each user. Probably best to ask desired price after checking the game? maybe---
--3. implement stop wish--
--4. implement display wishlist--
--5. add a link collumn on wishlist, so when displaying it, linking the game to the page--
6. manage wishlist according to if a user is conneced to a server with this bot or not
7. add more games for updates...
8. add to wishlist button on price/offers embeds using input field for price
--9. add bot patch notes and default channel usability--

10. possibly create a website for the bot






------------------------------------------------

rework addwish.
    - do not require price to be given
    - show modal for price when a game is selected


1 - finish the "add to wishlist" on price
    - get value from modal
    - make the function in "addwish" visible and usable and import into 'price'
        - check the sql, should use count when cheking the ammount of rows for a user


----------------------------------------------------

what if:
    - a user pays premium (10 to 50 wishlist entries)
    - uses all of the entries
    - premium ends
    - ?


-------------------------------------------------

permissions on select menus... 
    - setu, setdef, remu


Something is wrong with the select menu's permissions

addwish - everyone can use select menu - add to wishlist of whoever clicks? or just the author?
help - nope
price - everyone or author of request
 price, add to wishlit - anyone
removedefault - only owner should be able (or admins)
removeupdate - only owner or admins
setdefault - only owner or admins
setupdates - only owner or admins
stopwish - only author
updateslist - nope
wishlist - nope

interaction.reply({content: 'hello', ephemeral: true})