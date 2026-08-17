import React, { useEffect, useRef, useState } from 'react';
import { PackagePlus, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Book, StoredAttachment } from '../../types';
import { api } from '../../api/client';
import { AttachmentPicker } from '../AttachmentPicker';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

interface RecordArrivalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordArrivalModal: React.FC<RecordArrivalModalProps> = ({ isOpen, onClose }) => {
  const { books, recordBookArrival, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [price, setPrice] = useState<number | ''>(0);
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Shelf A-01');
  const [language, setLanguage] = useState('');
  const [existingBookId, setExistingBookId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [quantity, setQuantity] = useState<number | ''>(1);
  const [unitCost, setUnitCost] = useState<number | ''>(0);
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [broughtBy, setBroughtBy] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'Paid' | 'Unpaid' | 'Partial'>('Unpaid');
  const [paidAmount, setPaidAmount] = useState<number | ''>(0);
  const [remarks, setRemarks] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [attachments, setAttachments] = useState<StoredAttachment[]>([]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [parseNote, setParseNote] = useState('');
  const [parsing, setParsing] = useState(false);
  const [matchedItems, setMatchedItems] = useState<Array<{ bookId: string; bookTitle: string; quantity: number; unitCost: number }>>([]);

  const titleFieldRef = useRef<HTMLDivElement>(null);
  const existingBook = existingBookId ? books.find((b) => b.id === existingBookId) : null;
  const qty = Number(quantity) || 0;
  const cost = Number(unitCost) || 0;
  const totalCost = qty * cost;

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
    setPrice(0);
    setIsbn('');
    setCategory('');
    setShelfLocation('Shelf A-01');
    setLanguage('');
    setExistingBookId(null);
    setShowSuggestions(false);
    setQuantity(1);
    setUnitCost(0);
    setArrivalDate(new Date().toISOString().split('T')[0]);
    setBroughtBy('');
    setPaymentChoice('Unpaid');
    setPaidAmount(0);
    setRemarks('');
    setErrorMessage('');
    setAttachments([]);
    setInvoiceNo('');
    setParseNote('');
    setParsing(false);
    setMatchedItems([]);
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
    setIsbn(book.isbn);
    setCategory(book.category);
    setShelfLocation(book.shelfLocation);
    setLanguage(book.language);
    setUnitCost(book.price);
    setShowSuggestions(false);
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
    if (isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    if (paymentChoice === 'Paid') setPaidAmount(totalCost);
    if (paymentChoice === 'Unpaid') setPaidAmount(0);
  }, [paymentChoice, totalCost]);

  const isMulti = matchedItems.length > 1;

  const applyInvoiceParse = async (file: StoredAttachment) => {
    if (!file.mimeType.includes('pdf')) {
      setParseNote('Image stored with this arrival. Fill the book details below.');
      return;
    }
    setParsing(true);
    try {
      const parsed = await api.parseInvoice(file.id);
      setParseNote(parsed.note || '');
      if (parsed.arrivalDate) setArrivalDate(parsed.arrivalDate);
      if (parsed.paymentStatus) setPaymentChoice(parsed.paymentStatus);
      if (parsed.invoiceNo) setInvoiceNo(parsed.invoiceNo);
      if (parsed.items.length === 1) {
        const item = parsed.items[0];
        const book = books.find((b) => b.id === item.bookId);
        if (book) fillFromBook(book);
        setQuantity(item.quantity);
        setUnitCost(item.unitCost);
        setMatchedItems([]);
      } else if (parsed.items.length > 1) {
        setMatchedItems(
          parsed.items.map((item) => ({
            bookId: item.bookId,
            bookTitle: item.bookTitle,
            quantity: item.quantity,
            unitCost: item.unitCost,
          }))
        );
      }
    } catch {
      setParseNote('Invoice file is saved. Could not auto-read the PDF — fill details manually.');
    } finally {
      setParsing(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!broughtBy.trim()) {
      setErrorMessage('Please enter who brought the books (kaun laya).');
      return;
    }
    if (!arrivalDate) {
      setErrorMessage('Please enter the arrival date.');
      return;
    }

    if (isMulti) {
      const grandTotal = matchedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
      for (const item of matchedItems) {
        const itemTotal = item.quantity * item.unitCost;
        const itemPaid =
          paymentChoice === 'Paid'
            ? itemTotal
            : paymentChoice === 'Unpaid'
            ? 0
            : grandTotal > 0
            ? Math.round(((Number(paidAmount) || 0) * itemTotal) / grandTotal)
            : 0;
        const result = recordBookArrival({
          bookId: item.bookId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          paidAmount: itemPaid,
          arrivalDate,
          broughtBy: broughtBy.trim(),
          remarks: remarks.trim(),
          attachments,
          invoiceNo: invoiceNo.trim() || undefined,
        });
        if (!result.success) {
          setErrorMessage(result.message);
          return;
        }
      }
      handleClose();
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter or select a book title.');
      return;
    }
    if (!qty || qty < 1) {
      setErrorMessage('Quantity received must be at least 1.');
      return;
    }

    const amountPaid =
      paymentChoice === 'Paid' ? totalCost : paymentChoice === 'Unpaid' ? 0 : Number(paidAmount) || 0;

    const result = recordBookArrival({
      bookId: existingBook?.id,
      newBook: existingBook
        ? undefined
        : {
            title: title.trim(),
            author: author.trim(),
            publisher: publisher.trim(),
            price: Number(price) || cost,
            totalQuantity: qty,
            isbn: isbn.trim(),
            category: category.trim(),
            shelfLocation: shelfLocation.trim() || 'Shelf A-01',
            language: language.trim(),
          },
      quantity: qty,
      unitCost: cost,
      paidAmount: amountPaid,
      arrivalDate,
      broughtBy: broughtBy.trim(),
      remarks: remarks.trim(),
      attachments,
      invoiceNo: invoiceNo.trim() || undefined,
    });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    handleClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-xl">
      <ModalHeader onClose={handleClose} closeId="close-record-arrival-modal-btn">
        <div className="flex items-center space-x-2 min-w-0">
          <PackagePlus className="w-5 h-5 shrink-0 text-emerald-700" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
            Record Book Arrival
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
          <AttachmentPicker
            label="Supplier invoice / receipt"
            hint="Upload the PDF invoice. Matching catalog titles are filled in automatically. The file is stored with this record."
            kind="invoice"
            value={attachments}
            uploadedBy={currentUser?.name}
            onChange={async (next) => {
              setAttachments(next);
              const newest = next[next.length - 1];
              if (newest && !attachments.some((item) => item.id === newest.id)) {
                await applyInvoiceParse(newest);
              }
            }}
          />
          {parsing && (
            <p className="text-[11px] text-emerald-800 flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Reading invoice and matching catalog books…
            </p>
          )}
          {parseNote && <p className="text-[11px] text-emerald-800 font-medium">{parseNote}</p>}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Invoice / Bill Number</label>
            <input
              type="text"
              placeholder="Filled from PDF when found, or type it here"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {isMulti && (
            <div className="rounded-xl border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-900">
                Matched catalog books from invoice
              </div>
              <div className="divide-y divide-slate-100">
                {matchedItems.map((item, index) => (
                  <div key={item.bookId} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-3 font-semibold text-slate-800">{item.bookTitle}</div>
                    <div>
                      <label className="text-[10px] text-slate-500">Qty</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          setMatchedItems((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, quantity: Number(e.target.value) || 1 } : row
                            )
                          )
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500">Unit cost</label>
                      <input
                        type="number"
                        min={0}
                        value={item.unitCost}
                        onChange={(e) =>
                          setMatchedItems((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, unitCost: Number(e.target.value) || 0 } : row
                            )
                          )
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => setMatchedItems((prev) => prev.filter((_, i) => i !== index))}
                        className="text-[11px] text-rose-600 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isMulti && (
          <div className="space-y-4">
          <div ref={titleFieldRef} className="relative">
            <label className="block font-semibold text-slate-700 mb-1">
              Book Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required={!isMulti}
              autoComplete="off"
              placeholder="Type to search catalog or enter a new title..."
              value={title}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setTitle(e.target.value);
                if (existingBookId) setExistingBookId(null);
                setShowSuggestions(true);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            {showSuggestions && books.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                {filteredBooks.length === 0 ? (
                  <p className="px-3 py-2.5 text-slate-500">No matching title — a new catalog record will be created.</p>
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
                Existing title selected — quantity below will be added to current stock ({existingBook.totalQuantity} copies).
              </p>
            )}
            {!existingBook && title.trim() && (
              <p className="mt-1.5 text-[11px] text-amber-700 font-medium">
                New title — author, publisher, category, and language are optional.
              </p>
            )}
          </div>

          {!existingBook && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Israr Ahmad"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Publisher Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Markazi Anjuman"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
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
                    placeholder="e.g. Urdu"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Quantity Received <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Cost (Rs.)</label>
              <input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              />
            </div>
          </div>
          </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Arrival Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Cost</label>
              <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-800 font-bold">
                Rs.{' '}
                {(isMulti
                  ? matchedItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
                  : totalCost
                ).toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Who Brought the Books (Kaun Laya) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Name of person / courier / supplier who delivered"
              value={broughtBy}
              onChange={(e) => setBroughtBy(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Payment Status <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['Paid', 'Unpaid', 'Partial'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setPaymentChoice(status)}
                  className={`flex-1 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    paymentChoice === status
                      ? status === 'Paid'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : status === 'Unpaid'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-amber-500 text-emerald-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {paymentChoice === 'Partial' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount Paid Now (Rs.)</label>
              <input
                type="number"
                min={0}
                max={totalCost}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-semibold"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Condition of books, bill number, extra notes..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              rows={2}
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            id="cancel-record-arrival-btn"
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
            id="submit-record-arrival-btn"
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md"
          >
            Save Arrival
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
