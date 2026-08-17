/** Thin API helpers for MongoDB-backed persistence */
import { apiUrl } from './baseUrl';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(url), {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface AppDataPayload {
  books: unknown[];
  borrowRecords: unknown[];
  saleRecords: unknown[];
  arrivals: unknown[];
  assets: unknown[];
  logs: unknown[];
}

export const api = {
  getData: () => request<AppDataPayload>('/api/data'),
  resetData: () => request<{ success: boolean }>('/api/data/reset', { method: 'POST' }),

  saveBook: (book: unknown) =>
    request('/api/books', { method: 'POST', body: JSON.stringify(book) }),
  updateBook: (book: { id: string }) =>
    request(`/api/books/${book.id}`, { method: 'PUT', body: JSON.stringify(book) }),
  deleteBook: (id: string) => request(`/api/books/${id}`, { method: 'DELETE' }),
  saveBooksBatch: (books: unknown[]) =>
    request('/api/books/batch', { method: 'POST', body: JSON.stringify(books) }),

  saveBorrow: (record: unknown) =>
    request('/api/borrow-records', { method: 'POST', body: JSON.stringify(record) }),
  updateBorrow: (record: { id: string }) =>
    request(`/api/borrow-records/${record.id}`, { method: 'PUT', body: JSON.stringify(record) }),

  saveSale: (record: unknown) =>
    request('/api/sale-records', { method: 'POST', body: JSON.stringify(record) }),
  updateSale: (record: { id: string }) =>
    request(`/api/sale-records/${record.id}`, { method: 'PUT', body: JSON.stringify(record) }),
  deleteSale: (id: string) => request(`/api/sale-records/${id}`, { method: 'DELETE' }),

  saveArrival: (record: unknown) =>
    request('/api/book-arrivals', { method: 'POST', body: JSON.stringify(record) }),
  updateArrival: (record: { id: string }) =>
    request(`/api/book-arrivals/${record.id}`, { method: 'PUT', body: JSON.stringify(record) }),
  deleteArrival: (id: string) =>
    request(`/api/book-arrivals/${id}`, { method: 'DELETE' }),

  saveAsset: (asset: unknown) =>
    request('/api/office-assets', { method: 'POST', body: JSON.stringify(asset) }),
  updateAsset: (asset: { id: string }) =>
    request(`/api/office-assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(asset) }),
  deleteAsset: (id: string) => request(`/api/office-assets/${id}`, { method: 'DELETE' }),

  saveLog: (log: unknown) =>
    request('/api/activity-logs', { method: 'POST', body: JSON.stringify(log) }),

  uploadFile: async (file: File, kind: string, uploadedBy?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('kind', kind);
    if (uploadedBy) form.append('uploadedBy', uploadedBy);
    const res = await fetch(apiUrl('/api/files'), {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    return res.json() as Promise<{
      id: string;
      fileName: string;
      mimeType: string;
      size: number;
      uploadedAt: string;
      uploadedBy?: string;
      kind: string;
    }>;
  },

  parseInvoice: (fileId: string) =>
    request<{
      textPreview: string;
      arrivalDate?: string;
      paymentStatus?: 'Paid' | 'Unpaid' | 'Partial';
      invoiceNo?: string;
      items: Array<{
        bookId: string;
        bookTitle: string;
        bookIsbn: string;
        quantity: number;
        unitCost: number;
        confidence: 'high' | 'medium';
      }>;
      note?: string;
    }>(`/api/files/${fileId}/parse-invoice`, { method: 'POST' }),

  fileUrl: (id: string) => apiUrl(`/api/files/${id}`),
};
