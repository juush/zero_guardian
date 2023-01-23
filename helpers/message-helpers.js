const {MessageEmbed, MessageAttachment} = require("discord.js");
const version = require("../package.json").version



const helpMsg = () => {
    return new MessageEmbed()
        .setColor("#00FFFF")
        .setTitle(`FAQ`)
        .setDescription(`I heard you have some questions...😸`)
        .addFields(
            {
                name: "What is ZERØ Guardian?",
                value: "I'm one of the Discord bots currently being developed by the team at [ZERØ" +
                    " Tools](https://discord.gg/JB2JYzDcPH). My mission is to provide an easy and secure way to help" +
                    " projects verify their members! Have you met my siblings; Companion, Watcher, and Tracker?"
            },
            {
                name: "What do I need to do?",
                value: "You will need to provide a code generated by the owner of the" +
                    " server. If you don't have one you can try looking at the channel description, this is" +
                    " usually found near the top of the Discord window! 😸"
            },
            {
                name: "How can I get ZERØ Guardian?",
                value: "If you're interested in using or learning more about me or the ZERØ" +
                    " Companion, Guardian, Watcher, or Tracker, please visit our" +
                    " [Discord](https://discord.gg/JB2JYzDcPH)!\n You can also [click" +
                    " here](https://discord.com/api/oauth2/authorize?client_id=970760846294802452&permissions=1119241764082&scope=bot%20applications.commands) to invite me to your Discord!" +
                    " Keep in mind, I'm still in beta testing so you may run into issues! If you do please drop" +
                    " by the [Discord](https://discord.gg/JB2JYzDcPH) and let us know!"
            },
        )
}


const safetyMsg = (guildName) => {
    return new MessageEmbed()
        .setColor("#A966FF")
        .setTitle(`⚠ TURN OFF DMs ⚠`)
        .setDescription(`We care about you and your safety!`)
        .addFields(
            {
                name: "DMs!",
                value: "Turn off your DMs! The team should never reach out to you through DMs! Right click the" +
                    " server name and click **Privacy Settings**\nThe team will never ask you for your seed phrase," +
                    " private key, or any other kind of personal information!"
            },
            {
                name: "FOMO!",
                value: "Never FOMO! If there is announcement about a *surprise mint*, chances are it's fake. Check" +
                    " out the other text channels..are they locked? Are emoji reactions suddenly disabled? Be" +
                    " careful! Always take care of yourself and your assets! 💖"
            },
            {
                name: "Links!",
                value: "Only use official links provided by the project, never use google or trust links in a tweet!" +
                    " Look for a channel called `official links` or `FAQ`"
            },
            {
                name: "Impersonators!",
                value: "People will try to trick you by impersonating someone from the team, there is a 99.9% chance" +
                    " the team will not DM you, if you think they have always double check by asking in discord."
            },
            {
                name: "Tickets, Scams, and Support",
                value: "If you have a question please submit a ticket, this is the safest way to contact a member on" +
                    " the team!"
            }

        )
        .setImage('https://cdn.discordapp.com/attachments/884674949623734342/973297882511843388/unknown.png?size=4096')
}


const updateMessage = () => {
    return new MessageEmbed()
        .setColor("#A966FF")
        .setTitle(`What's new in version ${version}`)
        .addFields(
            {
                name: "News",
                value: "Will be added here!"
            },
            {
                name: "What's new?",
                value: "This! As long as you have created a log channel you will now be able to see what's new in" +
                    " the bot!"
            },
            {
                name: "What's next?",
                value: "Over the next updates leading up to 0.2.0-b we will be focusing polishing and fine tuning" +
                    " the bot. Stay tuned!"
            },
            {
                name: "Feedback!",
                value: "For now, if you have any feedback or suggestions feel free to reach out to me on Discord at" +
                    "@Juuce#0001!"
            }

        )
}

module.exports = {
    helpMsg,
    safetyMsg,
    updateMessage
}