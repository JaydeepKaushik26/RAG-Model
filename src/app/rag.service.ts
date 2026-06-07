import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IngestResponse {
  success: boolean;
  chunksIndexed: number;
}

export interface QueryResponse {
  answer: string;
  sources: { filename?: string; page?: number; [key: string]: any }[];
}

@Injectable({ providedIn: 'root' })
export class RagService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // New: send files as FormData (supports PDF, txt, md)
  ingestFiles(formData: FormData): Observable<IngestResponse> {
    return this.http.post<IngestResponse>(`${this.apiUrl}/ingest`, formData);
  }

  query(question: string, topK = 4): Observable<QueryResponse> {
    return this.http.post<QueryResponse>(`${this.apiUrl}/query`, { question, topK });
  }
}