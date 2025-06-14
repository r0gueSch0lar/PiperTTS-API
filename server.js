const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { get } = require('https');
// const JSON = require('json'); 
// const os = require('os');
// const cors = require('cors');

const app = express();
const PIPER_PORT = process.env.PORT || 5001;
const DEFAULT_VOICE = "en_US-ryan-high.onnx"; // Default voice model
// const MODELS_DIR = path.join(__dirname, 'models');
const MODELS_DIR = "/usr/share/piper-voices";
const VOICES_LIST = '/usr/share/piper-voices/voices.json';

// function getPiperPath() {
//     // const platform = os.platform();
//     // const isWSL = fs.existsSync('/proc/version') && fs.readFileSync('/proc/version', 'utf8').includes('Microsoft');
//     // if (platform === 'win32' || (platform === 'linux' && isWSL)) {
//     //     return './piper.exe';
//     // } 
//     // else if ((platform === 'linux')) {
//     //     return 'piper-tts-bin'
//     // } else {
//     //     // For macOS or other platforms, set to default executable
//     //     return './piper';
//     // }
//     return 'piper-tts-bin'
// }
    function getPiperPath() {
        return 'piper-tts'
    }
// function getModelPath(fileName) {
//     const platform = os.platform();
//     const isWSL = fs.existsSync('/proc/version') && fs.readFileSync('/proc/version', 'utf8').includes('Microsoft');
//     if (platform === 'win32' || (platform === 'linux' && isWSL)) {
//         return `${fileName}`;
//     } 
//     else if ((platform === 'linux')) {
//         return path.join("/usr/share/piper-voices/",fileName)
//     } else {
//         // For macOS or other platforms, set to default executable
//         return path.join(__dirname,fileName);
//     }
// }
    function getModelPath(fileName) {
        return path.join("/usr/share/piper-voices/",fileName)
    }
// function getVoicePath(voice) {
//     const platform = os.platform();
//     const isWSL = fs.existsSync('/proc/version') && fs.readFileSync('/proc/version', 'utf8').includes('Microsoft');
//     if (platform === 'win32' || (platform === 'linux' && isWSL)) {
//         return path.join("models",voice);
//     } else {
//         // For macOS or other platforms, set to default executable
//         return path.join(MODELS_DIR,voice);
//     }
// }
// async function getVoicePath(voice) {
//   try {
//     const data = await fs.promises.readFile(VOICES_LIST, 'utf8');
//     const voice_list = JSON.parse(data);
//     if (
//     //   voice_list !== {} & Array.isArray(voice_list[voice]) && voice_list[voice].length > 0 && Array.isArray(voice_list[voice]['files']) && voice_list[voice]['files'].length > 0 ){
//       const temp = voice_list[voice]['files'][0]
//       return  path.join(MODELS_DIR,temp);
//     }
//             } catch (error) {
//     console.error('Error reading voice file:', error);
//             }
//         }


// const getVoicePath = async (voice) => {
//     await fs.readFile(VOICES_LIST, 'utf8', (err, data) => {
//         if (err) {
//             console.error('Error reading file:', err);
//             return
//         } else {
//             try {
//                 // console.table(data)
//                 // const voice_list = JSON.parse(data);
//                 // return voice_list;
//                 return data[voice]
//             // return path.join(MODELS_DIR,voice_list[voice]['files'][0]);
//             } catch (error) {
//                 console.error('Error parsing JSON:', error);
//                 return
//             }
            
//         }
//     })
// }
async function getVoicePath(voice) {
    try {
        const data = await fs.promises.readFile(VOICES_LIST, 'utf8');
        const voice_list = JSON.parse(data);
        files = voice_list[voice]['files']
        for (let key in files) {
            try {
               await fs.promises.access(path.join(MODELS_DIR, key), fs.constants.F_OK);
               return path.join(MODELS_DIR, key);
            } catch (err) {
                console.log(voice + 'File does not exit');
                continue;
            }
        }
        return path.join(MODELS_DIR, DEFAULT_VOICE + ".onnx");
            // fs.access(path.join(MODELS_DIR, key), fs.constants.F_OK, (err) => {
            //   if (err) {
            //     console.log(voice +'File does not exist.');
            //     return path.join(MODELS_DIR, DEFAULT_VOICE + ".onnx")
            //   }
            //     return path.join(MODELS_DIR, key);
            // });
            // if (exists(path.join(MODELS_DIR, key))) {
            //     return path.join(MODELS_DIR, key)
            // } else {
            //     return path.join(MODELS_DIR, DEFAULT_VOICE + ".onnx")
            // }
            
    } catch (err) {
        console.error('Error parsing JSON:', err);
        return
    }
}


const PIPER_PATH = getPiperPath();

