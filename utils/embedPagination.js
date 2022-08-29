/**
 * Code from  ryzyx / discordjs-button-pagination
 * https://github.com/ryzyx/discordjs-button-pagination
 * npm i discordjs-button-pagination
 */

/**
 * Creates a pagination embed~
 * @param {Discord} Discord The Discord instance
 * @param {Message} message The message we will be editing
 * @param {MessageEmbed[]} pages The embeds to paginate
 * @param {number} timeout The time for the buttons to keep alive
 * @param {*} content_text The text for the message content
 * @param {*} extraBtns Extra buttons to use. If single button, will be displayed in the same row. If list, will be displayed in a new row
 * @returns
 */
const embedPagination = async (Discord, message, pages, timeout = 120000, content_text=' ', extraBtns) => {
    return new Promise((success, failure) => {
        let page = 0;

        const buttonList = [
            new Discord.MessageButton()
                .setCustomId('firstbtn')
                .setEmoji('<:skip_first_icon:1013929634120880329>')
                .setStyle('SECONDARY'),
            new Discord.MessageButton()
                .setCustomId('previousbtn')
                .setEmoji('<:previous_icon:1013929741390192791>')
                .setStyle('SECONDARY'),
            new Discord.MessageButton()
                .setCustomId('nextbtn')
                .setEmoji('<:next_icon:1013930064087355462>')
                .setStyle('SECONDARY'),
            new Discord.MessageButton()
                .setCustomId('lastbtn')
                .setEmoji('<:skip_last_icon:1013930143854633181>')
                .setStyle('SECONDARY')
        ]
    
        const topRow = new Discord.MessageActionRow().addComponents(buttonList);

        // The navidation buttons are always default
        var rows = [topRow]

        // Add extra buttons if there are any
        if (extraBtns !== undefined) {            
            // If its not an array, then its just one extra button
            if (!Array.isArray(extraBtns)) {
                rows[0].addComponents(extraBtns)
            }
            // If it is an array and has at least one obj, then its a new row
            else if (extraBtns.length > 0) {
                const lowRow = new Discord.MessageActionRow().addComponents(extraBtns);
                rows.push(lowRow)
            }
        }

        // Paginate the message
        message.edit({
            content: content_text,
            embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
            components: rows,
            fetchReply: true,
        })
        .then(async function(curPage) {
            const filter = (i) =>
                i.customId === buttonList[0].customId ||
                i.customId === buttonList[1].customId ||
                i.customId === buttonList[2].customId ||
                i.customId === buttonList[3].customId;
    
            const collector = await curPage.createMessageComponentCollector({
                filter,
                time: timeout,
            });
        
            collector.on("collect", async (i) => {
                switch (i.customId) {
                    case buttonList[0].customId:
                        // first
                        page = 0;
                        break;
                    case buttonList[1].customId:
                        // previous
                        page = page > 0 ? --page : pages.length - 1;
                        break;
                    case buttonList[2].customId:
                        // next
                        page = page + 1 < pages.length ? ++page : 0;
                        break;
                    case buttonList[3].customId:
                        // last
                        page = pages.length - 1;
                        break;
                    default:
                        break;
                } 
                await i.deferUpdate();
                await i.editReply({
                    embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
                    components: rows,
                })
                .catch(msg_error => {
                    console.log(`ERROR :: Failed to edit paginated message after collect :: `, msg_error)
                });
                collector.resetTimer();
            });
        
            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    const disabledTopRow = new Discord.MessageActionRow().addComponents(
                        buttonList[0].setDisabled(true),
                        buttonList[1].setDisabled(true),
                        buttonList[2].setDisabled(true),
                        buttonList[3].setDisabled(true)
                    );

                    var disabledRows = [disabledTopRow]

                    // Disable extra buttons if there are any
                    if (extraBtns !== undefined) {            
                        // If its not an array, then its just one extra button
                        if (!Array.isArray(extraBtns)) {
                            disabledRows[0].addComponents(extraBtns.setDisabled(true))
                        }
                        // If it is an array and has at least one obj, then its a new row
                        else if (extraBtns.length > 0) {
                            const disabledLowRow = new Discord.MessageActionRow().addComponents(
                                extraBtns.map(function(btn) {
                                    return btn.setDisabled(true)
                                })
                            );
                            disabledRows.push(disabledLowRow)
                        }
                    }

                    curPage.edit({
                        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
                        components: disabledRows,
                    })
                    .catch(msg_error => {
                        console.log(`ERROR :: Failed to edit paginated message end :: `, msg_error)
                    });
                }
            });

            success(curPage)
        })
        .catch(msg_error => {
            console.log(`ERROR :: Failed to send paginated message :: `, msg_error)
            failure()
        });
    })
};

module.exports = embedPagination;
