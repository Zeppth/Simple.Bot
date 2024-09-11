const command = {
    command: ['ban', 'kick'],
    categoria: ['grupos']
}

command.script = async (m, { conn }) => {
    if (m.chat.group) return m.sms('group')
    if (m.sender.admin) return m.sms('admin')
    if (m.bot.admin) return m.sms('botAdmin')
    if (!(m.sender.mentioned[0] || m.quoted.sender || m.text)) return m.reply(`A quien quiere eliminar?`);
    if (m.quoted.sender || m.sender.mentioned[0] && !m.args[1]) {
        const user = m.sender.mentioned[0] ? m.sender.mentioned[0] : m.quoted.sender.id
        if ((global.ROwner + '@s.whatsapp.net').includes(user)) return m.reply('No puedes eliminar al creador del Bot con este comando')
        if (user.includes(m.bot.id) && !m.sender.owner) return m.reply('No puedes eliminar al Bot con este comando')
        await conn.groupParticipantsUpdate(m.chat.id, [user], 'remove')
        return m.react('done')
    }
}

export default command