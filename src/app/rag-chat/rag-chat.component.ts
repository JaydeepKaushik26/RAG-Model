import { Component, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
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
export class RagChatComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  question = '';
  messages = signal<Message[]>([]);
  loading = signal(false);
  ingesting = signal(false);
  ingestStatus = signal('');
  uploadedFiles = signal<string[]>([]);
  sidebarCollapsed = signal(false);
  isDragging = signal(false);
  inputFocused = signal(false);

  suggestions = [
    'Summarise this document',
    'What are the key points?',
    'What topics are covered?',
  ];

  constructor(private ragService: RagService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  ask() {
    const q = this.question.trim();
    if (!q || this.loading()) return;

    this.messages.update(m => [...m, { role: 'user', text: q }]);
    this.question = '';
    this.loading.set(true);

    this.ragService.query(q).subscribe({
      next: (res: QueryResponse) => {
        this.messages.update(m => [...m, { role: 'assistant', text: res.answer, sources: res.sources }]);
        this.loading.set(false);
      },
      error: () => {
        this.messages.update(m => [...m, { role: 'assistant', text: '⚠️ Could not reach the server. Is the backend running on port 3000?' }]);
        this.loading.set(false);
      },
    });
  }

  askSuggestion(q: string) {
    this.question = q;
    this.ask();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }

  autoResize(event: Event) {
    const el = event.target as HTMLTextAreaElement;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files?.length) this.processFiles(files);
  }

  onFileUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length) this.processFiles(files);
  }

  processFiles(files: FileList) {
    this.ingesting.set(true);
    this.ingestStatus.set('Uploading & indexing…');

    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('files', file));

    this.ragService.ingestFiles(formData).subscribe({
      next: res => {
        this.uploadedFiles.update(f => [...f, ...Array.from(files).map(f => f.name)]);
        this.ingestStatus.set(`✅ ${res.chunksIndexed} chunks indexed`);
        this.ingesting.set(false);
        setTimeout(() => this.ingestStatus.set(''), 3000);
      },
      error: () => {
        this.ingestStatus.set('❌ Upload failed — is the backend running?');
        this.ingesting.set(false);
      },
    });
  }

  clearChat() {
    this.messages.set([]);
  }
}