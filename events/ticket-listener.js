const {MessageEmbed, MessageButton, MessageActionRow, Permissions} = require("discord.js");
const fs = require('fs');

const embedSelector = (value) => {
    switch (value) {
        case "whitelist":
            return new MessageEmbed()
                .setTitle("Please read before creating a ticket!")
                .setDescription(
                    "Please note that whitelist roles are typically handed out after the partnering project has completed" +
                    " their list and sent it over. If you feel that the list of winners has been sent over and you still" +
                    " have not received the role please continue to create a ticket!"
                )
                .setColor("#fce566")
        case "collab":
            return new MessageEmbed()
                .setTitle("Please read before creating a ticket!")
                .setDescription(
                    "We are so happy you're interested in a collab! Please make sure you have the following" +
                    " information available:" +
                    "\nWhat is your project name?" +
                    "\nWhat are you offering?" +
                    "\nWhat do you need from us?"
                )
                .setColor("#fce566")
        case "apply":
            return new MessageEmbed()
                .setTitle("Please read before creating a ticket!")
                .setDescription(
                    "We're very happy that you're interested in joining the team! Please include the position you're" +
                    " applying for and all relevant experience! Leaving a couple references wouldn't hurt, either 😼"
                )
                .setColor("#fce566")
        default:
            return new MessageEmbed()
                .setTitle("Please read before creating a ticket!")
                .setDescription(
                    "For all other issues, please be as descriptive as possible when opening your ticket!"
                )
                .setColor("#fce566")
    }
}
//TODO: create better way to store variable for type of ticket

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute (interaction, client) {
        switch (interaction.customId) {
            case "ticket-selectmenu":
                return await interaction.reply({
                    embeds: [embedSelector(interaction.values[0])],
                    components: [
                        new MessageActionRow()
                            .addComponents(
                                new MessageButton()
                                    .setCustomId("ticket-create")
                                    .setLabel("Open Ticket")
                                    .setStyle("SUCCESS")
                            )
                    ],
                    ephemeral: true,
                })
            case "ticket-create":
                let ticketCategory = client.guilds.cache.get(interaction.guild.id).channels.cache.some(category => category.name === "Lynx Tickets")
                if (!ticketCategory) await client.guilds.cache.get(interaction.guild.id).channels.create("Lynx" +
                    " Tickets", {
                    type: "GUILD_CATEGORY",
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone,
                            deny: ["VIEW_CHANNEL"]
                        },
                    ]
                })
                let existingChannel = client.guilds.cache.get(interaction.guild.id).channels.cache.find(channel => channel.name === `ticket-${interaction.user.username.toLowerCase()}`);
                if (existingChannel) return interaction.reply({
                    content: `You already have a ticket open here ${existingChannel}`,
                    ephemeral: true
                })

                await client.guilds.cache.get(interaction.guild.id).channels.create(`ticket-${interaction.user.username}`, {
                    type: "text",
                    permissionOverwrites: [
                        {
                            id: interaction.user.id,
                            allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.READ_MESSAGE_HISTORY],
                        }
                    ]
                })
                    .then(async channel => {
                        let lynxTicketChannelId = client.guilds.cache.get(interaction.guild.id).channels.cache.find(category => {
                            if (category.name === "Lynx Tickets") {
                                return category.id
                            }
                        });
                        await channel.setParent(lynxTicketChannelId)
                        await channel.permissionOverwrites.edit(interaction.user.id, {
                            VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true,
                        })
                        await interaction.reply({
                            content: `You're ticket has been created here: ${channel}`,
                            ephemeral: true
                        });
                        await channel.send({
                            embeds: [
                                new MessageEmbed()
                                    .setTitle("Welcome to your ticket!")
                                    .setDescription("A team member will be with you shortly, in the meantime please include" +
                                        " any relevant information for the team in your next message.\nIf for any" +
                                        " reason you no longer need help, feel free to click the close button...this" +
                                        " will delete your ticket!\nHave a wonderful day 😸")
                            ],
                            components: [
                                new MessageActionRow()
                                    .addComponents(
                                        new MessageButton()
                                            .setCustomId("ticket-close")
                                            .setLabel("Close")
                                            .setStyle("DANGER")
                                    )
                                    .addComponents(
                                        new MessageButton()
                                            .setCustomId("ticket-close-transcript")
                                            .setLabel("Close with Transcript")
                                            .setStyle("SUCCESS")
                                    )
                            ]
                        })
                    })
                break;
            case "ticket-close":
                await interaction.reply({
                    content: "We are closing the ticket..."
                })
                return setTimeout(() => interaction.channel.delete(), 5000);
            case "ticket-close-transcript":
                await interaction.reply({
                    content: "We are creating a transcript, we will provide you with a ticket number shortly"
                })
                //TODO: generate template and save to ./guilds/guildID/ticket-transcripts/ticketID
                if (!fs.existsSync(`./guilds/${interaction.guild.id}/databases/transcripts`)) {
                    fs.mkdirSync(`./guilds/${interaction.guild.id}/databases/transcripts`, { recursive: true })
                }
                let messages = await interaction.channel.messages.fetch()
                let transcript = [];
                messages.forEach(msg => {
                    transcript.push(`${msg.author.username}#${msg.author.discriminator}ID#${msg.author.id}: ${msg.content}`)
                })
                transcript = transcript.reverse();
                let timestamp = Math.round(interaction.message.createdTimestamp / 1000);
                fs.writeFileSync(
                    `./guilds/${interaction.guild.id}/databases/transcripts/${interaction.channel.name}-${timestamp}`,
                    transcript.join('\n'),
                    "utf8")

                let username = interaction.channel.name.replace('ticket-', '');
                await client.guilds.cache.get(interaction.guild.id).members.fetch();
                let user = client.guilds.cache.get(interaction.guild.id).members.cache.find(user => user.user.username.toLowerCase() === username);
                if (user !== undefined) {
                    await interaction.editReply({
                        content: `Thank you for your patience <@${user.user.id}>, **your ticket number is ${timestamp}**!`
                            + `\nThis ticket will be deleted in 1 hour, so please save your ticket number in case you need to reference this ticket in the future!`
                    })
                } else {
                    await interaction.editReply({
                        content: `Thank you for your patience, **your ticket number is ${timestamp}**!`
                            + `\nThis ticket will be deleted in 1 hour, so please save your ticket number in case you need to reference this ticket in the future!`
                    })
                }

                setTimeout(() => {
                    try {
                        interaction.channel.delete()
                    } catch (err) {
                        console.log(err)
                    }

                }, 3600000)
        }
    }
}