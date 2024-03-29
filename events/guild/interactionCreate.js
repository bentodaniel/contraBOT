const utils = require('../../utils/utils');
const dbUtils = require('../../database/utils')
const handleComparePrices = require('../../utils/gameHandlers/handleComparePrices')
const handleAddToWishlist = require('../../utils/gameHandlers/handleAddToWishlist')
const handleSetUpGameNews = require('../../utils/newsUpdatesHandlers/handleSetUpGameNews')
const handleRemoveGameNews = require('../../utils/newsUpdatesHandlers/handleRemoveGameNews')
const handleSetDefaultChannel = require('../../utils/defaultChannelHandlers/handleSetDefaultChannel')
const handleRemoveDefaultChannel = require('../../utils/defaultChannelHandlers/handleRemoveDefaultChannel')
const handleRemoveFromWishlist = require('../../utils/gameHandlers/handleRemoveFromWishlist')

module.exports = (Discord, client, db, interaction) => {
    if (interaction.isCommand()) {
        handleApplicationCommands(interaction)
        return
    }

    const idTags = interaction.customId.split('-')
    const interactionID = idTags[0]
    switch (interactionID) {
        case 'contactbtn':
            // The button on 'help' command to contact devs
            handleContactButton(Discord, interaction)
            break

        case 'contactModal':
            // The modal with the form to contact the developers
            const spamCheck = idTags[1]
            handleSubmitContactModal(interaction, spamCheck)
            break

        case 'setdefaultbtn':
            // Button to set the default channel of a guild
            handleSetDefaultChannelButton(client, Discord, db, interaction)
            break

        case 'removedefaultbtn':
            // Button to remove the default channel of a guild
            handleRemoveDefaultChannelButton(Discord, db, interaction)
            break

        case 'setupgamenewsbtn':
            // Button to set up a game for notifications on news/updates
            handleSetUpGameNewsButton(client, Discord, db, interaction)
            break

        case 'removegamenewsbtn':
            // Button to remove a game from the set up notifications on game news/updates
            handleRemoveGameNewsButton(db, interaction)
            break

        case 'pricebtn':
            // Button used on 'search' command to compare prices
            handlePriceButton(Discord, interaction)
            break
        
        case 'wishlistbtn':
            // Button used on 'search' and 'compare prices' to add a game to wishlist
            handleAddToWishlistButton(Discord, interaction)
            break

        case 'priceModal':
            // The modal where a user inserts a target price to add something to wishlist
            handleSubmitPriceModal(db, interaction)
            break

        case 'removefromwishlistbtn':
            const targetUserID = idTags[1]
            handleRemoveFromWishlistButton(Discord, db, interaction, targetUserID)
            break

        default:
            break;
    }
}

async function handleApplicationCommands(interaction) {
    const { commandName, options } = interaction

    if (commandName === 'status') {
        interaction.reply({
            content: 'I\'m alive \\o/',
            ephemeral: true
        })
        .catch(error => {
            console.log('Could not reply to status command')
        })
    }
}

/***********************************************
 * CONTACT FUNCTIONS
 ***********************************************/

/**
 * Handle click on 'contact' button 
 * @param {*} Discord The Discord instance
 * @param {*} interaction The interaction that started this execution
 */
 async function handleContactButton(Discord, interaction) {
    const spamCheckLength = 7
    const spamCheck = generateSpamCheck(spamCheckLength)
    
    const modal = new Discord.ModalBuilder()
        .setCustomId(`contactModal-${spamCheck}`)
        .setTitle('Contact Us!')
        .addComponents([
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('contactEmailInput')
                    .setLabel(`Email (if you wish to be contacted back)`)
                    .setStyle('Short')
                    .setMinLength(0)
                    .setMaxLength(100)
                    .setPlaceholder(`myEmail@mail.com`)
                    .setRequired(false),
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('contactSubjectInput')
                    .setLabel(`Subject`)
                    .setStyle('Short')
                    .setMinLength(10)
                    .setMaxLength(500)
                    .setPlaceholder(`Reason for contact`)
                    .setRequired(true),
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('contactContentInput')
                    .setLabel(`Content`)
                    .setStyle('Paragraph')
                    .setMinLength(20)
                    .setMaxLength(4000)
                    .setPlaceholder(`I am contacting you because...`)
                    .setRequired(true),
            ),
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('contactCheckInput')
                    .setLabel(`Are you a human? [ ${spamCheck} ]`)
                    .setStyle('Short')
                    .setMinLength(spamCheckLength)
                    .setMaxLength(spamCheckLength)
                    .setPlaceholder(`${spamCheck}`)
                    .setRequired(true),
            ),
        ]);

    await interaction.showModal(modal).catch(err => {
        console.log(`ERROR :: Failed to show contact form modal on 'interactionCreate.handleContactButton' :: `, err)
    });
}

/**
 * Generates a string containing random numbers and characters
 * @param {*} length The length of the target string
 * @returns 
 */
