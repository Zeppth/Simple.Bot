const command = {
    command: ['setpp'],
    categoria: ['grupos']
}

command.script = async (m, { conn }) => {
    const findCmd = (array) => array.find(o => o == m.command)
    if (findCmd(['setpp'])) {
        const type = m.SMS().message;
        const change = async (type) => { try { await m.react('wait'), await m[type].change.photo(await conn.download(), /*'full'*/), await m.react('done') } catch (e) { await m.react('error'), console.log(e) } }

        if (!type['imageMessage']) {
            await m.react('❗')
            return await m.reply('Por favor, vuelva a enviar el comando junto con una imagen o respondiendo a una.')
        }
        if (m.args[0] == 'group' || m.args[0] == 'grupo' || m.args[0] == 'g') {
            if (!m.sender.admin) return m.sms('admin')
            if (!m.bot.admin) return m.sms('botAdmin')
            await change('chat')
        }
        else if (m.args[0] == 'bot' || m.args[0] == 'Bot' || m.args[0] == 'b') {
            if (m.IS(['rowner', 'owner'])) return m.sms('owner')
            await change('bot')
        }
        else if (!m.args[0] && m.chat.group) {
            if (!m.sender.admin) return m.sms('admin')
            if (!m.bot.admin) return m.sms('botAdmin')
            await change('chat')
        }
        else if (!m.args[0] && !m.chat.group && m.IS(['rowner', 'owner'])) {
            await change('bot')
        }
    }
}

export default command