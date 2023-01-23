const {MessageActionRow, MessageButton, MessageSelectMenu} = require("discord.js");

let ticketButtons = new MessageActionRow()
.addComponents(
    new MessageSelectMenu()
        .setCustomId("ticket-selectmenu")
        .setPlaceholder("What do you need help with?")
        .addOptions([
            {
                label: "Whitelist",
                description: "Select if you've won WL",
                value: "whitelist"
            },
            {
                label: "Collab",
                description: "Select if interested in a collab",
                value: "collab"
            },
            {
                label: "Report",
                description: "Select if you wish to report someone",
                value: "report",
            },
            {
                label: "Apply",
                description: "Select if you wish to apply for a position with the project",
                value: "apply",
            },
            {
                label: "Other...",
                description: "If your question/issue isn't listed, please select this option",
                value: "other"
            }
        ]),
)

module.exports = {
    ticketButtons
}