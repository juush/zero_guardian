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

const groovyFriendID = "944103035527917598";
// const securityChannel = "999147945410695168";
// const rulesChannel = "944135094220775454";
// const groovyverseChannel = "944455595728203806";
const teamChannel = "999133084920336484";
// const officialLinks = "944127316139855872";
// client.on('ready', () => {
//         client.guilds.cache.get(groovyFriendID).channels.cache.get(teamChannel).send({
//             embeds: [
// new MessageEmbed()
//         .setColor("#A966FF")
//         .setTitle(`About the Groovyverse`)
//         .setDescription(
//             `**Founder** <@700898335602769920>
//             [Twitter](https://twitter.com/tommygm_)
            
//             **Head Artist** <@944802475322531950>
//             [Twitter](https://twitter.com/NazarinaJose)
            
//             **Music Artist** <@716930057280553042>
//             [Twitter](https://twitter.com/zeekpower)
//             **Music Artist** @Kolz
//             [Twitter](https://twitter.com/F8beats)
//             **Music Artist** <@945170507400118273>
//             [Twitter](https://twitter.com/zafraboi)

//             **Marketing** <@894131425291427883>
//             [Twitter](https://twitter.com/JezNFT)

//             **Collaborations** <@269455667968868353>
//             [Twitter](https://twitter.com/VinNFTs_)

//             **Community Manager** <@239659529707454464>
//             [Twitter](https://twitter.com/SiahsNFT)

//             **Discord Overlord** <@98271549726945280>
//             [Twitter](https://twitter.com/juuce0001)

//             **Developer** <@928874629370626170>
//             [Twitter](https://twitter.com/cartojun3)
//             **Developer** <@831896786926043136>
//             [Twitter](https://twitter.com/lucid_eleven)

//             Legal Advisor <@892314183008411679>
//             [Twitter](https://twitter.com/Shaggydogdogdog)`
//         )
        // .addFields(
        //     {
        //         name: "What is Groovy Frens?", 
        //         value:"Groovy Frens is a creative brand founded by <@700898335602769920>"
        //     },
        //     {
        //         name: "What is Groovy Frens NFT?", 
        //         value:"A collection of 10,000 PFP Frens created with the Grooviest Music Traits by <@944802475322531950> <@716930057280553042> <@945170507400118273> @Kolz"
        //     },
        //     {
        //         name: "How is the Art Created?", 
        //         value:"Groovy Frens is a collaborative Art x Music collection created using 250+ visual traits & 400+ audio stems bringing a refreshing digital art experience that begins with our Web 3 Frens. Our music is developed by curating audio \"stems\" & organising them into BPM (Beats-Per-Minute) groupings — allowing for generation of over 60,000 unique audio traits that actually sound good." +
        //         '\n\nAudio Traits for each Groovy Fren are composed of 3 "Stem" components:' +
        //         '\n\n- Melody ( Leads + Chords + Bass )\n- Drums\n- SFX ( Sounds + Vocals )' +
        //         '\n\n**TLDR**( Too Long Didn\'t Read )' +
        //         'We’ve carefully curated a collaborative NFT collection using 250+ visual traits & 400+ interchangeable music components known as "stems" which are organised in various categories of BPM. These incomplete music components are then uniquely generated to create completely fun audio traits pairing with your Groovy Fren PFP!'
        //     },
        //     {
        //         name: "What is the Utility of Groovy Frens?", 
        //         value: "Series 1 begins with Art & Full Commercialized IP Ownership. As a holder, you'll have the creative freedom to monetize both the art & music of your NFT." +
        //         " You can also create and distribute derivatives with no restrictions! Holders are also granted access to an exclusive ecosystem communally exploring additions of perks & benefits for holders as we scale our brand. "
        //     },
        //     {
        //         name: "What's Roadmap?", 
        //         value:"The GroovyVerse is guided by a brand vision in place of a traditional NFT roadmap." +
        //         "The 4 Values of our Brand Vision are: Art, Ownership, Frens & Brand. This ensures our team is best able to deliver a memorable & unique art experience, build a fun & value driven community & create opportunities to evolve the Groovy Frens as a Global brand with our Frens without limitations pre-mint. After Mint, we'll reveal our expanded brand map & release dynamic updates on new holder benefits including major announcements that increase the reach & brand versatility of Groovy Frens worldwide."
        //     },
        //     {
        //         name: "Day 1 Role?", 
        //         value:"A Powerful Role only obtainable within the first 24 hours of our discord opening. This might be something 👀"
        //     },
        //     {
        //         name: "How do I become Groovylisted?",
        //         value: "We’ll be rewarding frens who are fun, kind, creative & engaged from both Twitter & Discord. We’ll also be collaborating with other incredible projects & brand — growing our community of the Grooviest Frens!\nThe Grooviest Frens in our community may receive or be upgraded to the Higher Tier of WL - Legendlist!"
        //     },
        //     {
        //         name: "When does Groovy Frens Mint?",
        //         value: "TBA - Groovy Frens Mint date will be announced on our Official Twitter & Discord"
        //     },
        //     {
        //         name: "Mint Price?",
        //         value: "Mint Price will be revealed closer towards Mint Date. "
        //     },
        //     {
        //         name: "Smart contract Optimised?",
        //         value: "Yes! We’ll be using ERC-721A. "
        //     },
        // )
