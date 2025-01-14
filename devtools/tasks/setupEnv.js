import fs from 'fs';
import path from 'path';

const envExample = `API_URL=https://api.example.com`;
const envLocal = `API_URL=https://api.example.com`;
const env = `API_URL=https://api.example.com`;

const files = [
	{ name: '.env.example', content: envExample },
	{ name: '.env.local', content: envLocal },
	{ name: '.env', content: env }
];

files.forEach((file) => {
	const filePath = path.join(process.cwd(), file.name);
	if (!fs.existsSync(filePath)) {
		fs.writeFileSync(filePath, file.content);
		console.log(`Created ${file.name}`);
	} else {
		console.log(`${file.name} already exists`);
	}
});
