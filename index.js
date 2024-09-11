import { fork, setupMaster } from 'cluster'
import fs from 'fs'
import { dirname, join } from 'path'
import { createInterface } from 'readline/promises'
import { fileURLToPath } from 'url'

const file = JSON.parse(fs.readFileSync('./config.json'))
const readline = createInterface({ input: process.stdin, output: process.stdout })
let menu = `\n\x1b[1;31m~\x1b[1;37m> ¿Como desea conectarse?\n\x1b[1;31m~\x1b[1;37m> 1. Código QR.\n\x1b[1;31m~\x1b[1;37m> 2. Código de 8 digitos.\n\x1b[1;31m~\x1b[1;37m> `
let isRunning = false;
let objeto = []

if (!fs.existsSync(`./${file.pathFile + '/creds.json'}`)) {
    const opcion = await readline.question(menu)
    if (opcion == '1') { objeto = { connectType: '1', phoneNumber: '' } }
    else if (opcion == '2') { objeto = { connectType: '2', phoneNumber: (await readline.question('\n\x1b[1;31m~\x1b[1;37m> ¿Cual es el numero que desea asignar como Bot?\n: ')).trim() }, readline.close() }
}

function startBot(file) {
    if (isRunning) { return } else isRunning = true;
    const File = join(dirname(fileURLToPath(import.meta.url)), file)
    setupMaster({ exec: File, args: ['' + JSON.stringify(objeto, undefined, 0) + ''] });
    const Worker = fork()
    Worker.on('exit', async (_, code) => {
        isRunning = false
        console.error('\n\x1b[1;31mERROR: \x1b[1;37m' + code);
        await new Promise(resolve => setTimeout(resolve, 2000))
        Worker.process.kill();
        startBot(file);
        if (code !== 0) {
            fs.watchFile(File, () => {
                fs.unwatchFile(File);
                startBot(file);
            });
        }
    })
}

startBot('main.js')