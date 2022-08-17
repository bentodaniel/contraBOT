const utils = require('../../utils/utils');
const handleComparePrices = require('../../utils/gameHandlers/handleComparePrices')
const handleAddToWishlist = require('../../utils/gameHandlers/handleAddToWishlist')

module.exports = (Discord, client, db, interaction) => {
    switch (interaction.customId) {
        case 'pricebtn':
            handlePriceButton(Discord, interaction)
            break
        
        case 'wishlistbtn':
            handleAddToWishlistButton(Discord, interaction)
            break

        case 'priceModal':
            handleSubmitPriceModal(db, interaction)
            break

        case 'contactbtn':
            handleContactButton(Discord, interaction)
            break

        case 'contactModal':
            handleSubmitContactModal(interaction)
            break

        default:
            break;
    }
}

/**
 * Handle action of clicking 'Compare Prices' button
 * @param {*} interaction The Interaction that originated this execution
 */
function handlePriceButton(Discord, interaction) {
    const game_json = getSearchGameJSON(interaction)
    if (game_json === undefined) {
        interaction.reply({ content: `There was an unexpected error. Please try again.`, ephemeral: true }).catch(error => {})
        return
    }

    handleComparePrices(Discord, interaction, game_json, 120000)
}

/**
 * Handle action of clicking 'Add to Wishlist' button
 * @param {*} Discord The Discord instance
 * @param {*} interaction The Interaction that originated this execution
 */
async function handleAddToWishlistButton(Discord, interaction) {
    const game_json = getSearchGameJSON(interaction)
    if (game_json === undefined) {
        interaction.reply({ content: `There was an unexpected error. Please try again.`, ephemeral: true }).catch(error => {})
        return
    }

    // Parse title. Max length og label is 45 char
    let title = game_json['title']
    if (title.length > 45) {
        title = title.substring(0, 42)
        title += '...'
    }

    const modal = new Discord.Modal()
        .setCustomId('priceModal')
        .setTitle(title)
        .addComponents([
            new Discord.MessageActionRow().addComponents(
                new Discord.TextInputComponent()
                    .setCustomId('priceInput')
                    .setLabel(`Price target (€)`)
                    .setStyle('SHORT')
                    .setMinLength(1)
                    .setMaxLength(10)
                    .setPlaceholder(`${game_json['price']}`)
                    .setValue(`${game_json['price']}`)
                    .setRequired(true),
            ),
        ]);

    await interaction.showModal(modal);
}

/**
 * Handle action of clicking 'Submit' button on 'Add to Wishlist' modal
 * @param {*} interaction The Interaction that originated this execution
 */
function handleSubmitPriceModal(db, interaction) {
    const game_json = getSearchGameJSON(interaction)
    if (game_json === undefined) {
        interaction.reply({ content: `There was an unexpected error. Please try again.`, ephemeral: true }).catch(error => {})
        return
    }
    
    const value = interaction.fields.getTextInputValue('priceInput')
    const price = parseFloat(value)

    if (isNaN(price)) {
        interaction.reply({ content: `'${value}' is not a valid price target. Please try again.`, ephemeral: true }).catch(error => {})
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
 * Handle click on 'contact' button 
 * @param {*} Discord 
 * @param {*} interaction 
 */
async function handleContactButton(Discord, interaction) {
    const modal = new Discord.Modal()
        .setCustomId('contactModal')
        .setTitle('Contact Us!')
        .addComponents([
            new Discord.MessageActionRow().addComponents(
                new Discord.TextInputComponent()
                    .setCustomId('contactEmailInput')
                    .setLabel(`Email`)
                    .setStyle('SHORT')
                    .setMinLength(5)
                    .setMaxLength(100)
                    .setPlaceholder(`myEmail@mail.com`)
                    .setRequired(true),
            ),
            new Discord.MessageActionRow().addComponents(
                new Discord.TextInputComponent()
                    .setCustomId('contactSubjectInput')
                    .setLabel(`Subject`)
                    .setStyle('SHORT')
                    .setMinLength(10)
                    .setMaxLength(500)
                    .setPlaceholder(`Reason for contact`)
                    .setRequired(true),
            ),
            new Discord.MessageActionRow().addComponents(
                new Discord.TextInputComponent()
                    .setCustomId('contactContentInput')
                    .setLabel(`Content`)
                    .setStyle('PARAGRAPH')
                    .setMinLength(20)
                    .setMaxLength(4000)
                    .setPlaceholder(`I am contacting you because...`)
                    .setRequired(true),
            ),
        ]);

    await interaction.showModal(modal);
}

function handleSubmitContactModal(interaction) {
    const email = interaction.fields.getTextInputValue('contactEmailInput')
    const subject = interaction.fields.getTextInputValue('contactSubjectInput')
    const content = interaction.fields.getTextInputValue('contactContentInput')

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
            console.log(error);
            interaction.reply({ content: `Failed to send email to developers.`, ephemeral: true }).catch(error => {})
        } else {
            console.log('Email sent: ' + info.response);
            interaction.reply({ content: `Your email has been sent to the developers.`, ephemeral: true }).catch(error => {})
        }
    })
}
