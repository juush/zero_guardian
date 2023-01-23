const {SlashCommandBuilder} = require("@discordjs/builders");
const {seconds, validUser} = require('../helpers/helperFunctions')
const {MessageEmbed, MessageButton, MessageActionRow} = require("discord.js");
const JSONdb = require("simple-json-db");
const {ticketButtons} = require("../helpers/components");


module.exports = {
    name: "interactionCreate",
    data: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Allows for creation of a verification channel")
        .addSubcommand(subCommand =>
            subCommand
                .setName("passcode-verification")
                .setDescription("Allows you to set up a verification channel that uses a passcode you set")
                .addChannelOption(option => option
                    .setName("channel")
                    .setDescription("Tag the channel you'd like to use for verification. i.e: #verify-here")
                    .setRequired(true)
                )
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Tag the role you'd like to apply to verified members. i.e @verified")
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName("passcode")
                    .setDescription("Set your own passcode or leave empty to randomly generate new codes for each member")
                    .setRequired(true)
                ),
        )
        .addSubcommand(subCommand =>
            subCommand
                .setName("basic-verification")
                .setDescription("Sets up basic anti-bot verification process")
                .addChannelOption(option => option
                    .setName("channel")
                    .setDescription("Tag the channel you'd like to use for verification. i.e: #verify-here")
                    .setRequired(true)
                )
                .addRoleOption(option => option
                    .setName("role")
                    .setDescription("Tag the role you'd like to apply to verified members. i.e @verified")
                    .setRequired(true)
                )
        )
        .addSubcommand(subCommand =>
            subCommand
                .setName("change-verification-message")
                .setDescription("Allows you to modify the message in the embed")
                .addStringOption(option => option
                    .setName("title")
                    .setDescription("Change title of verification message")
                    .setRequired(true)
                )
                .addStringOption(option => option
                    .setName("body")
                    .setDescription("Change the body of the verification message")
                    .setRequired(true)
                )
                .addChannelOption(option =>
                    option
                        .setName("messagechannel")
                        .setDescription("Tag the channel the verification message is in")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("messageid")
                        .setDescription("Paste the message ID for the verification message you'd like to modify")
                        .setRequired(true)
                )
        )
        .addSubcommand(subCommand =>
            subCommand
                .setName("log-channel")
                .setDescription("This will create a channel for ZER0 to log events")
        )
        .addSubcommand(subCommand =>
            subCommand
                .setName("ticket-channel")
                .setDescription("Select the channel you'd like to use as the default ticket channel")
                .addChannelOption(channel =>
                    channel
                        .setName("channel")
                        .setDescription("Start typing the name of the channel...")
                        .setRequired(true)
                )
        )
        .addSubcommand(subCommand =>
            subCommand
                .setName("time-clock")
                .setDescription("Set up moderator monitoring")
                .addRoleOption(role =>
                    role
                        .setName("select-role")
                        .setDescription("Select role to monitor")
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        if (!interaction.isCommand() || interaction.commandName !== "setup") return;
        if (!validUser(interaction)) return await interaction.reply({
            content: "Only the server owner can modify the verification channel.", eph2emeral: true,
        })
        let serverDetails = new JSONdb(`./guilds/${interaction.guild.id}/serverDetails.json`)
        switch (interaction.commandName === "setup" && validUser(interaction)) {
            case interaction.options._subcommand === "basic-verification":
                let channel = client.guilds.cache.get(interaction.guild.id).channels.cache.get(interaction.options._hoistedOptions[0].value.replace(/[<@&#>]/gi, ""))
                let role = interaction.options._hoistedOptions[1].value.replace(/[<@&#>]/gi, "");
                serverDetails.storage.basicVerifiedRole = role;
                serverDetails.set(serverDetails.storage);
                let verificationButton = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId("basicVerifyButton")
                            .setLabel("I'm not a bot!")
                            .setStyle("SUCCESS")
                    )
                let verificationMessage = new MessageEmbed()
                    .setTitle(`Verification for ${interaction.guild.name}`)
                    .setDescription(`Welcome to ${interaction.guild.name}\n\nLet's get started! Please click the "I'm not a bot!" button below`)
                channel.send({
                    embeds: [verificationMessage],
                    components: [verificationButton],
                    ephemeral: false,
                }).then(console.log).catch(console.error)
                break;

            case interaction.options._subcommand === "passcode-verification":
                try {
                    let channel = client.guilds.cache.get(interaction.guild.id).channels.cache.get(interaction.options._hoistedOptions[0].value.replace(/[<@&#>]/gi, ""))
                    let role = interaction.options._hoistedOptions[1].value.replace(/[<@&#>]/gi, "");
                    serverDetails.storage.passcode = interaction.options._hoistedOptions[2].value;
                    serverDetails.storage.passcodeVerifiedRole = role;
                    serverDetails.set(serverDetails.storage);
                    let verificationButton = new MessageActionRow()
                        .addComponents(
                            new MessageButton()
                                .setCustomId("verifyButton")
                                .setLabel("Verify")
                                .setStyle("SUCCESS")
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId("help")
                                .setLabel("Help!")
                                .setStyle("PRIMARY")
                        )
                        .addComponents(
                            new MessageButton()
                                .setCustomId("disableDM")
                                .setLabel("IMPORTANT!!")
                                .setStyle("DANGER")
                        )

                    let verificationMessage = new MessageEmbed()
                        .setTitle(`Verification for ${interaction.guild.name}`)
                        .setDescription(`Welcome to ${interaction.guild.name}! Let's get verified 😽`)
                    channel.send({
                        embeds: [verificationMessage],
                        components: [verificationButton],
                        ephemeral: false,
                    }).then(console.log).catch(console.error)

                    const filter = (btnInt) => {
                        return interaction.user.id === btnInt.user.id;
                    }
                    const collector = channel.createMessageComponentCollector({
                        filter,
                        max: 1,
                        time: seconds(1)
                    })

                    collector.on('end', async collection => {
                        interaction.reply({
                            embeds: [
                                new MessageEmbed()
                                    .setTitle("SUCCESS")
                                    .setColor("#00FF00")
                                    .setDescription("Verification Message Posted")
                            ]
                        })

                    })
                } catch (err) {
                    interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("ERROR")
                                .setDescription("There was an error setting up the verification channel, please ensure the bot has the correct permissions and you tagged the role and channel properly!")
                        ]
                    })
                }
                break;
            case interaction.options._subcommand === "change-verification-message":
                try {
                    let title = interaction.options._hoistedOptions[0].value;
                    let body = interaction.options._hoistedOptions[1].value;
                    let messageChannel = interaction.options._hoistedOptions[2].value.replace(/[<@#&>]/gi, "")
                    let messageId = interaction.options._hoistedOptions[3].value;
                    let verificationMessage = await client.guilds.cache.get(interaction.guild.id).channels.cache.get(messageChannel).messages.fetch(messageId)
                    await verificationMessage.edit({
                        embeds: [
                            new MessageEmbed()
                                .setTitle(title)
                                .setDescription(body)
                        ]
                    })
                    await interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor("#00FF00")
                                .setTitle("SUCCESS")
                                .setDescription("You've successfully modified the verification message!")
                        ]
                    })
                } catch (err) {
                    console.log(err)
                    await interaction.reply({
                        embeds: [
                            new MessageEmbed()
                                .setColor("#FF0000")
                                .setTitle("ERROR")
                                .setDescription("There was an error modifying the verification message, please make sure you're using the correct format when requested a change")
                        ]
                    })
                }
                break;
            case interaction.options._subcommand === "log-channel":
                // let logChannel = interaction.options._hoistedOptions[0].value
                let logChannel = await interaction.guild.channels.create(
                    "ZERØ-LOGS",
                    {
                        type: "GUILD_TEXT",
                        topic: "This channel is used for ZERØ's logging system",
                        permissionOverwrites: [
                            {
                                id: interaction.guild.roles.everyone,
                                deny: ["VIEW_CHANNEL"]
                            }
                        ]
                    }
                )
                serverDetails.storage.logChannel = logChannel.id
                serverDetails.set(serverDetails.storage);
                await interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("#00FF00")
                            .setTitle("SUCCESS")
                            .setDescription(`You've successfully added ${logChannel} as the log channel for ZERØ`)
                    ]
                });
                break;
            case interaction.options._subcommand === "ticket-channel":
                let ticketChannel = interaction.options._hoistedOptions[0].value;
                serverDetails.storage.ticketChannel = ticketChannel;
                serverDetails.set(serverDetails.storage);
                await interaction.reply({
                    embeds: [
                        new MessageEmbed()
                            .setColor("#00FF00")
                            .setTitle("SUCCESS")
                            .setDescription(`You've successfully added <#${ticketChannel}> as the ticket channel for ZERØ`)
                    ]
                });
                client.guilds.cache.get(interaction.guild.id).channels.cache.get(ticketChannel).send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle("Submit a ticket")
                            .setDescription("Please select what you need help with!")
                    ],
                    components: [ticketButtons]
                }).then(msg => {
                    serverDetails.storage.ticketMessageId = msg.id;
                    serverDetails.set(serverDetails.storage);
                })
                break;
            case interaction.options._subcomand === "time-clock":
                //TODO:
                //  add role to serverDetails.json
                //  create schema for mod logs
                //  add a weight score to each event
                //  add event listener each time a moderator performs a specified event
                //  have score quota, post to log channel after clock out
                break;
        }

    }
}