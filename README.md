# 📚 RAG Model – Angular + OpenAI Document Chat

A Retrieval-Augmented Generation (RAG) application built with **Angular 22**, **Node.js**, **Express**, and **OpenAI**.

Users can upload PDF or text-based documents, automatically generate embeddings, and ask natural language questions. The system retrieves the most relevant document chunks and uses GPT to generate context-aware answers.

---

## 🚀 Features

* Upload multiple documents
* PDF text extraction
* Automatic document chunking
* OpenAI Embeddings (`text-embedding-3-small`)
* Semantic similarity search using cosine similarity
* GPT-powered question answering
* Angular chat interface
* Source tracking for retrieved content
* Real-time document ingestion status

---

## 🏗️ Tech Stack

### Frontend

* Angular 22
* TypeScript
* Angular Signals
* Reactive UI Components
* SCSS

### Backend

* Node.js
* Express
* Multer
* OpenAI SDK

### AI / RAG

* GPT-4o
* OpenAI Embeddings
* Retrieval-Augmented Generation (RAG)
* Cosine Similarity Search

---

## 📂 Project Structure

```bash
RAG_model/
│
├── src/
│   ├── app/
│   │   ├── rag-chat/
│   │   │   ├── rag-chat.component.ts
│   │   │   ├── rag-chat.component.html
│   │   │   └── rag-chat.component.scss
│   │   │
│   │   ├── rag.service.ts
│   │   └── app.config.ts
│   │
│   └── main.ts
│
├── server-rag.js
├── package.json
└── .env
```

---

## ⚙️ Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd RAG_model
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
```

---

## ▶️ Running the Application

### Start Angular Frontend

```bash
npm start
```

Frontend runs on:

```bash
http://localhost:4200
```

### Start Backend Server

```bash
node server-rag.js
```

Backend runs on:

```bash
http://localhost:3000
```

---

## 📄 Document Ingestion Flow

1. User uploads PDF or text files.
2. Backend extracts document content.
3. Content is split into chunks.
4. Embeddings are generated using OpenAI.
5. Chunks are stored in memory.
6. Documents become searchable immediately.

---

## 💬 Query Flow

1. User asks a question.
2. Question embedding is generated.
3. Cosine similarity search finds relevant chunks.
4. Top matching chunks are selected.
5. Context is sent to GPT-4o.
6. AI returns an answer based only on uploaded documents.

---

## 🔍 API Endpoints

### Upload Documents

```http
POST /api/ingest
```

Content-Type:

```http
multipart/form-data
```

Request:

```bash
files[]
```

Response:

```json
{
  "success": true,
  "chunksIndexed": 42
}
```

---

### Ask Questions

```http
POST /api/query
```

Request:

```json
{
  "question": "What is Retrieval Augmented Generation?"
}
```

Response:

```json
{
  "answer": "...",
  "sources": [
    {
      "filename": "document.pdf"
    }
  ]
}
```

---

## 🧠 How RAG Works

### Step 1 – Document Upload

Documents are uploaded and converted into plain text.

### Step 2 – Chunking

Large documents are split into smaller chunks.

### Step 3 – Embeddings

Each chunk is converted into a vector representation using:

```text
text-embedding-3-small
```

### Step 4 – Retrieval

When a question is asked:

* Question embedding is created
* Similar chunks are retrieved
* Most relevant context is selected

### Step 5 – Generation

GPT-4o receives:

* User question
* Retrieved context

and generates a grounded answer.

---

## 🔒 Current Limitations

* In-memory vector storage
* Data resets when server restarts
* No user authentication
* No persistent database
* No conversation memory

---

## 🚧 Future Improvements

* FAISS Vector Database
* Pinecone Integration
* ChromaDB Support
* Streaming Responses
* Chat History Persistence
* Authentication & User Accounts
* Source Highlighting
* Multi-document Collections
* Hybrid Search
* Reranking Models

---

## 📈 Learning Objectives

This project demonstrates:

* Retrieval-Augmented Generation (RAG)
* OpenAI Embeddings
* Semantic Search
* Vector Similarity Search
* Angular Signals
* File Upload Handling
* Express API Development
* AI-Powered Applications

---

## 👨‍💻 Author

**Jaydeep Kaushik**

Frontend Developer | Angular Developer | AI & RAG Enthusiast

Skills:

* Angular
* TypeScript
* RxJS
* OpenAI APIs
* RAG Systems
* LLM Applications
* Modern Web Development

---

Made with ❤️ using Angular, Node.js, and OpenAI.
