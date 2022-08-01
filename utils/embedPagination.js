/**
 * Code from  ryzyx / discordjs-button-pagination
 * https://github.com/ryzyx/discordjs-button-pagination
 * npm i discordjs-button-pagination
 */

/**
 * Creates a pagination embed~
 * @param {Discord} Discord
 * @param {Interaction} interaction
 * @param {MessageEmbed[]} pages
 * @param {MessageButton[]} buttonList
 * @param {number} timeout
 * @returns
 */
const embedPpagination = async (Discord, message, pages, timeout = 120000, content_text=' ') => {
    return new Promise((success, failure) => {
        let page = 0;

        buttonList = [
            new Discord.MessageButton()
                .setCustomId('firstbtn')
                .setLabel('First')
                .setStyle('SECONDARY'),
            new Discord.MessageButton()
                .setCustomId('previousbtn')
                .setLabel('Previous')
                .setStyle('SECONDARY'),
            new Discord.MessageButton()
                .setCustomId('nextbtn')
                .setLabel('Next')
                .setStyle('SECONDARY'),
            new Discord.MessageButton()
                .setCustomId('lastbtn')
                .setLabel('Last')
                .setStyle('SECONDARY')
        ]
    
        const row = new Discord.MessageActionRow().addComponents(buttonList);
    
        //has the interaction already been deferred? If not, defer the reply.
        //if (interaction.deferred == false) {
        //    await interaction.deferReply();
        //}
    
        //const curPage = await interaction.editReply({
        //    embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
        //    components: [row],
        //    fetchReply: true,
        //});

        // Paginate the message
        message.edit({
            content: content_text,
            embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
            components: [row],
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
                    components: [row],
                })
                .catch(msg_error => {
                    console.log(`ERROR :: could not edit paginated message after collect\n `, msg_error) // No info of channel or guild because it could also be in dm
                });
                collector.resetTimer();
            });
        
            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    const disabledRow = new Discord.MessageActionRow().addComponents(
                        buttonList[0].setDisabled(true),
                        buttonList[1].setDisabled(true),
                        buttonList[2].setDisabled(true),
                        buttonList[3].setDisabled(true)
                    );
                    curPage.edit({
                        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
                        components: [disabledRow],
                    })
                    .catch(msg_error => {
                        console.log(`ERROR :: could not edit paginated message end\n `, msg_error) // No info of channel or guild because it could also be in dm
                    });
                }
            });

            success(curPage)
        })
        .catch(msg_error => {
            console.log(`ERROR :: could not send paginated message\n `, msg_error) // No info of channel or guild because it could also be in dm
            failure()
        });
    })
};

module.exports = embedPpagination;
