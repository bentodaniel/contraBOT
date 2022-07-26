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
const embedPpagination = async (Discord, message, pages, timeout = 120000) => {
    if (!pages) throw new Error("Pages are not given.");
  
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

    const curPage = await message.edit({
        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
        components: [row],
        fetchReply: true,
    });
  
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
            });
        }
    });
  
    return curPage;
  };
  module.exports = embedPpagination;