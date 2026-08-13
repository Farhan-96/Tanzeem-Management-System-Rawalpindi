import React, { useState, useEffect } from 'react';
import { Receipt, X, Plus, Trash2, DollarSign, AlertCircle, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Book } from '../../types';

interface SellBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBook?: Book | null;
  openPrintInvoiceModal?: (saleRecord: any) => void;
}

interface SaleCartItem {
  bookId: string;
  bookTitle: string;
  maxStock: number;
  unitPrice: number;
  quantity: number;
}

export const SellBookModal: React.FC<SellBookModalProps> = ({ isOpen, onClose, preselectedBook }) => {
  const { books, createBookSale } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [unitName, setUnitName] = useState('Central Office');
  const [discount, setDiscount] = useState<number | ''>(0);
  const [initialPayment, setInitialPayment] = useState<number | ''>(0);
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [cartItems, setCartItems] = useState<SaleCartItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setCustomerName('');
    setCustomerPhone('');
    setDiscount(0);
    setInitialPayment(0);
    setRemarks('');
    setErrorMessage('');
    setCartItems([]);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
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
      } else if (books.length > 0 && cartItems.length === 0) {
        const firstAvailable = books.find((b) => b.totalQuantity > 0);
        if (firstAvailable) {
          setCartItems([
            {
              bookId: firstAvailable.id,
              bookTitle: firstAvailable.title,
              maxStock: firstAvailable.totalQuantity,
              unitPrice: firstAvailable.price,
              quantity: 1,
            },
          ]);
          setInitialPayment(firstAvailable.price);
        }
      }

      // Set default 15-day payment due date
      const due = new Date();
      due.setDate(due.getDate() + 15);
      setPaymentDueDate(due.toISOString().split('T')[0]);
    }
  }, [isOpen, preselectedBook]);

  if (!isOpen) return null;

  const handleAddCartItem = () => {
    const available = books.find((b) => !cartItems.some((item) => item.bookId === b.id) && b.totalQuantity > 0);
    if (available) {
      setCartItems((prev) => [
        ...prev,
        {
          bookId: available.id,
          bookTitle: available.title,
          maxStock: available.totalQuantity,
          unitPrice: available.price,
          quantity: 1,
        },
      ]);
    }
  };

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
                maxStock: selectedBook.totalQuantity,
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

    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one book to the sale order.');
      return;
    }
    if (!customerName || !unitName) {
      setErrorMessage('Please enter person name and unit name.');
      return;
    }

    const result = createBookSale({
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
    });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
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
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900 font-serif">Create Permanent Book Sale (Purpose 2)</h3>
          </div>
          <button
            type="button"
            id="close-sell-modal-btn"
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

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer & Unit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Customer / Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="sale-customer-name-input"
                type="text"
                required
                placeholder="e.g. Sheikh Zayd Al-Mansoor"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
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
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center space-x-1">
                <ShoppingCart className="w-3.5 h-3.5 text-amber-600" />
                <span>Books to Sell (1 or Multiple)</span>
              </span>
              <button
                type="button"
                id="add-more-book-to-sale-btn"
                onClick={handleAddCartItem}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                + Add Another Book
              </button>
            </div>

            {cartItems.map((item, index) => (
              <div
                key={index}
                className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-2"
              >
                {/* Book Select */}
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-semibold text-slate-400 block uppercase">Book Name</label>
                  <select
                    value={item.bookId}
                    onChange={(e) => handleItemBookChange(index, e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    {books.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} (In Stock: {b.totalQuantity})
                      </option>
                    ))}
                  </select>
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
                  {willBePaid ? 'Paid' : 'Payment Remaining'}
                </span>
                <span className="font-extrabold text-rose-700">
                  {remainingVal > 0 ? `Due: Rs. ${remainingVal.toLocaleString()}` : 'Full Clear'}
                </span>
              </div>
            </div>
          </div>

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

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              id="cancel-sell-modal-btn"
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
              id="submit-create-sale-btn"
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl shadow-md"
            >
              Complete Sale & Deduct Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
