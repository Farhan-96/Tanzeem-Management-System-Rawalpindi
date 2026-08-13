import React from 'react';
import {
  BookOpen,
  Building2,
  Receipt,
  RotateCcw,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Users,
  DollarSign,
  PackageCheck,
  PackageSearch,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookSaleRecord } from '../types';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  openAddBookModal: () => void;
  openSellBookModal: () => void;
  openBorrowModal: () => void;
  openAddAssetModal: () => void;
  openPrintInvoiceModal: (saleRecord: BookSaleRecord) => void;
  openCollectPaymentModal: (saleRecord: BookSaleRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  openAddBookModal,
  openSellBookModal,
  openBorrowModal,
  openAddAssetModal,
  openPrintInvoiceModal,
  openCollectPaymentModal,
}) => {
  const { currentUser, books, borrowRecords, saleRecords, assets, logs } = useApp();
  if (!currentUser) return null;

  // Metrics Calculations
  const totalBookTitles = books.length;
  const totalBookCopies = books.reduce((sum, b) => sum + b.totalQuantity, 0);
  const totalAvailableCopies = books.reduce((sum, b) => sum + b.availableQuantity, 0);
  const lowStockBooks = books.filter((b) => b.availableQuantity <= 5);

  const activeBorrows = borrowRecords.filter((r) => r.status === 'Active' || r.status === 'Overdue');
  const overdueBorrows = borrowRecords.filter((r) => r.status === 'Overdue');

  const totalSalesCount = saleRecords.length;
  const totalRevenue = saleRecords.reduce((sum, s) => sum + s.netAmount, 0);
  const totalPaidRevenue = saleRecords.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalPendingDues = saleRecords.reduce((sum, s) => sum + s.remainingAmount, 0);
  const pendingSalesCount = saleRecords.filter((s) => s.paymentStatus === 'Payment Remaining').length;

  const totalAssetsCount = assets.length;
  const totalAssetItems = assets.reduce((sum, a) => sum + a.quantity, 0);
  const workingAssetsCount = assets.filter((a) => a.status === 'Working').length;
  const damagedAssets = assets.filter((a) => a.status === 'Damaged' || a.status === 'Under Repair');

  return (
    <div className="space-y-6">
      {/* Welcome & Role Banner */}
      <div className="bg-[#003822] rounded-2xl p-6 text-white shadow-md border border-amber-500/30 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-13 h-13 rounded-full border-2 border-amber-400 shadow-md object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white font-serif">Welcome back, {currentUser.name}</h2>
                <span className="bg-amber-500 text-emerald-950 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-300 shadow-xs">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-emerald-200/90 text-xs mt-1 font-medium">
                {currentUser.department} &bull; Tanzeem Central Inventory, Sales Ledger & Office Records Management
              </p>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dash-add-book-btn"
              onClick={openAddBookModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold px-3.5 py-2 rounded-lg border border-emerald-700 shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>+ Add Book</span>
            </button>
            <button
              id="dash-sell-book-btn"
              onClick={openSellBookModal}
              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm border border-amber-300 transition-colors flex items-center space-x-1.5"
            >
              <Receipt className="w-4 h-4 text-emerald-950" />
              <span>+ Record Sale</span>
            </button>
            <button
              id="dash-borrow-btn"
              onClick={openBorrowModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold px-3.5 py-2 rounded-lg border border-emerald-700 shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>+ Issue Loan</span>
            </button>
            <button
              id="dash-add-asset-btn"
              onClick={openAddAssetModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold px-3.5 py-2 rounded-lg border border-emerald-700 shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>+ Add Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Book Inventory Metric */}
        <div
          onClick={() => setActiveTab('books')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Books</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{totalBookTitles} Titles</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>
                Available: <strong className="text-emerald-600 font-bold">{totalAvailableCopies}</strong> / {totalBookCopies}
              </span>
              <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                Manage <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Lending & Borrows Metric */}
        <div
          onClick={() => setActiveTab('lending')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Loans</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-black transition-colors">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{activeBorrows.length} Active</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span className={overdueBorrows.length > 0 ? 'text-rose-600 font-bold flex items-center' : ''}>
                {overdueBorrows.length > 0 ? (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {overdueBorrows.length} Overdue
                  </>
                ) : (
                  'All loans on schedule'
                )}
              </span>
              <span className="text-amber-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                View <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Sales & Outstanding Dues Metric */}
        <div
          onClick={() => setActiveTab('pending-dues')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Payments</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-rose-600">
              Rs. {totalPendingDues.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>
                <strong>{pendingSalesCount}</strong> Pending Records
              </span>
              <span className="text-rose-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                Dues <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>

        {/* Office Assets Metric */}
        <div
          onClick={() => setActiveTab('assets')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Office Assets</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{totalAssetsCount} Groups</div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
              <span>
                <strong className="text-emerald-600">{workingAssetsCount}</strong> Functional &bull;{' '}
                <strong className="text-rose-600">{damagedAssets.length}</strong> Repair
              </span>
              <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center">
                Assets <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview & Low Stock Alert Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Revenue & Collection Bar */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Financial Collections Summary</span>
              </h3>
              <p className="text-xs text-slate-500">Book sales, discounts given, and outstanding payment status</p>
            </div>
            <button
              id="dash-view-sales-tab"
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
            >
              <span>Sales Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales</div>
              <div className="text-xl font-bold text-slate-900 mt-1">Rs. {totalRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-slate-500 mt-1">{totalSalesCount} Invoices generated</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Collected Revenue</div>
              <div className="text-xl font-bold text-emerald-900 mt-1">Rs. {totalPaidRevenue.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-700 mt-1">
                {Math.round((totalPaidRevenue / (totalRevenue || 1)) * 100)}% payment collected
              </div>
            </div>
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Outstanding Balance</div>
              <div className="text-xl font-bold text-rose-800 mt-1">Rs. {totalPendingDues.toLocaleString()}</div>
              <div className="text-[11px] text-rose-700 mt-1">{pendingSalesCount} clients pending dues</div>
            </div>
          </div>

          {/* Payment Recovery Progress */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Payment Recovery Rate</span>
              <span>
                Rs. {totalPaidRevenue.toLocaleString()} / Rs. {totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((totalPaidRevenue / (totalRevenue || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Outstanding Unpaid Sales Quick Table */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Critical Pending Dues</span>
              <button
                id="view-all-dues-btn"
                onClick={() => setActiveTab('pending-dues')}
                className="text-indigo-600 text-xs font-semibold hover:underline"
              >
                View All Pending ({pendingSalesCount})
              </button>
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {saleRecords
                .filter((s) => s.paymentStatus === 'Payment Remaining')
                .slice(0, 3)
                .map((sale) => (
                  <div
                    key={sale.id}
                    role="button"
                    tabIndex={0}
                    id={`dash-pending-due-${sale.id}`}
                    onClick={() => openPrintInvoiceModal(sale)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openPrintInvoiceModal(sale);
                      }
                    }}
                    className="p-3 bg-white hover:bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{sale.customerName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          {sale.unitName}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Invoice #{sale.invoiceNo} &bull; Due: {sale.paymentDueDate || 'As agreed'}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                        {sale.items.map((it) => `${it.quantity}x ${it.bookTitle}`).join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-bold text-rose-700">Rs. {sale.remainingAmount.toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">Total: Rs. {sale.netAmount.toLocaleString()}</div>
                      </div>
                      <button
                        id={`dash-collect-${sale.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCollectPaymentModal(sale);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-[11px]"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                ))}
              {pendingSalesCount === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  {totalSalesCount === 0
                    ? 'No sales recorded yet. Create a book sale to track payments here.'
                    : 'All sales payments are fully paid up! No pending dues.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Column: Stock Alerts & Damaged Assets */}
        <div className="space-y-6">
          {/* Low Stock Books Alert Box */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Inventory Stock (<span className="font-mono font-normal">&le; 5</span>)</span>
            </h3>
            <div className="space-y-2.5">
              {lowStockBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 line-clamp-1">{book.title}</div>
                    <div className="text-[11px] text-slate-500">{book.author}</div>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {book.availableQuantity} in stock
                    </span>
                  </div>
                </div>
              ))}
              {lowStockBooks.length === 0 && (
                <div className="text-xs text-slate-500 py-3 text-center">
                  {totalBookTitles === 0 ? (
                    <>
                      <PackageSearch className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      No books in catalog yet. Add books to track inventory.
                      <button
                        type="button"
                        onClick={openAddBookModal}
                        className="mt-2 block mx-auto text-emerald-700 font-semibold hover:underline"
                      >
                        + Add Book
                      </button>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      All books have healthy stock levels.
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Damaged / Repair Office Assets Alert */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Damaged / Repair Assets</span>
              </h3>
              <button
                id="dash-assets-tab"
                onClick={() => setActiveTab('assets')}
                className="text-[11px] text-indigo-600 hover:underline font-semibold"
              >
                View
              </button>
            </div>
            <div className="space-y-2.5">
              {damagedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 line-clamp-1">{asset.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {asset.assetTag} &bull; {asset.location}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      asset.status === 'Damaged' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>
              ))}
              {damagedAssets.length === 0 && (
                <div className="text-xs text-slate-500 py-3 text-center">
                  {totalAssetsCount === 0 ? (
                    <>
                      <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      No office assets registered yet.
                      <button
                        type="button"
                        onClick={openAddAssetModal}
                        className="mt-2 block mx-auto text-emerald-700 font-semibold hover:underline"
                      >
                        + Add Asset
                      </button>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      All office equipment and assets are operational.
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Log Activity */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>System Activity Audit</span>
            </h3>
            <div className="space-y-3">
              {logs.slice(0, 3).map((log) => (
                <div key={log.id} className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{log.userName} ({log.userRole})</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <div className="text-slate-800 font-medium mt-0.5">{log.action}</div>
                  <div className="text-slate-500 text-[11px] truncate">{log.details}</div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-xs text-slate-500 py-3 text-center">
                  No activity yet. Actions you take will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
