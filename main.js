import chalk from 'chalk';
import fs, { link } from 'fs';
import Jimp from 'jimp';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import minimist from 'minimist';
import path from 'path';
import url from 'url';
import util from 'util';
import { makeWABot } from './lib/WaBot.js';
import { simple } from './lib/Simple.js';
import { ChatUpdate, DataBase } from './script.js';
import moment from 'moment-timezone'

const file = JSON.parse(fs.readFileSync('./config.json'));
const Process = minimist(process.argv.slice(2));
let args = Process._[0] ? JSON.parse(Process._[0]) : {};
const { DisconnectReason } = (await import('@whiskeysockets/baileys')).default;

const commands = new Map();
const makeBot = new makeWABot();
const dataBase = new LowSync(new JSONFileSync(path.resolve('./lib/data/dataBase.json')), {});
dataBase.read();

await Promise.all(fs.readdirSync('./plugins/').filter(file => file.endsWith('.js')).map(file => import(url.pathToFileURL(path.resolve(`./plugins/${file}`))).then(plugin => { commands.set(file, plugin.default) }).catch(error => { console.log(chalk.bgRed('[ ERROR ]'), chalk.redBright.bold(`${file}:`), format(error)) })))

commands.set('0', { script: async (cmd = false) => { let numero = 0; return await new Promise((resolve, reject) => { try { commands.forEach(async (plugin) => { numero += 1, plugin?.command?.find(o => o == cmd) ? resolve(plugin) : numero >= commands.size ? resolve(false) : null }) } catch (e) { return reject(e) } }) } })

if (!fs.existsSync(path.resolve('tmp'))) { fs.mkdirSync('tmp', { recursive: true }), console.log('tmp create') }

setInterval(async () => { await fs.promises.readdir(path.join('.', 'tmp')).then(files => { files.forEach(async file => { await fs.promises.unlink(path.join('./tmp', file)).catch(e => console.error(`El archivo ${file} no se pudo eliminar.`)) }) }).catch(e => console.error('ERROR:', e)) }, 1000 * 60 * 2)

if (dataBase.data) { setInterval(async () => { dataBase.write() }, 1000 * 60) }


