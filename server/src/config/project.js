import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Branding and the demo project live in one shared file used by both the
// client and the server: shared/gravitas.config.json
const configPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../shared/gravitas.config.json');

export const gravitasConfig = Object.freeze(JSON.parse(fs.readFileSync(configPath, 'utf8')));

export const defaultProject = Object.freeze({
  title: gravitasConfig.conversation.title,
  name: gravitasConfig.project.name,
  code: gravitasConfig.project.code,
  description: gravitasConfig.project.description,
  status: gravitasConfig.project.status,
  welcomeMessage: gravitasConfig.conversation.welcomeMessage,
});
