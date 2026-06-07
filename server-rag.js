import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const app = express();
const upload = multer({ dest: 'uploads_tmp/' });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

if (!process.env.OPENAI_API_KEY) {
  console.error('❌  OPENAI_API_KEY not found. Create a .env file with OPENAI_API_KEY=sk-...');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── In-memory vector store ────────────────────────────────────────────────────
let chunks = [];

function splitText(text, chunkSize = 500, overlap = 50) {
  const result = [];
  let i = 0;
  while (i < text.length) {
    result.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return result;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function embed(text) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return res.data[0].embedding;
}

// ── Extract text from PDF ─────────────────────────────────────────────────────
async function extractPdfText(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

// ── POST /api/ingest (multipart) ──────────────────────────────────────────────
app.post('/api/ingest', upload.array('files'), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' });

    chunks = []; // reset

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let text = '';

      if (ext === '.pdf') {
        text = await extractPdfText(file.path);
      } else {
        text = fs.readFileSync(file.path, 'utf-8');
      }

      // Clean up temp file
      fs.unlinkSync(file.path);

      const parts = splitText(text);
      for (const part of parts) {
        if (part.trim().length < 20) continue; // skip tiny chunks
        const embedding = await embed(part);
        chunks.push({ text: part, metadata: { filename: file.originalname }, embedding });
      }
    }

    console.log(`✅ Ingested ${chunks.length} chunks`);
    res.json({ success: true, chunksIndexed: chunks.length });
  } catch (err) {
    console.error('Ingest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/query ───────────────────────────────────────────────────────────
app.post('/api/query', async (req, res) => {
  try {
    const { question, topK = 4 } = req.body;
    if (!question) return res.status(400).json({ error: 'No question provided' });
    if (!chunks.length) return res.status(400).json({ error: 'No documents ingested yet. Upload files first.' });

    const queryEmbedding = await embed(question);
    const scored = chunks
      .map(c => ({ ...c, score: cosineSimilarity(queryEmbedding, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    const context = scored.map(c => c.text).join('\n\n---\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Answer ONLY using the provided context.
If the answer is not in the context, say "I don't have enough information to answer that from the uploaded documents."`,
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    res.json({
      answer: completion.choices[0].message.content,
      sources: scored.map(c => c.metadata),
    });
  } catch (err) {
    console.error('Query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', chunksLoaded: chunks.length });
});

app.listen(3000, () => {
  console.log('✅ RAG backend running on http://localhost:3000');
});