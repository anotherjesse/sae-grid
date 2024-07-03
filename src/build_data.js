import { promises as fs } from 'fs';
import path from 'path';

import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const run = (text) =>
    replicate.run(
        "anotherjesse/sae-steering:bb7814ae24544ec5bfcefa0a36d7ee9d0ceffb2ac5409f38da9e755d7ba54dbf",
        {
            input: {
                prompt: text,
                return_features: true
            }
        }
    );

async function buildData() {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    try {
        const texts = await fs.readFile(path.join(dataDir, 'texts.json'), 'utf-8').then(JSON.parse);
        
        const files = await fs.readdir(dataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        const promises = Object.keys(texts).map(async (key) => {
            if (jsonFiles.includes(key + '.json')) {
                return;
            }
            const text = texts[key];
            const jsonstring = await run(text);
            const result = JSON.parse(jsonstring);
            await fs.writeFile(path.join(dataDir, key + '.json'), JSON.stringify(result));
        });

        await Promise.all(promises);

        console.log("Data built successfully")
    } catch (error) {
        console.error('Error building index:', error);
    }
}

buildData();

