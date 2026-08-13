import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Book } from '../../types';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose }) => {
  const { books, addBook, updateBook } = useApp();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [price, setPrice] = useState<number | ''>(1000);
  const [totalQuantity, setTotalQuantity] = useState<number | ''>(5);
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Shelf A-01');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [existingBookId, setExistingBookId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const titleFieldRef = useRef<HTMLDivElement>(null);

  const existingBook = existingBookId ? books.find((b) => b.id === existingBookId) : null;

  const filteredBooks = books.filter((b) => {
    if (!title.trim()) return true;
    const q = title.trim().toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setTitle('');
    setAuthor('');
    setPublisher('');
    setPrice(1000);
    setTotalQuantity(5);
    setIsbn('');
    setCategory('');
    setLanguage('');
    setDescription('');
    setExistingBookId(null);
    setShowSuggestions(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fillFromBook = (book: Book) => {
    setExistingBookId(book.id);
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher);
    setPrice(book.price);
    setTotalQuantity(1);
    setIsbn(book.isbn);
    setCategory(book.category);
    setShelfLocation(book.shelfLocation);
    setLanguage(book.language);
    setDescription(book.description || '');
    setShowSuggestions(false);
  };

  const clearExistingSelection = () => {
    setExistingBookId(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showSuggestions) {
          setShowSuggestions(false);
          return;
        }
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (titleFieldRef.current && !titleFieldRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !publisher || !category.trim() || !language.trim() || price === '' || totalQuantity === '') return;

    const qty = Number(totalQuantity);
    if (qty < 1) return;

    if (existingBook) {
      updateBook({
        ...existingBook,
        title,
        author,
        publisher,
        price: Number(price),
        totalQuantity: existingBook.totalQuantity + qty,
        availableQuantity: existingBook.availableQuantity + qty,
        isbn: isbn || existingBook.isbn,
        category: category.trim(),
        shelfLocation,
        language: language.trim(),
        description,
      });
    } else {
      addBook({
        title,
        author,
        publisher,
        price: Number(price),
        totalQuantity: qty,
        isbn: isbn || `ISBN-978-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1 + Math.random() * 9)}`,
        category: category.trim(),
        shelfLocation,
        language: language.trim(),
        description,
      });
    }

    handleClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">
              {existingBook ? 'Add Stock to Existing Book' : 'Add New Book Record (Bulk or Single)'}
            </h3>
          </div>
          <button
            type="button"
            id="close-add-book-modal-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition-colors rounded-lg hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title with existing-book suggestions */}
          <div ref={titleFieldRef} className="relative">
            <label className="block font-semibold text-slate-700 mb-1">
              Book Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoComplete="off"
              placeholder="Type or select an existing book..."
              value={title}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setTitle(e.target.value);
                if (existingBookId) clearExistingSelection();
                setShowSuggestions(true);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            {showSuggestions && books.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredBooks.length === 0 ? (
                  <p className="px-3 py-2.5 text-slate-500">No matching books — a new record will be created.</p>
                ) : (
                  filteredBooks.map((book) => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => fillFromBook(book)}
                      className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-semibold text-slate-800">{book.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {book.author} · Stock: {book.availableQuantity}/{book.totalQuantity} · {book.isbn}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {existingBook && (
              <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">
                Existing book selected — quantity below will be added to current stock ({existingBook.totalQuantity} copies).
              </p>
            )}
          </div>

          {/* Author & Publisher Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Author Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Israr Ahmad"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Publisher Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Markazi Anjuman Khuddam-ul-Quran"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Price & Quantity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit Price (Rs.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="1000"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {existingBook ? 'Quantity to Add' : 'Initial Stock Quantity (Bulk or 1)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                placeholder="5"
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Unique Identifier / ISBN & Shelf Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unique Tracking Code / ISBN {existingBook ? '' : '(Auto-generated if empty)'}
              </label>
              <input
                type="text"
                placeholder="e.g. ISBN-978-969-586-001-2"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                readOnly={!!existingBook}
                className={`w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono ${
                  existingBook ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
                }`}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Shelf / Cabinet Location</label>
              <input
                type="text"
                placeholder="e.g. Shelf A-01"
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Category & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                required
                placeholder="e.g. Hadith Studies"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Language</label>
              <input
                type="text"
                required
                placeholder="e.g. Urdu"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Book Overview / Notes (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or catalog note..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-add-book-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-add-book-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
            >
              {existingBook ? 'Add Stock' : 'Save Book Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
