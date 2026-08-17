import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import type { Book } from '../types';

interface BookNameSearchProps {
  books: Book[];
  selectedBookId: string;
  onSelect: (book: Book) => void;
  excludeIds?: string[];
  getStock?: (book: Book) => number;
  placeholder?: string;
  required?: boolean;
}

export const BookNameSearch: React.FC<BookNameSearchProps> = ({
  books,
  selectedBookId,
  onSelect,
  excludeIds = [],
  getStock,
  placeholder = 'Type to search book name...',
  required = true,
}) => {
  const selected = books.find((book) => book.id === selectedBookId);
  const [query, setQuery] = useState(selected?.title || '');
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.title || '');
  }, [selectedBookId, selected?.title]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fieldRef.current && !fieldRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.title || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selected?.title]);

  const q = query.trim().toLowerCase();
  const matches = books.filter((book) => {
    if (excludeIds.includes(book.id) && book.id !== selectedBookId) return false;
    const stock = getStock ? getStock(book) : book.totalQuantity;
    if (stock <= 0 && book.id !== selectedBookId) return false;
    if (!q) return true;
    return (
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q) ||
      book.isbn.toLowerCase().includes(q)
    );
  });

  return (
    <div ref={fieldRef} className="relative">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {matches.length === 0 ? (
            <p className="px-3 py-2.5 text-slate-500">No matching book in stock.</p>
          ) : (
            matches.slice(0, 40).map((book) => {
              const stock = getStock ? getStock(book) : book.totalQuantity;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    onSelect(book);
                    setQuery(book.title);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-amber-50 border-b border-slate-100 last:border-b-0 ${
                    book.id === selectedBookId ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="font-semibold text-slate-800">{book.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {book.author} · In stock: {stock} · {book.isbn}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
