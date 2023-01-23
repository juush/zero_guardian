const {MessageEmbed, MessageActionRow, MessageButton} = require("discord.js");
const {safetyMsg} = require("../helpers/message-helpers");
const JSONdb = require("simple-json-db");
let verificationText;
let emojiVerifyMessage;

let stepOneButtons = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("stepOneVerifyButton")
            .setLabel("I'm still not a bot, I swear!")
            .setStyle("DANGER"),
        new MessageButton()
            .setCustomId("stepOneBotButton")
            .setLabel("Ok, I might be a bot...")
            .setStyle("SUCCESS")
    )

let stepTwoMessage = [
    new MessageEmbed()
        .setTitle(`Select the emoji that matches the image!`)
        .setDescription(`I have 9 lives.`)
        .setThumbnail("https://media.discordapp.net/attachments/997937166174912602/997937174982951032/unknown.png"),
    new MessageEmbed()
        .setTitle(`Select the emoji that matches the image!`)
        .setDescription(`I am your best friend.`)
        .setThumbnail("https://media.discordapp.net/attachments/997937166174912602/997938018080014386/unknown.png?width=384&height=426"),
    new MessageEmbed()
        .setTitle(`Select the emoji that matches the image!`)
        .setDescription(`I like cheese.`)
        .setThumbnail("https://media.discordapp.net/attachments/997937166174912602/997940056448843936/unknown.png"),
    new MessageEmbed()
        .setTitle(`Select the emoji that matches the image!`)
        .setDescription(`I'm feeling hungry.`)
        .setThumbnail("https://media.discordapp.net/attachments/997937166174912602/997940593466552401/unknown.png")
]

let stepTwoButtons = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId("stepTwoVerifyButtonCat")
            .setLabel("😺")
            .setStyle("SECONDARY"),
        new MessageButton()
            .setCustomId("stepTwoVerifyButtonDog")
            .setLabel("🐶")
            .setStyle("SECONDARY"),
        new MessageButton()
            .setCustomId("stepTwoVerifyButtonMouse")
            .setLabel("🐭")
            .setStyle("SECONDARY"),
        new MessageButton()
            .setCustomId("stepTwoVerifyButtonHotDog")
            .setLabel("🌭")
            .setStyle("SECONDARY")
    )

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute (interaction) {
        if (interaction.customId === "stepOneBotButton") {
            await interaction.update({
                content: "Hmmmm....y u do dis 😾",
                embeds: [],
                components: [],
                ephemeral: true,
            })
        }
        if (!interaction.customId?.includes('Verify')) return;
        let serverDetails = new JSONdb(`./guilds/${interaction.guild.id}/serverDetails.json`)
        switch (interaction.customId) {
            case "basicVerifyButton":
                await interaction.reply({
                    embeds: [safetyMsg(interaction.guild.name)],
                    components: [stepOneButtons],
                    ephemeral: true,
                })
                break;
            case "stepOneVerifyButton":
                emojiVerifyMessage = stepTwoMessage[Math.floor(Math.random() * stepTwoMessage.length)]
                verificationText = emojiVerifyMessage.description;
                await interaction.update({
                    embeds: [emojiVerifyMessage],
                    components: [stepTwoButtons],
                    ephemeral: true,
                }).catch(console.error)
                break;
            case "stepTwoVerifyButtonCat":
                if (verificationText === "I have 9 lives.") {
                    await interaction.update( {
                        content: "You're verified!",
                        embeds: [],
                        components: [],
                        ephemeral: true
                    })
                    //apply role
                    interaction.member.roles.add(serverDetails.storage.basicVerifiedRole)
                    // interaction.guild.roles.cache.find(role => role.id === "994049257462038529") ? interaction.member.roles.add("994049257462038529") : null;
                } else await interaction.update( {
                    content: "Unable to verify, please try again!",
                    embeds: [],
                    components: [],
                    ephemeral: true
                })
                break;
            case "stepTwoVerifyButtonDog":
                if (verificationText === "I am your best friend.") {
                    await interaction.update( {
                        content: "You're verified!",
                        embeds: [],
                        components: [],
                        ephemeral: true
                    })
                    //apply role
                    interaction.member.roles.add(serverDetails.storage.basicVerifiedRole)
                    // interaction.guild.roles.cache.find(role => role.id === "994049257462038529") ? interaction.member.roles.add("994049257462038529") : null;
                } else await interaction.update( {
                    content: "Unable to verify, please try again!",
                    embeds: [],
                    components: [],
                    ephemeral: true
                })
                break;
            case "stepTwoVerifyButtonMouse":
                if (verificationText === "I like cheese.") {
                    await interaction.update( {
                        content: "You're verified!",
                        embeds: [],
                        components: [],
                        ephemeral: true
                    })
                    //apply role
                    interaction.member.roles.add(serverDetails.storage.basicVerifiedRole)
                    // interaction.guild.roles.cache.find(role => role.id === "994049257462038529") ? interaction.member.roles.add("994049257462038529") : null;
                } else await interaction.update( {
                    content: "Unable to verify, please try again!",
                    embeds: [],
                    components: [],
                    ephemeral: true
                })
                break;
            case "stepTwoVerifyButtonHotDog":
                if (verificationText === "I'm feeling hungry.") {
                    await interaction.update( {
                        content: "You're verified!",
                        embeds: [],
                        components: [],
                        ephemeral: true
                    })
                    //apply role
                    interaction.member.roles.add(serverDetails.storage.basicVerifiedRole)
                    // interaction.guild.roles.cache.find(role => role.id === "994049257462038529") ? interaction.member.roles.add("994049257462038529") : null;
                } else await interaction.update( {
                    content: "Unable to verify, please try again!",
                    embeds: [],
                    components: [],
                    ephemeral: true
                })
                break;
            // case "stepOneBotButton":
            //     await interaction.editReply({
            //         content: "Hmmmm....",
            //         embeds: [],
            //         components: [],
            //         ephemeral: true,
            //     })
            //     break;
            default:
                //TODO: add failed verification message
                //FIXME: message currently not sending, interaction is timing out!
                return await interaction.update({
                    content: "Dismiss all the messages and try again!",
                    embeds: [],
                    components: [],
                    ephemeral: true,
                });
        }
    }
}