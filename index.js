//TODO:
// create giveaway features that can read roles and wallet database, if wallet isn't in database let them reactor know
// create more in depth WL system, standardize format of database
// create shop for discord economy
require('dotenv').config()
const token = process.env.DISCORD_KEY;
const botId = process.env.BOT_ID;
const {Client, Intents, MessageEmbed, MessageAttachment, Formatters} = require('discord.js');
const fs = require("fs");
const JSONdb = require('simple-json-db');
const luxon = require('luxon');
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        32767,
    ],
});
require('dotenv').config()

const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v10');
const rest = new REST({version: '10'}).setToken(token);

const discordModals = require("discord-modals");
const {Modal, TextInputComponent, showModal} = require("discord-modals");
const {helpMsg, safetyMsg} = require("./helpers/message-helpers");
discordModals(client);


const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
    const event = require(`./commands/${file}`);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.on("ready", () => {
    const guildDB = new JSONdb('./globalDatabases/guildsJoined.json');
    let Guilds = [];
    Guilds = client.guilds.cache.map(guild => guild);
    guildDB.set('Guilds', []);
    (async () => {
        try {
            await rest.put(
                Routes.applicationCommands(botId),
                {body: commands},
            );
            console.log('Reloading slash commands...');
            for (let i = 0; i < Guilds.length; i++) {
                let db = guildDB.get('Guilds')
                guildDB.set('Guilds', [
                    ...db, {
                        guildName: Guilds[i].name,
                        guildID: Guilds[i].id,
                        guildOwnerID: Guilds[i].ownerId
                    }
                ])
                // await rest.get(Routes.applicationGuildCommands(botId, Guilds[i].id))
                //     .then(data => {
                //         const promises = [];
                //         for (const command of data) {
                //             const deleteUrl = `${Routes.applicationGuildCommands(botId, Guilds[i].id)}/${command.id}`;
                //             promises.push(rest.delete(deleteUrl));
                //         }
                //         console.log("Deleted old commands")
                //         return Promise.all(promises);
                //     });
                if (!fs.existsSync(`./guilds/${Guilds[i].id}`)) {
                    fs.mkdirSync(`./guilds/${Guilds[i].id}`)
                    fs.mkdirSync(`./guilds/${Guilds[i].id}/databases`)
                    //creates serverDetails file
                    fs.openSync(`./guilds/${Guilds[i].id}/serverDetails.json`, `w`);
                    fs.writeFileSync(`./guilds/${Guilds[i].id}/serverDetails.json`, JSON.stringify({
                        guildName: Guilds[i].name,
                        guildID: Guilds[i].id,
                        guildOwnerID: Guilds[i].ownerId,
                        guildMod: [],
                        invitesActive: false,
                    }, null, 2))
                }
            }
        } catch (error) {
            console.error(error);
        }
        console.log("Successfully registered slash commands")

        client.on('interactionCreate', (i) => {
            switch (i.customId) {
                case "verifyButton":
                    const modal = new Modal()
                        .setCustomId("verificationMessage")
                        .setTitle("Please enter the access code below")
                        .addComponents(
                            new TextInputComponent()
                                .setCustomId("verificationResponse")
                                .setLabel("Please Enter Your Code")
                                .setStyle("SHORT")
                                .setMinLength(1)
                                .setMaxLength(50)
                                .setPlaceholder("What is the secret code 👀")
                                .setRequired(true)
                        )
                    showModal(modal, {
                        client: client,
                        interaction: i,
                    })
                    break;
                case "help":
                    i.reply({
                        embeds: [
                            helpMsg()
                        ],
                        ephemeral: true
                    })
                    break;
                case "disableDM":
                    i.reply({
                        embeds: [
                            safetyMsg(i.guild.name)
                        ],
                        ephemeral: true,
                    })
                    break;
            }
        })

        client.on('modalSubmit', async modal => {
            try {
                const code = modal.fields[0].value;
                let serverDetails = new JSONdb(`./guilds/${modal.guild.id}/serverDetails.json`)

                if (code === serverDetails.storage.passcode) {
                    await modal.deferReply({
                        content: "One moment..",
                        ephemeral: true
                        })
                    await modal.member.roles.add(serverDetails.storage.verifiedRole)
                    await modal.followUp({
                        embeds: [
                            new MessageEmbed()
                                .setTitle("SUCCESS")
                                .setDescription("You've been verified, welcome!")
                                .setColor("#00FF00")
                        ],
                    })
                } else if (code !== serverDetails.storage.passcode) {
                    await modal.deferReply({ephemeral: true})
                    await modal.followUp({
                        embeds: [
                            new MessageEmbed()
                                .setTitle("ERROR")
                                .setDescription("You either entered an incorrect code or there was some sort of error, please try again later!")
                                .setColor("#FF0000")
                        ],
                        ephemeral: true,
                    })
                }
            } catch (err) {
                await modal.followUp({
                    embeds: [
                        new MessageEmbed()
                            .setTitle("ERROR")
                            .setDescription("You either entered an incorrect code or there was some sort of error, please try again later!")
                            .setColor("#FF0000")
                    ],
                    ephemeral: true,
                })
                console.log(err)
            }
        })

    })();
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildCreate', async (guild) => {

    await rest.put(
        Routes.applicationGuildCommands(botId, guild.id),
        {body: commands},
    );

    if (!fs.existsSync(`./guilds/${guild.id}`)) {
        fs.mkdirSync(`./guilds/${guild.id}`)
        fs.mkdirSync(`./guilds/${guild.id}/databases`)
        //creates serverDetails file
        fs.openSync(`./guilds/${guild.id}/serverDetails.json`, `w`);
        fs.writeFileSync(`./guilds/${guild.id}/serverDetails.json`, JSON.stringify({
            guildName: guild.name,
            guildID: guild.id,
            guildOwnerID: guild.ownerId,
            guildMod: [],
            invitesActive: false,

        }, null, 2))
    }

});

client.login(token);