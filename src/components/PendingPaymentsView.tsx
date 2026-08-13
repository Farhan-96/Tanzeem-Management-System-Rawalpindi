import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  DollarSign,
  AlertCircle,
  Building,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  Printer,
  FileText,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookSaleRecord } from '../types';

interface PendingPaymentsViewProps {
  openCollectPaymentModal: (saleRecord: BookSaleRecord) => void;
  openPrintInvoiceModal: (saleRecord: BookSaleRecord) => void;
}

export const PendingPaymentsView: React.FC<PendingPaymentsViewProps> = ({
  openCollectPaymentModal,
  openPrintInvoiceModal,
}) => {
  const { saleRecords } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only sales with "Payment Remaining"
  const pendingSales = saleRecords.filter((s) => s.paymentStatus === 'Payment Remaining');

  const filteredPendingSales = pendingSales.filter((s) => {
    return (
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.unitName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(searchTerm))
    );
  });

  // Calculate stats
  const totalPendingBalance = pendingSales.reduce((sum, s) => sum + s.remainingAmount, 0);
  const totalOriginalNet = pendingSales.reduce((sum, s) => sum + s.netAmount, 0);
  const totalCollectedPartially = pendingSales.reduce((sum, s) => sum + s.paidAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 rounded-2xl p-6 text-white shadow-xl border border-amber-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold font-serif text-amber-100">Outstanding Payments Tracker (Purpose 3)</h2>
            <span className="text-xs font-bold bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full">
              {pendingSales.length} Active Pending Dues
            </span>
          </div>
          <p className="text-xs text-amber-200/80 mt-1">
            Complete records of clients and organizational units with remaining payment balances.
          </p>
        </div>

        {/* Total Outstanding Dues Counter */}
        <div className="bg-amber-950/80 p-3.5 rounded-xl border border-amber-600/50 text-right shrink-0">
          <div className="text-[10px] uppercase font-bold text-amber-300">Total Unpaid Dues Balance</div>
          <div className="text-2xl font-extrabold text-amber-400">Rs. {totalPendingBalance.toLocaleString()}</div>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase">Original Net Sales Value</span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">Rs. {totalOriginalNet.toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-emerald-50/30">
          <span className="text-xs font-semibold text-emerald-800 uppercase">Partially Received Dues</span>
          <div className="text-lg font-bold text-emerald-900 mt-0.5">Rs. {totalCollectedPartially.toLocaleString()}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/30">
          <span className="text-xs font-semibold text-amber-800 uppercase">Remaining Dues Receivable</span>
          <div className="text-lg font-bold text-amber-900 mt-0.5">Rs. {totalPendingBalance.toLocaleString()}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="pending-dues-search-input"
            type="text"
            placeholder="Search pending record by customer name, unit name, phone, or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600 transition-all"
          />
        </div>
      </div>

      {/* Complete Data List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-amber-50/70 text-amber-900 font-semibold uppercase tracking-wider border-b border-amber-200">
              <tr>
                <th className="p-3.5">Customer & Unit Name</th>
                <th className="p-3.5">Invoice # & Date</th>
                <th className="p-3.5">Books Included</th>
                <th className="p-3.5">Net Amount</th>
                <th className="p-3.5">Paid So Far</th>
                <th className="p-3.5">Remaining Balance</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Collect Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPendingSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-amber-50/30 transition-colors">
                  {/* Customer */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-amber-700" />
                      <span>{sale.customerName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                      <Building className="w-3 h-3 text-slate-400" />
                      <span>{sale.unitName}</span>
                      {sale.customerPhone && <span className="text-slate-400">&bull; {sale.customerPhone}</span>}
                    </div>
                  </td>

                  {/* Invoice */}
                  <td className="p-3.5 font-mono font-semibold text-slate-800">
                    <div>{sale.invoiceNo}</div>
                    <div className="text-[10px] text-slate-400">{sale.saleDate}</div>
                  </td>

                  {/* Items */}
                  <td className="p-3.5">
                    <div className="space-y-0.5 text-slate-700 font-medium">
                      {sale.items.map((it, idx) => (
                        <div key={idx} className="line-clamp-1">
                          {it.quantity}x {it.bookTitle}
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Net Amount */}
                  <td className="p-3.5 font-bold text-slate-800">Rs. {sale.netAmount.toLocaleString()}</td>

                  {/* Paid So Far */}
                  <td className="p-3.5 font-semibold text-emerald-700">
                    Rs. {sale.paidAmount.toLocaleString()}
                  </td>

                  {/* Remaining Balance */}
                  <td className="p-3.5">
                    <div className="text-sm font-extrabold text-amber-800">
                      Rs. {sale.remainingAmount.toLocaleString()}
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="p-3.5 text-slate-600 font-medium">{sale.paymentDueDate || 'Not set'}</td>

                  {/* Action */}
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      id={`collect-due-${sale.id}`}
                      onClick={() => openCollectPaymentModal(sale)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-xs"
                    >
                      Collect Dues
                    </button>
                    <button
                      id={`print-due-receipt-${sale.id}`}
                      onClick={() => openPrintInvoiceModal(sale)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg inline-block"
                      title="Print Invoice Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPendingSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    No remaining payment dues found! All sales payments are fully clear.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
