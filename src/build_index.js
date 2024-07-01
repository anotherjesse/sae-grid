import { promises as fs } from 'fs';
import path from 'path';

async function buildIndex() {
    try {
        const dataDir = path.join(process.cwd(), 'public', 'data');
        const files = await fs.readdir(dataDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        const fileList = await Promise.all(jsonFiles.map(async file => {
            const id = file.replace('.json', '');
            const filePath = path.join(dataDir, file);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            return { 
                id, 
                prompt: data.prompt,
                ready: !!data.response
            };
        }));

        const indexPath = path.join(dataDir, 'index.json');
        await fs.writeFile(indexPath, JSON.stringify(fileList, null, 2));
        console.log('Index file created successfully at:', indexPath);
    } catch (error) {
        console.error('Error building index:', error);
    }
}

buildIndex();
