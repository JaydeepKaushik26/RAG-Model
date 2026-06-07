import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RagService, QueryResponse } from '../rag.service';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: { filename?: string }[];
}

@Component({
  selector: 'app-rag-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rag-chat.component.html',
  styleUrls: ['./rag-chat.component.scss'],
})
export class RagChatComponent {
  question = '';
  messages = signal<Message[]>([]);
  loading = signal(false);
  ingesting = signal(false);
  ingestStatus = signal('');
  uploadedFiles = signal<string[]>([]);

  constructor(private ragService: RagService) {}

  ask() {
    const q = this.question.trim();
    if (!q || this.loading()) return;

    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.question = '';
    this.loading.set(true);

    this.ragService.query(q).subscribe({
      next: (res: QueryResponse) => {
        this.messages.update(m => [
          ...m,
          { role: 'assistant', text: res.answer, sources: res.sources },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update(m => [
          ...m,
          { role: 'assistant', text: '⚠️ Could not reach the server. Is the backend running?' },
        ]);
        this.loading.set(false);
      },
    });
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }

  onFileUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;

    this.ingesting.set(true);
    this.ingestStatus.set('Reading files...');

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    this.ingestStatus.set('Uploading & indexing...');
    this.ragService.ingestFiles(formData).subscribe({
      next: res => {
        this.uploadedFiles.update(f => [...f, ...Array.from(files).map(f => f.name)]);
        this.ingestStatus.set(`✅ Indexed ${res.chunksIndexed} chunks`);
        this.ingesting.set(false);
        setTimeout(() => this.ingestStatus.set(''), 3000);
      },
      error: (err) => {
        this.ingestStatus.set('❌ Ingestion failed — is backend running?');
        this.ingesting.set(false);
      },
    });
  }

  clearChat() {
    this.messages.set([]);
  }
}