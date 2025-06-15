const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { get } = require('https');
const app = express();
const DEFAULT_VOICE = "en_US-ryan-high"; // Default voice model
const MODELS_DIR = "/usr/share/piper-voices";
const VOICES_LIST = '/usr/share/piper-voices/voices.json';
const PIPER_PORT = process.env.PIPER_PORT || 5001;
const PIPER_CORS = process.env.PIPER_CORS || false;


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
    } catch (err) {
        console.error('Error parsing JSON:', err);
        return
    }
}

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


async function runExecutable(input, voice, res) {
    return new Promise(async (resolve, reject) => {
        try {
            const tempFileName = generateRandomFileName();
            // const outputFile = path.join('/tmp', tempFileName);
            const outputFile = path.join(__dirname, tempFileName);
            const voicePath = await getVoicePath(voice);
            logToTextFile(input, voice);
            const cmd = `piper-tts --model ${voicePath} --output_file ${outputFile}`;
            console.log(cmd);
            const process = exec(cmd, async (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error executing command: ${stderr}`);
                            reject(new Error('Error generating audio'));
                    return;
                }
                try {
                    res.setHeader('Content-Type', 'audio/wav');
                    res.setHeader('Content-Disposition', `attachment; filename="${tempFileName}"`);
                    const readStream = fs.createReadStream(outputFile);
                    readStream.pipe(res);
                    // Clean up: remove the temporary file after sending it
                    readStream.on('end', () => {
                        fs.unlink(outputFile, (err) => {
                            if (err) console.error('Error removing temporary file:', err);
                        });
                        resolve();
                    });
                } catch (err) {
                    console.error('Error sending response:', err);
                    reject(new Error('Error sending response'));
                }
            });
            process.stdin.write(input);
            process.stdin.end();
        } catch (err) {
            console.error('Error running executable:', err);
            reject(new Error('Error running executable'));
        }
    });
}

app.get('/', (req, res) => {
    res.send('Basic piper TTS server. Use /tts to convert text to speech and /voices to get available voices.');
});

// POST request handler
app.post('/tts', (req, res) => {
    const { text, voice = DEFAULT_VOICE } = req.body;
    const trimmedText = text.trim();

    if (!trimmedText) {
        return res.status(400).send('Error parsing json - text');
    }
    runExecutable(trimmedText, voice, res);
});

// GET request handler
app.get('/tts', (req, res) => {
    const text = req.query.text ? req.query.text.trim() : null;
    let voice = req.query.voice || DEFAULT_VOICE;
    if (!text) {
        return res.status(400).send('Missing Text Parameter.');
    }
    runExecutable(text, voice, res);
});

// Get available voices
app.get('/voices', async (req, res) => {
    const voices = await getListOfVoices(MODELS_DIR);
    res.json(voices);
});

app.get('/test', async (req,res) => {
    // const voicepath = await getVoicePath('en_US-libritts-high');
    // res.json(voicepath)
    runExecutable("testing the shit out of this now", DEFAULT_VOICE, res);
})

// // Middleware 
if (!PIPER_CORS) {
    const cors = require('cors');
    app.use(cors());
}
app.use(express.json());
// Start the server
app.listen(PIPER_PORT, () => {
    console.log(`Server listening on port ${PIPER_PORT}`);
});
