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

  saveAsset: (asset: unknown) =>
    request('/api/office-assets', { method: 'POST', body: JSON.stringify(asset) }),
  updateAsset: (asset: { id: string }) =>
    request(`/api/office-assets/${asset.id}`, { method: 'PUT', body: JSON.stringify(asset) }),
  deleteAsset: (id: string) => request(`/api/office-assets/${id}`, { method: 'DELETE' }),

  saveLog: (log: unknown) =>
    request('/api/activity-logs', { method: 'POST', body: JSON.stringify(log) }),
};
