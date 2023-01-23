const {Client, Intents} = require('discord.js');
const JSONdb = require("simple-json-db");
const luxon = require("luxon");
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

const getChannel = (channelID, client) => {
    return client.channels.cache.get(channelID);
};

const seconds = (seconds) => {
    return seconds * 1000;
};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const validUser = (interaction) => {
    const serverDB = new JSONdb(`./guilds/${interaction.guild.id}/serverDetails.json`)
    const ownerId = interaction.guild.ownerId
    const guildModRoles = serverDB.get("guildMod")
    const memberId = interaction.user.id;
    let roleBoolean = interaction.member._roles.some(role => guildModRoles.find(modRole => modRole === role) === role);
    return ownerId === memberId || roleBoolean;

}
const giveawayCheckOnLaunch = async () => {
    let Guilds = client.guilds.cache.map(guild => guild);
    for (let index = 0; index < Guilds.length; index++) {
        let giveawayDB = new JSONdb(`./guilds/${Guilds[index].id}/databases/giveawayDatabase.json`)
        let giveawayList = await giveawayDB.get('Giveaways');
        if (giveawayList === undefined) giveawayDB.set("Giveaways", [])
        let currentTime = luxon.DateTime.now().ts

        for (let i = 0; i < giveawayList.length; i++) {
            let pastTime = luxon.DateTime.fromISO(giveawayList[i].giveawayEndTime);
            if (pastTime < currentTime && giveawayList[i].active) {
                //generate Winner list
                //switch active to FALSE
                let guild = await client.guilds.fetch(Guilds[index].id)
                let channel = await guild.channels.cache.get(giveawayList[i].giveawayChannelId);
                try {
                    await channel.messages.fetch(giveawayList[i].messageId)
                        .then(msg => {
                            let giveawayObj = giveawayList.find(ga => ga.messageId === msg.id);
                            let entriesObj = giveawayObj.entries;
                            let numberOfWinners = giveawayObj.numberOfWinners;
                            let run = true;
                            let winners = [];
                            while (run) {
                                let winnerId = entriesObj[Math.floor(Math.random() * entriesObj.length)];
                                let duplicate = winners.some(e => e.replace(/<|>|!|@|#|/gi, "") === winnerId)

                                if (duplicate) {
                                    console.log('already won')
                                } else {
                                    console.log(`adding ${winnerId}`)
                                    winners.push(`<@${winnerId}>`);

                                }
                                if (winners.length >= numberOfWinners) {
                                    console.log('fin')
                                    run = false;
                                    giveawayObj.winners = winners
                                }
                            }

                            msg.edit({
                                content: `Giveaway for ${giveawayObj.giveawayName} has ended, congrats to the winners!🐱\n${winners.toString}`,
                                embeds: [],
                                components: [],
                            })
                                .then(() => console.log('edited'))
                        })
                    giveawayList[i].active = false;
                } catch (err) {
                    console.log("giveaway check loop failure:\n" + err)
                }

            }
        }
        giveawayDB.set("Giveaways", giveawayList)
    }
}

function codeGenerator(count) {
    let randArr = [];
    const digits = 17;

    for (let i = 0; i < count; i++) {
        randArr.push((Math.ceil(Math.random() * ((10 ** (digits + 1) - 1) - 10 ** digits) + 10 ** digits)).toString(16));
    }

    return randArr;
}

module.exports = {
    getChannel,
    seconds,
    sleep,
    validUser,
    giveawayCheckOnLaunch,
    codeGenerator,
};
