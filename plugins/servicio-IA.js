const { generateWAMessageFromContent, generateWAMessageContent } = (await import('@whiskeysockets/baileys')).default


const command = {
    command: ['ia', 'ai'],
    categoria: ['servicio']
}

command.script = async (m, { conn }) => {
    if (!m.text) return m.reply(`Y el texto?`)
    try {
        m.react('wait')
        const IA = await conn.getJSON(`https://widipe.com/prompt/gpt?prompt=Responde%20a%20las%20siguientes%20preguntas%20y%20mensajes%20de%20manera%20objetiva.%20Usa%20un%20tono%20sarc%C3%A1stico%20y%20despreocupado%20solo%20en%20ocasiones%20%28tambi%C3%A9n%20responde%20de%20forma%20sat%C3%ADrica%20cuando%20el%20texto%20sea%20demasiado%20absurdo%29%2C%20dependiendo%20de%20qu%C3%A9%20tan%20trivial%20sea%20la%20pregunta%20o%20mensaje.&text=${m.text}`)

        await m.reply(IA.result, '@GPT')
        await m.react('done')

    } catch (e) { console.log(e); m.react('error') }
}


export default command

/*const u = {
    "key": {
        "remoteJid": "573243977474@s.whatsapp.net",
        "fromMe": false,
        "id": "224C9B73AB93983E71C129A3241317E6"
    },
    "messageTimestamp": 1726003697,
    "pushName": "Zeppth",
    "broadcast": false,
    "message": {
        "extendedTextMessage": {
            "text": "J",
            "previewType": "NONE",
            "contextInfo": {
                "stanzaId": "3EB0344AB2052C9E0A37BF2050BA4D6AA3A688BD",
                "participant": "51907182818@s.whatsapp.net",
                "quotedMessage": {
                    "interactiveMessage": {
                        "header": {
                            "title": "Simple.Bot"
                        },
                        "body": {
                            "text": "Claro, porque el sentido común es como un unicornio: todos hablan de él, pero parece que muy pocos lo han visto en acción. A veces, parece que la lógica se toma vacaciones prolongadas. Pero sí, es buena idea que las personas lo usen más, ¿no crees?"
                        },
                        "footer": {
                            "text": "@SimpleBot"
                        },
                        "carouselMessage": {}
                    }
                },
                "expiration": 86400,
                "ephemeralSettingTimestamp": "1718422",
                "disappearingMode": {
                    "initiator": "INITIATED_BY_OTHER",
                    "trigger": "ACCOUNT_SETTING",
                    "initiatedByMe": false
                }
            },
            "inviteLinkGroupTypeV2": "DEFAULT"
        },
        "messageContextInfo": {
            "deviceListMetadata": {
                "recipientKeyHash": "ntrc5s0UKFVS6Q==",
                "recipientTimestamp": "1725990862"
            },
            "deviceListMetadataVersion": 2,
            "messageSecret": "1SCBuhSG32NfzRL43Y63/c82HW7pKv3vQbIAAbK/yCc="
        }
    }
}*/