import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, AlertCircle, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Book, BookSaleRecord, StoredAttachment } from '../../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { AttachmentPicker } from '../AttachmentPicker';
import { BookNameSearch } from '../BookNameSearch';

interface SellBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBook?: Book | null;
  saleToEdit?: BookSaleRecord | null;
  openPrintInvoiceModal?: (saleRecord: BookSaleRecord) => void;
}

interface SaleCartItem {
  bookId: string;
  bookTitle: string;
  maxStock: number;
  unitPrice: number;
  quantity: number;
}

export const SellBookModal: React.FC<SellBookModalProps> = ({
  isOpen,
  onClose,
  preselectedBook,
  saleToEdit,
  openPrintInvoiceModal,
}) => {
  const { books, saleRecords, createBookSale, updateBookSale, currentUser } = useApp();
  const isEditMode = Boolean(saleToEdit);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [unitName, setUnitName] = useState('Central Office');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [initialPayment, setInitialPayment] = useState<number | ''>(0);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [cartItems, setCartItems] = useState<SaleCartItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentFiles, setPaymentFiles] = useState<StoredAttachment[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  const handleClose = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setInitialPayment(0);
    setRemarks('');
    setErrorMessage('');
    setCartItems([]);
    setPaymentFiles([]);
    setShowCustomerSuggestions(false);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');

    if (saleToEdit) {
      setCustomerName(saleToEdit.customerName);
      setCustomerPhone(saleToEdit.customerPhone || '');
      setUnitName(saleToEdit.unitName);
      setDiscount(saleToEdit.discount);
      setInitialPayment(saleToEdit.paidAmount);
      setPaymentDueDate(saleToEdit.paymentDueDate || '');
      setRemarks(saleToEdit.remarks || '');
      setCartItems(
        saleToEdit.items.map((item) => {
          const book = books.find((b) => b.id === item.bookId);
          const restored = item.quantity;
          return {
            bookId: item.bookId,
            bookTitle: item.bookTitle,
            maxStock: (book?.totalQuantity || 0) + restored,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          };
        })
      );
      return;
    }

    setCustomerName('');
    setCustomerPhone('');
    setUnitName('Central Office');
    setDiscount(0);
    setInitialPayment(0);
    setRemarks('');
    setCartItems([]);

    if (preselectedBook) {
      setCartItems([
        {
          bookId: preselectedBook.id,
          bookTitle: preselectedBook.title,
          maxStock: preselectedBook.totalQuantity,
          unitPrice: preselectedBook.price,
          quantity: 1,
        },
      ]);
      setInitialPayment(preselectedBook.price);
    } else {
      setCartItems([
        {
          bookId: '',
          bookTitle: '',
          maxStock: 0,
          unitPrice: 0,
          quantity: 1,
        },
      ]);
      setInitialPayment(0);
    }

    const due = new Date();
    due.setDate(due.getDate() + 15);
    setPaymentDueDate(due.toISOString().split('T')[0]);
  }, [isOpen, preselectedBook, saleToEdit]);

  if (!isOpen) return null;

  const restoredQtyFor = (bookId: string) =>
    saleToEdit?.items.find((item) => item.bookId === bookId)?.quantity || 0;

  const effectiveStock = (book: Book) => book.totalQuantity + restoredQtyFor(book.id);

  const handleAddCartItem = () => {
    setCartItems((prev) => [
      ...prev,
      {
        bookId: '',
        bookTitle: '',
        maxStock: 0,
        unitPrice: 0,
        quantity: 1,
      },
    ]);
  };

  const pastCustomers = Array.from(
    new Map(
      saleRecords.map((sale) => [
        `${sale.customerName.trim().toLowerCase()}|${sale.unitName.trim().toLowerCase()}`,
        {
          name: sale.customerName,
          phone: sale.customerPhone || '',
          unitName: sale.unitName,
        },
      ])
    ).values()
  );

  const customerQuery = customerName.trim().toLowerCase();
  const matchedCustomers = pastCustomers.filter((person) => {
    if (!customerQuery) return true;
    return (
      person.name.toLowerCase().includes(customerQuery) ||
      person.unitName.toLowerCase().includes(customerQuery) ||
      person.phone.includes(customerQuery)
    );
  });

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemBookChange = (index: number, newBookId: string) => {
    const selectedBook = books.find((b) => b.id === newBookId);
    if (selectedBook) {
      setCartItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                bookId: selectedBook.id,
                bookTitle: selectedBook.title,
                maxStock: effectiveStock(selectedBook),
                unitPrice: selectedBook.price,
                quantity: 1,
              }
            : item
        )
      );
    }
  };

  const handleItemQtyChange = (index: number, qty: number) => {
    setCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, Math.min(item.maxStock, qty)) } : item))
    );
  };

  const handleItemPriceChange = (index: number, price: number) => {
    setCartItems((prev) => prev.map((item, i) => (i === index ? { ...item, unitPrice: Math.max(0, price) } : item)));
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = Number(discount) || 0;
  const netTotal = Math.max(0, subtotal - discountVal);
  const paidVal = Number(initialPayment) || 0;
  const remainingVal = Math.max(0, netTotal - paidVal);
  const willBePaid = remainingVal <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (cartItems.length === 0 || cartItems.some((item) => !item.bookId)) {
      setErrorMessage('Please search and select at least one book.');
      return;
    }
    if (!customerName || !unitName) {
      setErrorMessage('Please enter person name and unit name.');
      return;
    }

    const result = isEditMode && saleToEdit
      ? updateBookSale(saleToEdit.id, {
          customerName,
          customerPhone,
          unitName,
          items: cartItems.map((i) => ({
            bookId: i.bookId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          discount: discountVal,
          paymentDueDate: remainingVal <= 0 ? undefined : paymentDueDate,
          remarks,
        })
      : createBookSale({
          customerName,
          customerPhone,
          unitName,
          items: cartItems.map((i) => ({
            bookId: i.bookId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          discount: discountVal,
          initialPayment: paidVal,
          paymentDueDate: willBePaid ? undefined : paymentDueDate,
          remarks,
          paymentAttachments: paymentFiles,
        });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    const createdSale = result.saleRecord;
    handleClose();
    if (!isEditMode && createdSale && openPrintInvoiceModal) {
      openPrintInvoiceModal(createdSale);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-2xl">
      <ModalHeader onClose={handleClose} closeId="close-sell-modal-btn">
        <div className="flex items-center space-x-2 min-w-0">
          <Receipt className="w-5 h-5 text-amber-600 shrink-0" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
            {isEditMode ? `Update Sale ${saleToEdit?.invoiceNo}` : 'Record Book Sale'}
          </h3>
        </div>
      </ModalHeader>

      {errorMessage && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {books.length === 0 ? (
        <>
          <ModalBody>
            <div className="text-center space-y-3 py-4">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">No books available to sell</p>
              <p className="text-xs text-slate-500">Add books to the catalog before creating a sale invoice.</p>
            </div>
          </ModalBody>
          <ModalFooter>
            <button
              type="button"
              onClick={handleClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800"
            >
              Close
            </button>
          </ModalFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 text-xs">
          <ModalBody className="space-y-4">
          {/* Customer & Unit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <label className="block font-semibold text-slate-700 mb-1">
                Customer / Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="sale-customer-name-input"
                type="text"
                required
                autoComplete="off"
                placeholder="Type to search or enter a name"
                value={customerName}
                onFocus={() => setShowCustomerSuggestions(true)}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setShowCustomerSuggestions(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowCustomerSuggestions(false), 150);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              {showCustomerSuggestions && matchedCustomers.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {matchedCustomers.slice(0, 12).map((person) => (
                    <button
                      key={`${person.name}-${person.unitName}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCustomerName(person.name);
                        setUnitName(person.unitName);
                        if (person.phone) setCustomerPhone(person.phone);
                        setShowCustomerSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-amber-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-semibold text-slate-800">{person.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {person.unitName}
                        {person.phone ? ` · ${person.phone}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Unit / Branch Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="sale-unit-name-input"
                type="text"
                required
                placeholder="e.g. Rawalpindi Regional Center"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                placeholder="+92 301 5551212"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono"
              />
            </div>
          </div>

          {/* Book Items Cart (Supports 1 or Many books) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2 sticky top-0 z-10 bg-slate-50 pb-1">
              <span className="font-bold text-slate-800 flex items-center space-x-1">
                <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                <span>Books to Sell ({cartItems.length})</span>
              </span>
              <button
                type="button"
                id="add-more-book-to-sale-btn"
                onClick={handleAddCartItem}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
              >
                + Add Another Book
              </button>
            </div>

            <div className="space-y-2.5">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-2"
              >
                {/* Book Select */}
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-semibold text-slate-400 block uppercase">Book Name</label>
                  <BookNameSearch
                    books={books}
                    selectedBookId={item.bookId}
                    excludeIds={cartItems.map((row) => row.bookId).filter(Boolean)}
                    getStock={effectiveStock}
                    placeholder="Type book name to search..."
                    onSelect={(book) => handleItemBookChange(index, book.id)}
                  />
                </div>

                {/* Price */}
                <div className="w-full sm:w-28">
                  <label className="text-[10px] font-semibold text-slate-400 block uppercase">Price (Rs.)</label>
                  <input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => handleItemPriceChange(index, Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  />
                </div>

                {/* Quantity */}
                <div className="w-full sm:w-20">
                  <label className="text-[10px] font-semibold text-slate-400 block uppercase">Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={item.maxStock}
                    value={item.quantity}
                    onChange={(e) => handleItemQtyChange(index, Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-amber-800"
                  />
                </div>

                {/* Item Line Total */}
                <div className="w-full sm:w-28 text-right">
                  <label className="text-[10px] font-semibold text-slate-400 block uppercase">Line Total</label>
                  <span className="font-extrabold text-slate-900 block py-1">
                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>

                {/* Delete button if > 1 item */}
                {cartItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCartItem(index)}
                    className="p-1 text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            </div>

            <button
              type="button"
              onClick={handleAddCartItem}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold text-amber-800 bg-white border border-dashed border-amber-300 hover:bg-amber-50 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Another Book
            </button>
          </div>

          {/* Pricing Summary & Payment Status Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subtotal Value</label>
              <div className="p-2.5 bg-slate-100 rounded-xl font-extrabold text-slate-900">
                Rs. {subtotal.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount (Rs.)</label>
              <input
                id="sale-discount-input"
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Net Payable Amount</label>
              <div className="p-2.5 bg-amber-100 border border-amber-300 text-amber-950 rounded-xl font-extrabold text-sm">
                Rs. {netTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Payment Collected & Due Date logic */}
          {isEditMode ? (
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900">Already collected</span>
                <span className="font-extrabold text-emerald-800">Rs. {saleToEdit?.paidAmount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Remaining due updates automatically from the new total. Use Collect Payment to add more money later.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
            <div>
              <label className="block font-semibold text-amber-900 mb-1">
                Amount Paid Now (Rs.) <span className="text-rose-500">*</span>
              </label>
              <input
                id="sale-paid-amount-input"
                type="number"
                min={0}
                max={netTotal}
                value={initialPayment}
                onChange={(e) => setInitialPayment(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-xl font-bold text-emerald-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-amber-900 mb-1">Calculated Status & Remaining</label>
              <div className="p-2.5 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    willBePaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {willBePaid ? 'Paid' : 'Unpaid'}
                </span>
                <span className="font-extrabold text-rose-700">
                  {remainingVal > 0 ? `Due: Rs. ${remainingVal.toLocaleString()}` : 'Full Clear'}
                </span>
              </div>
            </div>
          </div>
          )}

          {!willBePaid && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Expected Payment Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="sale-payment-due-date"
                type="date"
                required
                value={paymentDueDate}
                onChange={(e) => setPaymentDueDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          )}

          {!isEditMode && (
            <AttachmentPicker
              label="Payment proof (PDF or image)"
              hint="Save bank slip, receipt, or screenshot showing paid / unpaid status."
              kind="payment-proof"
              value={paymentFiles}
              onChange={setPaymentFiles}
              uploadedBy={currentUser?.name}
            />
          )}

          {/* Remarks */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Note</label>
            <input
              type="text"
              placeholder="e.g. Bulk order discount applied by Finance Admin"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              id="cancel-sell-modal-btn"
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
              id="submit-create-sale-btn"
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl shadow-md"
            >
              {isEditMode ? 'Save Changes' : 'Save Sale'}
            </button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};