async function StartBot() {
    const conn = await makeBot.make({
        connectType: args.connectType,
        phoneNumber: args.phoneNumber,
        pathFile: file.pathFile
    });

    if (conn.PairingCode) {
        const code = conn.PairingCode.match(/.{1,4}/g)?.join("-");
        console.log('\x1b[1;31m~\x1b[1;37m> código: [ ' + code + ' ]');
        args = {};
    }

    conn.db = dataBase;
    global.db = dataBase;
    conn.commands = commands;
    conn.data = dataBase.data;

    //////////////
    global.botName = file.botName[0]
    global.botName1 = file.botName[1]
    global.botName2 = file.botName[2]

    if (!conn.before) { conn.before = {} }


    conn.getName = async (id) => {
        if (typeof id !== 'string') return new Error('conn.getName()');
        id = id.toString();
        if (id.endsWith('@s.whatsapp.net')) {
            if (id == conn.user.id) return conn.user.name;
            let concat = await conn.dataStore['@users'][id] || {};
            concat = concat?.name || id.split('@')[0];
            return concat;
        } else { return id }
    };

    conn.generate_ProfilePhoto = async (buffer) => {
        const jimp = await Jimp.read(buffer);
        const cropped = jimp.crop(0, 0, jimp.getWidth(), jimp.getHeight());
        return await cropped.scaleToFit(720, 720).getBufferAsync(Jimp.MIME_JPEG);
    };


    conn.getChat = async (chat = false) => {
        if (!chat) return new Error('conn.getChat( chat ? )')
        let m = { id: chat }
        const chatStore = conn.dataStore['@chats']
        if (!chatStore[m.id]) chatStore[m.id] = { link: false, code: false, users: {} }

        // datos | obtener datos
        m.group = m.id.endsWith('@g.us')
        m.metaData = m.grupo ? (await conn.groupMetadata(chat) || {}) : {}
        m.name = m.metaData.subject || 'undefined'
        m.description = m.metaData.desc || 'undefined'
        m.participants = m.metaData.participants || []
        m.admins = m.participants.filter(o => o.admin !== null).map(v => v.id) || []
        m.owner = m.metaData.subjectOwner || 'undefined'
        m.photo = async (type = 'image') => await conn.profilePictureUrl(m.id, type).catch(_ => 'https://images8.alphacoders.com/113/thumb-1920-1138430.png')
        m.code = chatStore[m.id]?.code || null
        m.link = chatStore[m.id]?.link || null
        m.change = {
            description: async (text) => await conn.groupUpdateDescription(m.id, text),
            name: async (text) => await conn.groupUpdateSubject(m.id, text),
            photo: async (image) => await conn.query({ tag: 'iq', attrs: { to: m.id, type: 'set', xmlns: 'w:profile:picture' }, content: [{ tag: 'picture', attrs: { type: 'image' }, content: conn.generate_ProfilePhoto(image) }] })
        }

        return m
    }

    conn.getUser = async (user = false) => {
        if (!user) return new Error('conn.getUser( user ? )')
        let m = { id: user }

        // dataStore | guardar datos
        const userStore = conn.dataStore['@users']
        if (!userStore[m.id]) userStore[m.id] = {
            name: false,
            names: [],
            messages: [],
            commands: [],
            chats: []
        }

        // datos | obtener datos
        m.bot = (conn.user.id.split(":")[0] + "@s.whatsapp.net") == m.id
        m.name = m.bot ? conn.user.name : userStore[m.id]?.name ? 'undefined' : userStore[m.id].name
        m.photo = async (type = 'image') => await conn.profilePictureUrl(m.id, type).catch(_ => 'https://images8.alphacoders.com/113/thumb-1920-1138430.png')
        m.description = async () => (await conn.fetchStatus(m.id) || {})?.status || 'undefined'
        m.number = m.id.split('@')[0] || undefined
        m.link = `https://wa.me/${m.number}`
        if (m.bot) m.change = {
            description: async (text) => await conn.updateProfileStatus(text),
            name: async (text) => await conn.updateProfileName(text),
            photo: async (image) => await conn.query({ tag: 'iq', attrs: { to: m.id, type: 'set', xmlns: 'w:profile:picture' }, content: [{ tag: 'picture', attrs: { type: 'image' }, content: conn.generate_ProfilePhoto(image) }] })
        }

        return m
    }

    // event
    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (connection === 'close') { console.log(chalk.redBright.bold(lastDisconnect.error), chalk.greenBright(', reconectando... ',)); if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut || lastDisconnect.error?.output?.statusCode === 515) { await StartBot().catch(e => console.error(e)); } } else if (connection === 'open') { console.log(`${chalk.greenBright(`Conectado => ` + JSON.stringify(conn.user, null, 2))}`) }
        if (qr) { console.log(`\n${chalk.greenBright(`[ QR ]:\n`)}`) }
    });

    conn.ev.on('messages.upsert', async (m) => {
        let message_org = m
        try {
            if (m.messages > !0) return 'Esperando...'
            m = m.messages[0]
            m.message_org = message_org
            m.type = (message = { E: null }, object = false) => object ? Object.keys(message).find(o => o == object) : Object.keys(message)[0]

            console.log(JSON.stringify(m, (key, value) => key === 'message_org' ? undefined : value, 2))

            if (m.key) {
                if (m.key.remoteJid.endsWith('@g.us')) {
                    m.chat = { ...(await conn.getChat(m.key.remoteJid)) }
                } else if (m.key.remoteJid.endsWith('@s.whatsapp.net')) {
                    m.chat = { ...(await conn.getUser(m.key.remoteJid)) }
                    m.chat.group = false
                }
                m.sender = { ...(m.key.remoteJid.endsWith('@s.whatsapp.net') ? await conn.getUser(m.key.remoteJid) : await conn.getUser(m.key.participant)) }
                m.bot = { ...(await conn.getUser(conn.user.id.split(":")[0] + "@s.whatsapp.net")) }
                m.sender.mentioned = m.mentionedJid || []

                if (m.chat.group) {
                    m.bot.fromMe = m.key.fromMe || false
                    m.bot.admin = m.chat.admins.includes(m.bot.id) || false
                    m.sender.admin = m.chat.admins.includes(m.sender.id) || false
                }

                if (m.bot.admin) {
                    const chatStore = conn.dataStore['@chats']
                    if (!chatStore[m.chat.id].code) chatStore[m.chat.id].code = await conn.groupInviteCode(m.chat.id)
                    if (!chatStore[m.chat.id].link && chatStore[m.chat.id].code) chatStore[m.chat.id].link = `https://chat.whatsapp.com/${chatStore[m.chat.id].code}`

                    m.chat.code = chatStore[m.chat.id]?.code || null
                    m.chat.link = chatStore[m.chat.id]?.link || null
                }
            }

            // dataBase
            await DataBase(conn, m)
            await simple(conn, m, conn.store)
            if (m.messageStubType) return await conn.commands.get('[StubType].js').script(m, { conn })
            if (m.message) {
                const getMessageBody = (message) => m.type(message, 'conversation') ? message.conversation : m.type(message, 'imageMessage') ? message.imageMessage.caption : m.type(message, 'videoMessage') ? message.videoMessage.caption : m.type(message, 'extendedTextMessage') ? message.extendedTextMessage.text : m.type(message, 'templateButtonReplyMessage') ? message.templateButtonReplyMessage.selectedId : m.type(message, 'interactiveResponseMessage') ? (JSON.parse(message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)).id : false

                m.body = await getMessageBody(m.message)
                m.tag = m.body ? (m.body.match(/tag=[^ ]+/g) || []).map(tag => tag.split('=')[1]) : []
                m.budy = m.tag.length > 0 ? m.body.replace(/tag=[^\s]+/g, '') : m.body || ''
                m.command = (file.Prefix + '').includes(m.budy[0]) ? m.budy.substring(1).trim().split(/ +/)[0].toLowerCase() : (file.Prefix === false && !(file.Prefix + '').includes(m.budy[0])) ? m.budy.trim().split(/ +/)[0].toLowerCase() : false
                m.isCmd = await conn.commands.get('0').script(m.command)
                m.args = m.budy.trim().split(/ +/).slice(1)
                m.text = m.args.length > 0 ? m.args.join(" ") : false

                console.log('\x1b[1;31m~\x1b[1;37m>', chalk.white('['), chalk.magenta(moment().tz(Intl.DateTimeFormat().resolvedOptions().timeZone).format('HH:mm:ss')).trim(), chalk.white(']'), chalk.blue(await conn.commands.get('0').script(m.command) ? `COMANDO:` : `MENSAJE:`), chalk.green('{'), chalk.rgb(255, 131, 0).underline(m.budy == '' ? m.type(m.message) + '' : m.budy), chalk.green('}'), chalk.blue(m.isCmd ? 'Por' : 'De'), chalk.cyan(m.sender.name), 'Chat', m.chat.group ? chalk.bgGreen('grupo:' + (m.chat.name || m.chat.id)) : chalk.bgRed('Privado:' + m.sender.name || m.sender.id))

                const message = m.message[m.type(m.message)]
                m.contextInfo = m.type(message, 'contextInfo') ? message.contextInfo : false
                m.quoted = m.type(message, 'contextInfo') ? m.type(message.contextInfo, 'quotedMessage') ? message.contextInfo.quotedMessage : false : false

                if (m.quoted) {
                    m.quoted.sender = { ...(await conn.getUser(m.contextInfo.participant.split(":")[0] || m.contextInfo.participant) || {}) }
                    m.quoted.sender.mentioned = m.contextInfo.mentionedJid || []
                    /*const quotedChat = m.contextInfo.remoteJid || m.chat

                    if (quotedChat.endsWith('@s.whatsapp.net')) {
                        m.quoted.chat = { ...(await conn.getUser(quotedChat)) }
                        m.quoted.chat.grupo = false
                    } else if (quotedChat.endsWith('@g.us')) {
                        m.quoted.chat = { ...(await conn.getChat(quotedChat)) }
                    }

                    if (m.quoted.chat.grupo) {
                        m.quoted.sender.admin = m.quoted.chat.admins.includes(m.quoted.sender.id) || false
                    }*/
                }

                //cache
                if (m.chat.id) {
                    if (!conn['node-cache'].has(m.chat.id)) conn['node-cache'].set(m.chat.id, []);
                    const msgCache = conn['node-cache'].get(m.chat.id);
                    if (m.key && m.key.participant) {
                        if (msgCache.length >= 100) msgCache.pop()
                        msgCache.unshift({ key: m.key, message: JSON.stringify(m.message) })
                        conn['node-cache'].set(m.chat.id, msgCache)
                    }
                }

                await ChatUpdate(conn, m, conn.store);
            } else { console.log(JSON.stringify(message_org, undefined, 2)) }
        } catch (e) { console.log(chalk.bgRed('\n[E] messages.upsert:'), chalk.white(util.format(e))) }
    })
}

await StartBot()