//             ]
//         })
// })

client.login(token);


// What is Groovy Frens?
// Groovy Frens is a creative brand founded by @tommyGM


// What is Groovy Frens NFT?
// A collection of 10,000 PFP Frens created with the Grooviest Music Traits by @Naz Power @zeekpower @Asch @Kolz


// How is the Art Created?
// Groovy Frens is a collaborative Art x Music collection created using 250+ visual traits & 400+ audio stems bringing a refreshing digital art experience that begins with our Web 3 Frens. Our music is developed by curating audio "stems" & organising them into BPM (Beats-Per-Minute) groupings — allowing for generation of over 60,000 unique audio traits that actually sound good.

// Audio Traits for each Groovy Fren are composed of 3 "Stem" components:

// - Melody ( Leads + Chords + Bass )
// - Drums
// - SFX (Sounds + Vocals )

// TLDR (Too Long Didn't Read)
// We’ve carefully curated a collaborative NFT collection using 250+ visual traits & 400+ interchangeable music components known as "stems" which are organised in various categories of BPM. These incomplete music components are then uniquely generated to create completely fun audio traits pairing with your Groovy Fren PFP!


// What is the Utility of Groovy Frens?
// Series 1 begins with Art & Full Commercialized IP Ownership. As a holder, you’ll have the all the creative freedom to monetize both the art & unique audio track of your NFT. You can also create and distribute derivatives with no restrictions!
// Holders are also granted access to an exclusive ecosystem communally exploring additions of perks & benefits for holders as we scale our brand. 


// What's Roadmap?
// The GroovyVerse is guided by a brand vision in place of a traditional NFT roadmap. 

// The 4 Values of our Brand Vision are: Art, Ownership, Frens & Brand. This ensures our team is best able to deliver a memorable & unique art experience, build a fun & value driven community & create opportunities to evolve the Groovy Frens as a Global brand with our Frens without limitations pre-mint. After Mint, we'll reveal our expanded brand map & release dynamic updates on new holder benefits including major announcements that increase the reach & brand versatility of Groovy Frens worldwide.


// Day 1 Role?
// A Powerful Role only obtainable within the first 24 hours of our discord opening. This might be something 👀


// How do I become Groovylisted?
// We’ll be rewarding frens who are fun, kind, creative & engaged from both Twitter & Discord. We’ll also be collaborating with other incredible projects & brand — growing our community of the Grooviest Frens! 
// The Grooviest Frens in our community may receive or be upgraded to the Higher Tier of WL - Legendlist!


// When does Groovy Frens Mint?
// TBA - Groovy Frens Mint date will be announced on our Official Twitter & Discord


// Mint Price?
// Mint Price will be revealed closer towards Mint Date. 


// Smart contract Optimised?
// Yes! We’ll be using ERC-721A. 

