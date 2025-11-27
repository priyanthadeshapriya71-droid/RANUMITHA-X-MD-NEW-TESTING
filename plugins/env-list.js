const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');

function saveConfig() {
    fs.writeFileSync("./config.js", "module.exports = " + JSON.stringify(config, null, 2));
}

// SETTINGS COMMAND
cmd({
    pattern: "settings",
    alias: ["set"],
    desc: "Owner settings panel",
    category: "owner",
    react: "⚙️",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {

    // OWNER CHECK
    if (!isOwner) return reply("🚫 *Owner Only!*");

    const menu = `
⚙️ *BOT SETTINGS PANEL*

1. *ANTI DELETE*
   1.1 ➜ Turn ON
   1.2 ➜ Turn OFF

2. *AUTO READ*
   2.1 ➜ Turn ON
   2.2 ➜ Turn OFF

3. *PUBLIC / PRIVATE*
   3.1 ➜ Public Mode
   3.2 ➜ Private Mode

4. *AUTO TYPING*
   4.1 ➜ Turn ON
   4.2 ➜ Turn OFF

👨‍💻 *Reply with option number (e.g. 1.1)*
`;

    reply(menu);

    // WAIT FOR NEXT MESSAGE
    const messageListener = conn.ev.on('messages.upsert', async (msgUpdate) => {
        try {
            const mekInfo = msgUpdate.messages[0];
            if (!mekInfo?.message) return;

            const sender = mekInfo.key.participant || mekInfo.key.remoteJid;
            const ownerJid = config.OWNER_NUMBER.replace(/[^0-9]/g, '') + "@s.whatsapp.net";

            // CHECK OWNER INSIDE LISTENER
            if (sender !== ownerJid) return;

            const option = mekInfo.message.conversation || mekInfo.message.extendedTextMessage?.text;
            if (!option) return;

            /** ANTI DELETE */
            if (option === "1.1") {
                config.ANTI_DELETE = true;
                saveConfig();
                await conn.sendMessage(sender, { text: "🟢 *Anti Delete Enabled!*" });
            }
            if (option === "1.2") {
                config.ANTI_DELETE = false;
                saveConfig();
                await conn.sendMessage(sender, { text: "🔴 *Anti Delete Disabled!*" });
            }

            /** AUTO READ */
            if (option === "2.1") {
                config.AUTO_READ = true;
                saveConfig();
                await conn.sendMessage(sender, { text: "🟢 *Auto Read Enabled!*" });
            }
            if (option === "2.2") {
                config.AUTO_READ = false;
                saveConfig();
                await conn.sendMessage(sender, { text: "🔴 *Auto Read Disabled!*" });
            }

            /** PUBLIC / PRIVATE */
            if (option === "3.1") {
                config.PUBLIC_MODE = true;
                saveConfig();
                await conn.sendMessage(sender, { text: "🌐 *Bot is now PUBLIC!*" });
            }
            if (option === "3.2") {
                config.PUBLIC_MODE = false;
                saveConfig();
                await conn.sendMessage(sender, { text: "🔒 *Bot is now PRIVATE!*" });
            }

            /** AUTO TYPING */
            if (option === "4.1") {
                config.AUTO_TYPING = true;
                saveConfig();
                await conn.sendMessage(sender, { text: "🟢 *Auto Typing Enabled!*" });
            }
            if (option === "4.2") {
                config.AUTO_TYPING = false;
                saveConfig();
                await conn.sendMessage(sender, { text: "🔴 *Auto Typing Disabled!*" });
            }

        } catch (e) {
            console.log("Settings Error:", e);
        }
    });
});