function generateSpamCheck(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?&%$#@';
    var result = '';
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Handles sending the contact email
 * @param {*} interaction The interaction that started this execution
 * @param {*} spamCheckTarget The target spam check string. No email is sent if the input check does not match the target
 * @returns 
 */
function handleSubmitContactModal(interaction, spamCheckTarget) {
    const email = interaction.fields.getTextInputValue('contactEmailInput')
    const subject = interaction.fields.getTextInputValue('contactSubjectInput')
    const content = interaction.fields.getTextInputValue('contactContentInput')
    const check = interaction.fields.getTextInputValue('contactCheckInput')

    if (check !== spamCheckTarget) {
        interaction.reply({ content: `Failed spam check.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'spam check failed' reply on 'interactionCreate.handleSubmitContactModal' :: `, error)
        })
        return
    }

    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: subject,
        text: `${content}\n\n${email}`
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log('Failed to send email:\n ', error);
            interaction.reply({ content: `Failed to send email to developers.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'failed to send email' reply on 'interactionCreate.handleSubmitContactModal' :: `, error)
            })
        } else {
            console.log('Email sent: ' + info.response);
            interaction.reply({ content: `Your email has been sent to the developers.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'email sent' reply on 'interactionCreate.handleSubmitContactModal' :: `, error)
            })
        }
    })
}

/***********************************************
 * DEFAULT CHANNEL FUNCTIONS
 ***********************************************/

/**
 * Handles the click on 'set default channel' button
 * @param {*} client The BOT's client
 * @param {*} Discord The discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @returns 
 */
function handleSetDefaultChannelButton(client, Discord, db, interaction) {
    if (!interaction.memberPermissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
        interaction.reply({ content: `This button is for the administrators' use only.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'button for admins' reply on 'interactionCreate.handleSetDefaultChannelButton' :: `, error)
        })
        return
    }

    interaction.deferUpdate()

    handleSetDefaultChannel(client, Discord, db, interaction)
}

/**
 * Handles the click on 'remove default channel' button
 * @param {*} Discord The discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @returns 
 */
function handleRemoveDefaultChannelButton(Discord, db, interaction) {
    if (!interaction.memberPermissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
        interaction.reply({ content: `This button is for the administrators' use only.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'button for admins' reply on 'interactionCreate.handleRemoveDefaultChannelButton' :: `, error)
        })
        return
    }

    dbUtils.get_guild_default_channel(db, interaction.guildId).then(json_data => {
        if (json_data.length === 0) {
            interaction.reply({ content: `No channel is set up as default.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'no default channel' reply on 'interactionCreate.handleRemoveDefaultChannelButton' :: `, error)
            })
        }
        else {
            interaction.deferUpdate()

            handleRemoveDefaultChannel(Discord, db, interaction, json_data[0]['defaultChannelID'])
        }
    })
    .catch(fetch_guild_default_error => {
        console.log(`ERROR :: Failed to get guild's default channel on 'interactionCreate.handleRemoveDefaultChannelButton' :: `, fetch_guild_default_error)

        interaction.reply({ content: `Failed to get default channel data. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'failed to get default channel data' reply on 'interactionCreate.handleRemoveDefaultChannelButton' :: `, error)
        })
    })
}

/***********************************************
 * GAME NEWS/UPDATES NOTIFICATIONS FUNCTIONS
 ***********************************************/

/**
 * Handles the click on 'Set Up Game News'
 * @param {*} client The bot's client
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @returns 
 */
function handleSetUpGameNewsButton(client, Discord, db, interaction) {
    if (!interaction.memberPermissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
        interaction.reply({ content: `This button is for the administrators' use only.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'button for admins' reply on 'interactionCreate.handleSetUpGameNewsButton' :: `, error)
        })
        return
    }

    interaction.deferUpdate()

    handleSetUpGameNews(client, Discord, db, interaction)
}

/**
 * Handles the click on 'Remove Game News'
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this execution
 * @returns 
 */
function handleRemoveGameNewsButton(db, interaction) {
    if (!interaction.memberPermissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
        interaction.reply({ content: `This button is for the administrators' use only.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'button for admins' reply on 'interactionCreate.handleRemoveGameNewsButton' :: `, error)
        })
        return
    }
    
    dbUtils.get_guild_news_updates(db, interaction.message.guild.id).then(json_data => {
        if (json_data.length === 0) {
            interaction.reply({ content: `There are no set up game news notifications.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'no set up notifications' reply on 'interactionCreate.handleRemoveGameNewsButton' :: `, error)
            })
        }
        else {
            interaction.deferUpdate()

            handleRemoveGameNews(db, interaction, json_data)
        }
    })
    .catch(fetch_guild_updates_error => {
        console.log(`ERROR :: Failed to get guild's set up updates on 'interactionCreate.handleRemoveDefaultChannelButton' :: `, fetch_guild_updates_error)

        interaction.reply({ content: `Failed to get games set up for notifications. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'failed to get set up games' reply on 'interactionCreate.handleRemoveGameNewsButton' :: `, error)
        })
    })
}

