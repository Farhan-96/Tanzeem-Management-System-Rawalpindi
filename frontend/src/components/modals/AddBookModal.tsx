import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Book } from '../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: Book | null;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({ isOpen, onClose, bookToEdit }) => {
  const { books, addBook, updateBook } = useApp();
  const isEditMode = Boolean(bookToEdit);

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
  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');
    setShelfLocation('Shelf A-01');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const issuedCopies = bookToEdit
    ? Math.max(0, bookToEdit.totalQuantity - bookToEdit.availableQuantity)
    : 0;

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
    const handleClickOutside = (e: MouseEvent) => {
      if (titleFieldRef.current && !titleFieldRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (bookToEdit) {
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author);
      setPublisher(bookToEdit.publisher);
      setPrice(bookToEdit.price);
      setTotalQuantity(bookToEdit.totalQuantity);
      setIsbn(bookToEdit.isbn);
      setCategory(bookToEdit.category);
      setShelfLocation(bookToEdit.shelfLocation);
      setLanguage(bookToEdit.language);
      setDescription(bookToEdit.description || '');
      setExistingBookId(null);
      setShowSuggestions(false);
      setErrorMessage('');
    } else {
      resetForm();
    }
  }, [isOpen, bookToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title || !author || !publisher || !category.trim() || !language.trim() || price === '' || totalQuantity === '') return;

    const qty = Number(totalQuantity);
    if (qty < 1) {
      setErrorMessage('Stock quantity must be at least 1.');
      return;
    }

    const trimmedIsbn = isbn.trim();
    const isbnTaken = books.some(
      (b) =>
        trimmedIsbn &&
        b.isbn.trim().toLowerCase() === trimmedIsbn.toLowerCase() &&
        b.id !== (bookToEdit?.id || existingBook?.id)
    );
    if (isbnTaken) {
      setErrorMessage('This ISBN / tracking code is already used by another book.');
      return;
    }

    if (isEditMode && bookToEdit) {
      if (qty < issuedCopies) {
        setErrorMessage(
          `Total stock cannot be less than ${issuedCopies} issued cop${issuedCopies === 1 ? 'y' : 'ies'}.`
        );
        return;
      }

      updateBook({
        ...bookToEdit,
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        price: Number(price),
        totalQuantity: qty,
        availableQuantity: qty - issuedCopies,
        isbn: trimmedIsbn || bookToEdit.isbn,
        category: category.trim(),
        shelfLocation: shelfLocation.trim() || bookToEdit.shelfLocation,
        language: language.trim(),
        description: description.trim(),
      });
    } else if (existingBook) {
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
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-xl">
      <ModalHeader onClose={handleClose} closeId="close-add-book-modal-btn">
        <div className="flex items-center space-x-2 min-w-0">
          <BookOpen className={`w-5 h-5 shrink-0 ${isEditMode ? 'text-amber-600' : 'text-emerald-700'}`} />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
            {isEditMode
              ? 'Update Book Record'
              : existingBook
              ? 'Add Stock to Existing Book'
              : 'Add New Book'}
          </h3>
        </div>
      </ModalHeader>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <ModalBody className="space-y-4">
          {/* Title with existing-book suggestions */}
          <div ref={titleFieldRef} className="relative">
            <label className="block font-semibold text-slate-700 mb-1">
              Book Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoComplete="off"
              placeholder={isEditMode ? 'Book title' : 'Type or select an existing book...'}
              value={title}
              onFocus={() => {
                if (!isEditMode) setShowSuggestions(true);
              }}
              onChange={(e) => {
                setTitle(e.target.value);
                if (existingBookId) clearExistingSelection();
                if (!isEditMode) setShowSuggestions(true);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            {!isEditMode && showSuggestions && books.length > 0 && (
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

            {isEditMode && bookToEdit && (
              <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
                Editing catalog record · {issuedCopies} cop{issuedCopies === 1 ? 'y' : 'ies'} currently issued
                {issuedCopies > 0 ? ` · available will become ${Math.max(0, Number(totalQuantity || 0) - issuedCopies)}` : ''}.
              </p>
            )}

            {!isEditMode && existingBook && (
              <p className="mt-1.5 text-[11px] text-emerald-700 font-medium">
                Existing book selected — quantity below will be added to current stock ({existingBook.totalQuantity} copies).
              </p>
            )}
          </div>

          {/* Author & Publisher Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Author Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Dr. Israr Ahmad"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Publisher Name (Optional)</label>
              <input
                type="text"
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
                {isEditMode
                  ? 'Total Stock Quantity'
                  : existingBook
                  ? 'Quantity to Add'
                  : 'Starting Quantity'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={isEditMode ? Math.max(issuedCopies, 1) : 1}
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
                Unique Tracking Code / ISBN {isEditMode || existingBook ? '' : '(Auto-generated if empty)'}
              </label>
              <input
                type="text"
                placeholder="e.g. ISBN-978-969-586-001-2"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                readOnly={!isEditMode && !!existingBook}
                className={`w-full p-2.5 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono ${
                  !isEditMode && existingBook ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50 focus:bg-white'
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
              <label className="block font-semibold text-slate-700 mb-1">Category (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Hadith Studies"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Language (Optional)</label>
              <input
                type="text"
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

        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            id="cancel-add-book-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            id={isEditMode ? 'submit-edit-book-btn' : 'submit-add-book-btn'}
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
          >
            {isEditMode ? 'Save Changes' : existingBook ? 'Add Stock' : 'Save Book'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
