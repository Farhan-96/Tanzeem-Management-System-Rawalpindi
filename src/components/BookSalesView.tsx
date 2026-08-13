import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Plus,
  DollarSign,
  Printer,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  User,
  Building,
  Calendar,
  FileText,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookSaleRecord } from '../types';

interface BookSalesViewProps {
  openSellBookModal: () => void;
  openCollectPaymentModal: (saleRecord: BookSaleRecord) => void;
  openPrintInvoiceModal: (saleRecord: BookSaleRecord) => void;
}

export const BookSalesView: React.FC<BookSalesViewProps> = ({
  openSellBookModal,
  openCollectPaymentModal,
  openPrintInvoiceModal,
}) => {
  const { saleRecords } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'All' | 'Paid' | 'Payment Remaining'>('All');
  const [detailSaleModal, setDetailSaleModal] = useState<BookSaleRecord | null>(null);

  const filteredSales = saleRecords.filter((sale) => {
    const matchesSearch =
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some((item) => item.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = paymentFilter === 'All' || sale.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 font-serif">Permanent Book Sales & Invoicing (Purpose 2)</h2>
            <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-200">
              {saleRecords.length} Total Sales
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sell 1 or multiple books in bulk or single orders. Handles custom discounts, payment statuses, and receipts.
          </p>
        </div>

        <button
          id="open-sell-modal-btn"
          onClick={openSellBookModal}
          className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Book Sale</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="sales-search-input"
            type="text"
            placeholder="Search invoice #, customer name, unit name, or book title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
          />
        </div>

        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
          {(['All', 'Paid', 'Payment Remaining'] as const).map((st) => (
            <button
              key={st}
              id={`filter-sale-status-${st.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setPaymentFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                paymentFilter === st ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Customer / Unit Name</th>
                <th className="p-3.5">Books Sold</th>
                <th className="p-3.5">Total / Net</th>
                <th className="p-3.5">Paid / Remaining</th>
                <th className="p-3.5">Payment Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((sale) => {
                const isPaid = sale.paymentStatus === 'Paid';

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Invoice */}
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-900">{sale.invoiceNo}</div>
                      <div className="text-[10px] text-slate-400">{sale.saleDate}</div>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{sale.customerName}</div>
                      <div className="text-[11px] text-emerald-800 font-medium flex items-center space-x-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>{sale.unitName}</span>
                      </div>
                    </td>

                    {/* Books */}
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="text-slate-800 font-medium line-clamp-1">
                            {it.quantity}x {it.bookTitle}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">Rs. {sale.netAmount.toLocaleString()}</div>
                      {sale.discount > 0 && (
                        <div className="text-[10px] text-emerald-700">Disc: -Rs. {sale.discount.toLocaleString()}</div>
                      )}
                    </td>

                    {/* Paid vs Remaining */}
                    <td className="p-3.5">
                      <div className="text-emerald-700 font-semibold">Paid: Rs. {sale.paidAmount.toLocaleString()}</div>
                      {sale.remainingAmount > 0 && (
                        <div className="text-rose-600 font-bold">Due: Rs. {sale.remainingAmount.toLocaleString()}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        <span>{sale.paymentStatus}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right space-x-1">
                      {!isPaid && (
                        <button
                          id={`collect-sale-pay-${sale.id}`}
                          onClick={() => openCollectPaymentModal(sale)}
                          className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
                        >
                          Collect Payment
                        </button>
                      )}
                      <button
                        id={`print-invoice-${sale.id}`}
                        onClick={() => openPrintInvoiceModal(sale)}
                        title="Print Receipt / Invoice"
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" />
                        Print
                      </button>
                      <button
                        id={`view-sale-detail-${sale.id}`}
                        onClick={() => setDetailSaleModal(sale)}
                        title="View Sale Details"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    {saleRecords.length === 0 ? (
                      <div className="space-y-2">
                        <p>No sales invoices yet.</p>
                        <button
                          type="button"
                          onClick={openSellBookModal}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg text-xs"
                        >
                          + Record First Sale
                        </button>
                      </div>
                    ) : (
                      'No sales invoice records found for current filters.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Popup */}
      {detailSaleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
                  Invoice {detailSaleModal.invoiceNo}
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-serif mt-1">{detailSaleModal.customerName}</h3>
                <p className="text-xs text-slate-500">Unit: {detailSaleModal.unitName}</p>
              </div>
              <button
                onClick={() => setDetailSaleModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="font-bold text-slate-800 block mb-2">Purchased Items:</span>
                <div className="space-y-1.5">
                  {detailSaleModal.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span>
                        {it.quantity}x {it.bookTitle}
                      </span>
                      <span className="font-semibold text-slate-800">
                        Rs. {(it.unitPrice * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div className="p-2 bg-slate-50 rounded-lg">
                  Subtotal: <strong className="text-slate-900">Rs. {detailSaleModal.subtotal.toLocaleString()}</strong>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg">
                  Discount: <strong className="text-slate-900">Rs. {detailSaleModal.discount.toLocaleString()}</strong>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900">
                  Paid Amount:{' '}
                  <strong className="text-emerald-800">Rs. {detailSaleModal.paidAmount.toLocaleString()}</strong>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-amber-900">
                  Remaining Due:{' '}
                  <strong className="text-amber-800">Rs. {detailSaleModal.remainingAmount.toLocaleString()}</strong>
                </div>
              </div>

              {detailSaleModal.paymentHistory.length > 0 && (
                <div className="mt-3">
                  <span className="font-bold text-slate-800 block mb-1">Payment Transactions History:</span>
                  <div className="space-y-1">
                    {detailSaleModal.paymentHistory.map((p) => (
                      <div key={p.id} className="p-2 bg-slate-50 rounded-lg text-[11px] flex justify-between">
                        <div>
                          <span className="font-semibold text-emerald-700">Rs. {p.amount.toLocaleString()}</span> &bull;{' '}
                          <span>Received by: {p.receivedBy}</span>
                          <span className="text-slate-400 block">{p.notes}</span>
                        </div>
                        <span className="text-slate-400">{p.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  const target = detailSaleModal;
                  setDetailSaleModal(null);
                  openPrintInvoiceModal(target);
                }}
                className="px-3 py-2 bg-slate-800 text-white font-semibold text-xs rounded-xl"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setDetailSaleModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