/***********************************************
 * GAME FUNCTIONS
 ***********************************************/

/**
 * Handle action of clicking 'Compare Prices' button
 * @param {*} interaction The Interaction that originated this execution
 */
function handlePriceButton(Discord, interaction) {
    const game_json = getSearchGameJSON(interaction)
    if (game_json === undefined) {
        interaction.reply({ content: `There was an unexpected error. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'unexpected error' reply on 'interactionCreate.handlePriceButton' :: `, error)
        })
        return
    }

    handleComparePrices.handleComparePrices(Discord, interaction, game_json, 120000)
}

/**
 * Handle action of clicking 'Add to Wishlist' button
 * @param {*} Discord The Discord instance
 * @param {*} interaction The Interaction that originated this execution
 */
async function handleAddToWishlistButton(Discord, interaction) {
    const game_json = getSearchGameJSON(interaction)
    if (game_json === undefined) {
        interaction.reply({ content: `There was an unexpected error. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'unexpected error' reply on 'interactionCreate.handleAddToWishlistButton' :: `, error)
        })
        return
    }

    // Parse title. Max length og label is 45 char
    let title = game_json['title']
    if (title.length > 45) {
        title = title.substring(0, 42)
        title += '...'
    }

    const currentPrice = parseFloat(game_json['price'])
    const defaultPrice = (currentPrice - 0.01).toFixed(2); // round to 2 decimal places

    const modal = new Discord.ModalBuilder()
        .setCustomId('priceModal')
        .setTitle(title)
        .addComponents([
            new Discord.ActionRowBuilder().addComponents(
                new Discord.TextInputBuilder()
                    .setCustomId('priceInput')
                    .setLabel(`Price target (€)`)
                    .setStyle('Short')
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setPlaceholder(`${defaultPrice}`)
                    .setValue(`${defaultPrice}`)
                    .setRequired(true),
            ),
        ]);

    await interaction.showModal(modal).catch(err => {
        console.log(`ERROR :: Failed to show price modal on 'interactionCreate.handleAddToWishlistButton' :: `, err)
    });
}

/**
 * Handle action of clicking 'Submit' button on 'Add to Wishlist' modal
 * @param {*} interaction The Interaction that originated this execution
 */
function handleSubmitPriceModal(db, interaction) {
    const game_json = getSearchGameJSON(interaction)
    if (game_json === undefined) {
        interaction.reply({ content: `There was an unexpected error. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'unexpected error' reply on 'interactionCreate.handleSubmitPriceModal' :: `, error)
        })
        return
    }
    
    const value = interaction.fields.getTextInputValue('priceInput')
    const price = parseFloat(value)

    if (isNaN(price)) {
        interaction.reply({ content: `'${value}' is not a valid price target. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'not valid price' reply on 'interactionCreate.handleSubmitPriceModal' :: `, error)
        })
    }
    else {
        handleAddToWishlist(db, interaction, game_json, price)
    }
    //interaction.deferUpdate()
}

/**
 * Get the game JSON by parsing the embed
 * @param {*} interaction The interaction
 * @returns A game JSON { link, image_link, title, infos, productID, price } or undefined
 */
function getSearchGameJSON(interaction) {
    const message = interaction.message
    const embed = message.embeds[0]

    return utils.embedToJson(embed)
}

/**
 * Handle the execution of clicking 'remove from wishlist' button
 * @param {*} Discord The Discord instance
 * @param {*} db The DB instance
 * @param {*} interaction The interaction that started this event
 * @param {*} targetUserID The user allowed to use this button
 * @returns 
 */
function handleRemoveFromWishlistButton(Discord, db, interaction, targetUserID) {
    if (interaction.user.id !== targetUserID) {
        interaction.reply({ content: `This button is not for you.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'button not for you' reply on 'interactionCreate.handleRemoveFromWishlistButton' :: `, error)
        })
        return
    }

    dbUtils.get_user_wishlist(db, targetUserID).then(json_data => {
        if (json_data.length === 0) {
            interaction.reply({ content: `Your wishlist is empty.`, ephemeral: true }).catch(error => {
                console.log(`ERROR :: Failed to send 'empty wishlist' reply on 'interactionCreate.handleRemoveFromWishlistButton' :: `, error)
            })
        }
        else {
            interaction.deferUpdate()

            handleRemoveFromWishlist(db, interaction, json_data)
        }
    })
    .catch(fetch_user_wishlist_error => {
        console.log(`ERROR :: Failed to get wishlist on 'interactionCreate.handleRemoveFromWishlistButton' :: `, fetch_user_wishlist_error)

        interaction.reply({ content: `Failed to get wishlist data. Please try again.`, ephemeral: true }).catch(error => {
            console.log(`ERROR :: Failed to send 'failed to get wishlist' reply on 'interactionCreate.handleRemoveFromWishlistButton' :: `, error)
        })
    })
}
