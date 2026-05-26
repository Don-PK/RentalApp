import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(express.json());

// Simple health endpoint for MCP
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mcp' }));

// Example protected endpoint using an API key
app.use((req, res, next) => {
  const key = req.header('x-api-key') || req.query.api_key;
  if (!process.env.MCP_API_KEY) return res.status(500).json({ error: 'MCP_API_KEY not configured' });
  if (key !== process.env.MCP_API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// Example MCP route
app.post('/mcp/run', (req, res) => {
  // placeholder for MCP task handling
  res.json({ result: 'task accepted', payload: req.body });
});

const PORT = process.env.MCP_PORT || process.env.PORT || 6000;
app.listen(PORT, () => console.log(`MCP server listening on port ${PORT}`));
