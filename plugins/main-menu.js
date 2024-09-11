const command = {
    command: ['menu', 'comandos', 'cmd'],
    categoria: ['main']
}

command.script = async (m, { conn }) => {
    m.reply(`*Comandos*

- *Grupos:*
 .settings
 .hidetag
 .invocar
 .ban

- *Media:*
 .play
 .yts
 .ytmp4
 .ytmp3
 .tiktok

- *Otros*
 .animes
 .IA`)
}

export default command