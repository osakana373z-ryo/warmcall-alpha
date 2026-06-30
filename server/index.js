import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter from './routes/auth.js';
import eldersRouter from './routes/elders.js';
import chatRouter from './routes/chat.js';
import elderChatRouter from './routes/elderChat.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'WarmCall API' });
});

app.use('/api/auth', authRouter);
app.use('/api/elders', eldersRouter);
app.use('/api/chat', chatRouter);
app.use('/api/elder-chat', elderChatRouter);
app.use('/api/admin', adminRouter);

// Serve React frontend in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`WarmCall running on port ${PORT}`);
});