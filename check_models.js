import fs from 'fs';
import https from 'https';
import path from 'path';

let apiKey = '';
try {
    const envPath = path.resolve(process.cwd(), '.env');
    console.log("Reading .env from:", envPath);
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split(/\r?\n/);
        for (const line of lines) {
            const parts = line.split('=');
            if (parts[0].trim() === 'VITE_GEMINI_API_KEY') {
                apiKey = parts.slice(1).join('=').trim();
                apiKey = apiKey.replace(/^["'](.*)["']$/, '$1');
                break;
            }
        }
    } else {
        console.log(".env file not found at path.");
    }
} catch (e) {
    console.error("Could not read .env file", e);
}

if (!apiKey || apiKey.length < 5) {
    console.error("Error: Valid VITE_GEMINI_API_KEY not found in .env");
    process.exit(1);
}

console.log(`Checking models for API Key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            return;
        }
        try {
            const result = JSON.parse(data);
            if (result.models) {
                fs.writeFileSync('models.json', JSON.stringify(result.models, null, 2));
                console.log("Models written to models.json");
            } else {
                console.log("No models found.");
            }
        } catch (err) {
            console.error("Failed to parse response:", err);
        }
    });
}).on('error', (e) => {
    console.error("Request failed:", e);
});
