const command = {
    command: ['ban', 'kick'],
    categoria: ['grupos']
}

command.script = async (m, { conn }) => {
    if (m.chat.group) return m.sms('group')
    if (m.bot.BotAdmin) return m.sms('botAdmin')
    if (m.sender.admin) return m.sms('admin')
    if (!(m.sender.mentioned[0] || m.sender.quoted || m.text)) return m.reply(`A quien quiere eliminar?`);
    if (m.quoted.sender || m.sender.mentioned[0] && !m.args[1]) {
        const user = m.sender.mentioned[0] ? m.sender.mentioned[0] : m.quoted.sender.id
        if ((global.ROwner + '@s.whatsapp.net').includes(user)) return m.reply('No puedes eliminar al creador del Bot con este comando')
        if (user.includes(m.bot.id) && !m.sender.owner) return m.reply('No puedes eliminar al Bot con este comando')
        await conn.groupParticipantsUpdate(m.chat.id, [user], 'remove')
        return m.react('done')
    }

    if (m.sender.mentioned[0] && m.args[1]) {
        const _numeros = m.text.match(/\d+/g)
        let numeros = _numeros.map(numero => numero + '@s.whatsapp.net')
        if (numeros.map(Bot => Bot).includes(conn.user.jid)) return m.reply('El número asociado al bot no debe incluirse en la lista de usuarios a eliminar.')

        conn.before[m.sender.id] = {
            setTimeout: setTimeout(() => (m.reply('Se acabó el tiempo, esta acción fue cancelada'), delete conn.before[m.sender.id]), 60 * 1000),
            script: async (m, conn) => {
                const settimeout = conn.before[m.sender.id].setTimeout
                const upsert = m.body.toLowerCase();

                const { chat, Numeros } = {
                    user: m.sender.id,
                    chat: m.chat.id,
                    Numeros: numeros
                }

                if (!(chat === m.chat)) return;
                if (upsert == 'no') {
                    clearTimeout(settimeout)
                    delete conn.before[m.sender.id]
                    return m.reply('● *Acción Cancelada ✓*')
                }

                if (upsert == 'si') {
                    for (let i = 0; i < Numeros.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, 1000))
                        await conn.groupParticipantsUpdate(chat, [Numeros[i]], 'remove')
                    }
                    await conn.sendMessage(m.chat.id, { text: `Se eliminaron *${Numeros.length}* participantes ✓`, mentions: [m.sender.id] }, { ephemeralExpiration: 24 * 3600, quoted: { key: { participant: '0@s.whatsapp.net' }, message: { documentMessage: { title: `Acción ejecutada por\nUser : ${m.name}`, jpegThumbnail: null } } } })
                    clearTimeout(settimeout)
                    delete conn.before[m.sender.id]
                }
            }
        }

        m.reply(`¿Confirma que desea eliminar a ${numeros.length} usuarios?\n\nDispone de *60* segundos para tomar una decisión. Si está de acuerdo con esta acción, responda con un ‘sí’. En caso contrario, puede cancelar esta acción respondiendo con un ‘no’.`.trim())
    }
}

export default command