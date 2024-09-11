import { youtubedl } from '@bochilteam/scraper-sosmed'

const Regex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/

const command = {
    command: ['ytmp3', 'ytmp4', 'ytmp'],
    categoria: ['servicio']
}

command.script = async (m, { conn }) => {
    if (!m.text) return m.reply(`Ingrese el comando *\`.${m.command}\`* y seguido el enlace de un video de YouTube`)
    if (!Regex.test(m.args[0])) return m.reply(`Link incorrecto`)

    if (m.command == 'ytmp') {
        await m.react('wait')
        try {
            const data = await youtubedl(m.args[0])
            await conn.sendButton(m.chat.id, [data.title, null, global.botName1], ['image-url', data.thumbnail], [
                { name: 'reply', button: ['( 🎥 • video )', `.ytmp4 ${m.args[0]}`] },
                { name: 'reply', button: ['( 🎧 • audio )', `.ytmp3 ${m.args[0]}`] },
            ], m)
            await m.react('done')
        } catch (e) { console.log(e); await m.react('error') }
    }
    else if (m.command == 'ytmp3') {
        const urls = YoutTube(m.text)
        for (let i = 0; i < urls.length; i++) {
            try {
                await m.react('wait')
                const data = await youtubedl(urls[i])
                await conn.sendMessage(m.chat.id, { audio: { url: await data.audio['128kbps'].download() }, contextInfo: { externalAdReply: { title: data.title, body: '', previewType: "PHOTO", thumbnailUrl: data.thumbnail } }, mimetype: "audio/mp4", fileName: `${data.title}.mp3` }, { quoted: m })
                await m.react('done');
            } catch (e) { console.log(e); await m.react('error') }
        }
    }
    else if (m.command == 'ytmp4') {
        const urls = YoutTube(m.text)
        for (let i = 0; i < urls.length; i++) {
            try {
                await m.react('wait')
                const data = await youtubedl(urls[i])
                const video = data.video[m.tag[0] ? m.tag[0] : '480p']
                await conn.sendMessage(m.chat.id, { document: { url: await video.download() }, caption: `*Calidad:* ${video.quality}`.trim(), mimetype: 'video/mp4', fileName: data.title + `.mp4` }, { quoted: m })
                await m.react('done')
            } catch {
                try {
                    await m.react('wait')
                    const data = await youtubedl(urls[i])
                    const video = data.video['auto']
                    await conn.sendMessage(m.chat.id, { document: { url: await video.download() }, caption: `*Calidad:* ${video.quality}`.trim(), mimetype: 'video/mp4', fileName: data.title + `.mp4` }, { quoted: m })
                    await m.react('done')
                } catch { await m.react('error') }
            }
        }
    }
}

export default command

function YoutTube(texto) {
    var text = texto.split(' ')
    var enlaces = []
    var contador = 0

    for (var i = 0; i < text.length; i++) {
        if (Regex.test(text[i])) {
            enlaces.push(text[i]);
            contador++;
            if (contador === 5) { break }
        }
    }
    return enlaces
}