// // Middleware 
// app.use(cors());
app.use(express.json());

 const getListOfVoices = async (dir) => {
    const onnxFiles = [];
    const walk = async (currentDir) => {
        try {
        const files = await fs.promises.readdir(currentDir);
        for (const file of files) {
                try {
            const filePath = path.join(currentDir, file);
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                await walk(filePath);
            } else if (path.extname(filePath) === '.onnx') {
                onnxFiles.push(file.split(".")[0]);
            }
                } catch (err) {
                    console.error(`Error accessing file ${filePath}:`, err);
                    continue;
        }
            }
        } catch (err) {
            console.error(`Error reading directory ${currentDir}:`, err);
        }
    };
    await walk(dir);
    return onnxFiles;
};
// // Function to get the list of voice models available
// async function getListOfVoices(dir) {
//     // return fs.readdirSync(MODELS_DIR).filter(file => file.endsWith('.onnx'));
//     let voices = [];
//     const items = await fs.promises.readdir(dir);

//     for (const item of items) {
//         const itemPath = path.join(dir, item);
//         const stats = await fs.promises.stat(itemPath);
//         if (stats.isDirectory()) {
//             await getListOfVoices(itemPath);
//         } else {
//             if (itemPath.endsWith('.onnx')) {
//                 voices.push(itemPath);
//             }
//         }
//     }
//     return voices;
// }
// async function walkDir(dir) {
//     let voices = [];
//     const items = await fs.promises.readdir(dir);

//     for (const item of items) {
//         const itemPath = path.join(dir, item);
//         const stats = await fs.promises.stat(itemPath);
//         if (stats.isDirectory()) {
//             await walkDir(itemPath);
//         } else {
//             if (itemPath.endsWith('.onnx')) {
//                 voices.push(itemPath);
//             }
//         }
//     }
//     return voices;
// }

// // Function to log the request details to a file
function logToTextFile(text, voice) {
    const logEntry = `${new Date().toISOString()}, ${text}, ${voice}\n`;
    console.log(logEntry)
    fs.appendFileSync('log.txt', logEntry, 'utf8');
}

// // Function to generate a random file name
function generateRandomFileName() {
    const randomPart = Math.random().toString(36).substring(2, 15);
    const timestampPart = Date.now().toString(36);
    return randomPart + timestampPart + '.wav';
}

// // Function to execute the Piper command with the given input and voice
function runExecutable(input, voice, res) {
    const tempFileName = generateRandomFileName();
    // const outputFile = getModelPath(tempFileName);
    const outputFile = path.join(__dirname,tempFileName);
    
    const voicePath = getVoicePath(voice);
    logToTextFile(input, voice);

    const cmd = `${PIPER_PATH} --model ${voicePath} --output_file ${outputFile}`;
    console.log(cmd);
    
    const process = exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${stderr}`);
            res.status(500).send('Error generating audio');
            return;
        }

        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Disposition', `attachment; filename="${tempFileName}"`);
        
        const readStream = fs.createReadStream(outputFile);
        readStream.pipe(res);

        // Clean up: remove the temporary file after sending it
        readStream.on('end', () => {
            fs.unlink(outputFile, (err) => {
                if (err) console.error('Error removing temporary file:', err);
            });
        });
    });

    process.stdin.write(input);
    process.stdin.end();
}

app.get('/', (req, res) => {
    res.send('Basic piper TTS server. Use /tts to convert text to speech and /voices to get available voices.');
});

// // POST request handler
// app.post('/tts', (req, res) => {
//     const { text, voice = DEFAULT_VOICE } = req.body;
//     const trimmedText = text.trim();

//     if (!trimmedText) {
//         return res.status(400).send('Error parsing json - text');
//     }

//     const voices = await getListOfVoices(MODELS_DIR);
//     const selectedVoice = voices.includes(voice) ? voice : DEFAULT_VOICE;

//     runExecutable(trimmedText, selectedVoice, res);
// });

// GET request handler
app.get('/tts', (req, res) => {
    const text = req.query.text ? req.query.text.trim() : null;
    let voice = req.query.voice || DEFAULT_VOICE;

    if (!text) {
        return res.status(400).send('Missing Text Parameter.');
    }

    const voices = getListOfVoices();
    if (!voices.includes(voice)) {
        voice = DEFAULT_VOICE;
    }

    runExecutable(text, voice, res);
});

// Get available voices
app.get('/voices', async (req, res) => {
    const voices = await getListOfVoices(MODELS_DIR);
    // const voices = await findOnnxFiles(MODELS_DIR);
    res.json(voices);
});

app.get('/test', async (req,res) => {
    const voicepath = await getVoicePath('en_US-libritts-high');
    res.json(voicepath)
})

// Start the server
app.listen(PIPER_PORT, () => {
    console.log(`Server listening on port ${PIPER_PORT}`);
});
