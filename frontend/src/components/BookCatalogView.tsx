import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  QrCode,
  Layers,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Receipt,
  RotateCcw,
  Tag,
  MapPin,
  Globe,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './modals/Modal';
import { ImportBooksModal } from './modals/ImportBooksModal';

interface BookCatalogViewProps {
  openAddBookModal: () => void;
  openEditBookModal: (book: Book) => void;
  openSellBookModal: (preselectedBook?: Book) => void;
  openBorrowModal: (preselectedBook?: Book) => void;
}

export const BookCatalogView: React.FC<BookCatalogViewProps> = ({
  openAddBookModal,
  openEditBookModal,
  openSellBookModal,
  openBorrowModal,
}) => {
  const { books, deleteBook, currentUser } = useApp();
  if (!currentUser) return null;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [viewDetailBook, setViewDetailBook] = useState<Book | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Extract unique categories and languages for filters
  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];
  const languages = ['All', ...Array.from(new Set(books.map((b) => b.language)))];

  // Filter books based on search term (title, author, publisher, ISBN)
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.shelfLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    const matchesLanguage = selectedLanguage === 'All' || book.language === selectedLanguage;

    return matchesSearch && matchesCategory && matchesLanguage;
  });

  const handleDelete = (book: Book) => {
    if (window.confirm(`Are you sure you want to remove "${book.title}" from catalog?`)) {
      deleteBook(book.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Book Catalog</h2>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {books.length} Books
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage bulk and single book stock levels, ISBN barcode identifiers, shelf location, pricing, and category records.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <button
            id="import-books-button"
            onClick={() => setImportModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs border border-emerald-200 transition-all flex items-center justify-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            id="add-new-book-button"
            onClick={openAddBookModal}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Add Book</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="book-search-input"
            type="text"
            placeholder="Search by book title, author, publisher, ISBN or shelf location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48 relative">
          <select
            id="book-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 appearance-none pr-8 cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                Category: {cat}
              </option>
            ))}
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>

        {/* Language Filter */}
        <div className="w-full sm:w-40 relative">
          <select
            id="book-language-filter"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 appearance-none pr-8 cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                Lang: {lang}
              </option>
            ))}
          </select>
          <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Book Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.map((book) => {
          const isAvailable = book.availableQuantity > 0;
          const isLowStock = book.availableQuantity > 0 && book.availableQuantity <= 5;

          return (
            <div
              key={book.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Book Card Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {book.category || 'Uncategorized'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isLowStock
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : isAvailable
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}
                  >
                    {isAvailable ? `${book.availableQuantity} Available` : 'Out of Stock'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 font-serif line-clamp-1">{book.title}</h3>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{book.author ? `By ${book.author}` : 'Author not specified'}</p>
                {book.publisher ? (
                  <p className="text-[11px] text-slate-400 mt-0.5">Publisher: {book.publisher}</p>
                ) : null}

                {/* Metadata Badges */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Unit Price</span>
                    <span className="font-extrabold text-slate-800">Rs. {book.price.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Stock Level</span>
                    <span className="font-bold text-slate-800">
                      {book.availableQuantity} / {book.totalQuantity} copies
                    </span>
                  </div>
                </div>

                {/* Identifier & Location */}
                <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-1.5 font-mono text-slate-700">
                    <QrCode className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{book.isbn}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{book.shelfLocation}</span>
                    </span>
                    <span className="text-slate-400">{book.language ? `Lang: ${book.language}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                <div className="flex items-center space-x-1">
                  <button
                    id={`issue-borrow-${book.id}`}
                    onClick={() => openBorrowModal(book)}
                    disabled={!isAvailable}
                    title="Lend this book"
                    className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs"
                  >
                    <RotateCcw className="w-3 h-3 text-amber-300" />
                    <span>Lend Book</span>
                  </button>
                  <button
                    id={`sell-book-${book.id}`}
                    onClick={() => openSellBookModal(book)}
                    disabled={!isAvailable}
                    title="Sell Book Permanently"
                    className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-emerald-950 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs"
                  >
                    <Receipt className="w-3 h-3" />
                    <span>Sell Book</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    id={`view-detail-${book.id}`}
                    onClick={() => setViewDetailBook(book)}
                    title="View Details"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <button
                    id={`edit-book-${book.id}`}
                    onClick={() => openEditBookModal(book)}
                    title="Update Book Record"
                    className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {currentUser.role === 'Admin' && (
                    <button
                      id={`delete-book-${book.id}`}
                      onClick={() => handleDelete(book)}
                      title="Delete Book"
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredBooks.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {books.length === 0 ? 'No books in catalog yet' : 'No books found matching criteria'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {books.length === 0
                ? 'Start by adding your first book title to the inventory.'
                : 'Try adjusting your search query, clearing filters, or adding new books to the inventory.'}
            </p>
            <button
              onClick={openAddBookModal}
              className="mt-4 px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800"
            >
              + Add First Book Record
            </button>
          </div>
        )}
      </div>

      {/* Book Detail Modal Popup */}
      {viewDetailBook && (
        <Modal isOpen onClose={() => setViewDetailBook(null)} maxWidth="max-w-lg">
          <ModalHeader onClose={() => setViewDetailBook(null)}>
            <div className="min-w-0">
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">
                {viewDetailBook.category || 'Uncategorized'}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif mt-1">{viewDetailBook.title}</h3>
              <p className="text-xs text-slate-500">{viewDetailBook.author ? `By ${viewDetailBook.author}` : 'Author not specified'}</p>
            </div>
          </ModalHeader>

          <ModalBody className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Publisher</span>
                  <span className="font-semibold text-slate-800">{viewDetailBook.publisher || '—'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Unique Identifier / ISBN</span>
                  <span className="font-mono font-bold text-emerald-800">{viewDetailBook.isbn}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Unit Price</span>
                  <span className="font-bold text-slate-800">Rs. {viewDetailBook.price.toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Stock Available</span>
                  <span className="font-bold text-emerald-700">
                    {viewDetailBook.availableQuantity} of {viewDetailBook.totalQuantity} copies
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Shelf Location</span>
                  <span className="font-semibold text-slate-800">{viewDetailBook.shelfLocation}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">Language</span>
                  <span className="font-semibold text-slate-800">{viewDetailBook.language || '—'}</span>
                </div>
              </div>

              {viewDetailBook.description && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase mb-1">Book Summary / Notes</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{viewDetailBook.description}</p>
                </div>
              )}
          </ModalBody>

          <ModalFooter>
            <button
              onClick={() => setViewDetailBook(null)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl"
            >
              Close
            </button>
            <button
              onClick={() => {
                const target = viewDetailBook;
                setViewDetailBook(null);
                openEditBookModal(target);
              }}
              className="w-full sm:w-auto px-3 py-2.5 bg-white border border-amber-300 text-amber-900 font-semibold text-xs rounded-xl"
            >
              Update Record
            </button>
            <button
              onClick={() => {
                const target = viewDetailBook;
                setViewDetailBook(null);
                openBorrowModal(target);
              }}
              className="w-full sm:w-auto px-3 py-2.5 bg-emerald-800 text-white font-semibold text-xs rounded-xl"
            >
              Lend Book
            </button>
            <button
              onClick={() => {
                const target = viewDetailBook;
                setViewDetailBook(null);
                openSellBookModal(target);
              }}
              className="w-full sm:w-auto px-3 py-2.5 bg-amber-500 text-emerald-950 font-bold text-xs rounded-xl"
            >
              Sell Book
            </button>
          </ModalFooter>
        </Modal>
      )}

      <ImportBooksModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} />
    </div>
  );
};
