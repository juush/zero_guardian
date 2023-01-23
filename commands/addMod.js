const {SlashCommandBuilder} = require("@discordjs/builders");
const JSONdb = require('simple-json-db');
const {MessageEmbed} = require("discord.js");
const {validUser} = require('../helpers/helperFunctions')

module.exports = {
    name: "interactionCreate",
    data: new SlashCommandBuilder()
        .setName('gaccess')
        .setDescription('Adds role to access list')
        .addSubcommand(command =>
            command
                .setName("add")
                .setDescription("@ role you would like to add")
                .addStringOption(option =>
                    option
                        .setName("role")
                        .setDescription("@ mention the role")
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName("remove")
                .setDescription("@ mention the role")
                .addStringOption(option =>
                    option
                        .setName("role")
                        .setDescription("@ mention the role")
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName("list")
                .setDescription("Gives you a list of roles with access privileges")
        ),
    async execute (interaction) {
        if (!interaction.isCommand() || interaction.commandName !== "gaccess") return;
        if (!validUser(interaction)) return await interaction.reply({
            content: "You aren't allowed to do this!!! 😾"
        })
        try {
            let serverDB = new JSONdb(`./guilds/${interaction.guild.id}/serverDetails.json`);
            let serverModRoles = serverDB.get("guildMod");

            const validOwner = require(`../guilds/${interaction.guild.id}/serverDetails.json`).guildOwnerID;
            const guildRoles = interaction.member._roles;
            const validMod = serverModRoles.some(e => guildRoles.find(role => role === e) === e);

            if (interaction.commandName === "gaccess" && interaction.options._subcommand === 'add' && (validMod || interaction.user.id === validOwner)) {
                let newRole = interaction.options._hoistedOptions[0].value.replace(/[<@&>]/gi, "")

                if (serverModRoles.some(role => role === newRole)) return await interaction.reply({
                    content: "This role is already on the access list, to remove it please use `/access remove`",
                    ephemeral: true,
                })

                await interaction.reply({
                    content: `Successfully added <@&${newRole}> to the access list`,
                    ephemeral: true,
                })
                serverDB.set("guildMod", [...serverModRoles, newRole])
            } else if (interaction.commandName === "gaccess" && interaction.options._subcommand === 'remove' && (validMod || interaction.user.id === validOwner)) {
                let newRole = interaction.options._hoistedOptions[0].value.replace(/[<@&>]/gi, "")
                let newModList = serverModRoles.filter(role => role !== newRole)
                serverDB.set("guildMod", newModList)
                await interaction.reply({
                    content: `Successfully removed <@&${newRole}> to the access list`,
                    ephemeral: true,
                })
            } else if (interaction.commandName === "gaccess" && interaction.options._subcommand === 'list' && (validMod || interaction.user.id === validOwner)) {
                let modList = serverModRoles.map(role => `<@&${role}>`)
                await interaction.reply({
                    embeds: [new MessageEmbed()
                        .setTitle("List of Roles with Access")
                        .setDescription(modList.toString())
                    ],
                    ephemeral: true,
                })
            }
        } catch (err) {
            console.log(err)
        }
    }
}