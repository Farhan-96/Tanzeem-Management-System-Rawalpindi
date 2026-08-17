import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  Receipt,
  RotateCcw,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Users,
  AlertCircle,
  FileText,
  ChevronDown,
  RefreshCw,
  LogOut,
  PackagePlus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './modals/Modal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAddBookModal: () => void;
  openRecordArrivalModal: () => void;
  openSellBookModal: () => void;
  openBorrowModal: () => void;
  openAddAssetModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openAddBookModal,
  openRecordArrivalModal,
  openSellBookModal,
  openBorrowModal,
  openAddAssetModal,
}) => {
  const { currentUser, availableUsers, switchUserRole, books, borrowRecords, saleRecords, arrivalRecords, assets, resetAllData, logout } =
    useApp();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (!currentUser) return null;

  // Calculate quick notification counts
  const totalBooks = books.length;
  const activeBorrowsCount = borrowRecords.filter((r) => r.status === 'Active' || r.status === 'Overdue').length;
  const overdueBorrowsCount = borrowRecords.filter((r) => r.status === 'Overdue').length;
  const pendingPaymentsCount = saleRecords.filter((s) => s.paymentStatus === 'Payment Remaining').length;
  const unpaidArrivalsCount = arrivalRecords.filter((r) => r.paymentStatus !== 'Paid').length;
  const totalPendingAmount = saleRecords
    .filter((s) => s.paymentStatus === 'Payment Remaining')
    .reduce((sum, s) => sum + s.remainingAmount, 0);
  const damagedAssetsCount = assets.filter((a) => a.status === 'Damaged' || a.status === 'Under Repair').length;

  const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    Admin: { bg: 'bg-emerald-800', text: 'text-emerald-100', border: 'border-emerald-600' },
    Secretary: { bg: 'bg-amber-800', text: 'text-amber-100', border: 'border-amber-600' },
    'Finance Admin': { bg: 'bg-cyan-800', text: 'text-cyan-100', border: 'border-cyan-600' },
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Book Catalog', icon: BookOpen, badge: totalBooks },
    {
      id: 'lending',
      label: 'Issued Books',
      icon: RotateCcw,
      badge: activeBorrowsCount,
      alert: overdueBorrowsCount > 0,
    },
    { id: 'sales', label: 'Book Sales', icon: Receipt, badge: saleRecords.length },
    {
      id: 'arrivals',
      label: 'Book Arrivals',
      icon: PackagePlus,
      badge: arrivalRecords.length,
      highlight: unpaidArrivalsCount > 0,
    },
    {
      id: 'pending-dues',
      label: 'Pending Dues',
      icon: CreditCard,
      badge: pendingPaymentsCount,
      highlight: pendingPaymentsCount > 0,
    },
    { id: 'assets', label: 'Office Assets', icon: Building2, badge: assets.length, alert: damagedAssetsCount > 0 },
    { id: 'logs', label: 'Activity Log', icon: FileText },
  ];

  return (
    <header className="bg-[#003822] text-white border-b border-amber-500/30 shadow-md sticky top-0 z-30">
      {/* Top Organizational Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 border-b border-emerald-800/80 gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#002B1A] flex items-center justify-center text-amber-400 font-bold text-2xl border border-amber-500/40 shadow-inner">
              <span className="font-serif">ت</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight font-serif">
                  TANZEEM OFFICE & LIBRARY SYSTEM
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/30 font-semibold tracking-wide">
                  تنظیمِ اسلامی
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 tracking-wider uppercase font-medium">
                CENTRAL INVENTORY, SALES & RECORDS MANAGEMENT
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Quick Metrics Summary Pills */}
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-emerald-900/60 p-1.5 rounded-lg border border-emerald-800/80">
              <div className="px-2.5 py-1 bg-[#002B1A] rounded-md flex items-center space-x-1.5 text-emerald-200">
                <span className="text-emerald-400 font-medium">Books:</span>
                <span className="font-bold text-white">{totalBooks}</span>
              </div>
              <div className="px-2.5 py-1 bg-[#002B1A] rounded-md flex items-center space-x-1.5 text-amber-300">
                <span className="text-amber-400/90 font-medium">Pending Dues:</span>
                <span className="font-bold text-amber-300">Rs. {totalPendingAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="role-selector-button"
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-emerald-900/90 border border-amber-500/30 hover:bg-emerald-800 transition-all text-xs text-white shadow-xs"
              >
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-950 shrink-0 shadow-xs">
                  {currentUser.role.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold leading-tight text-white">{currentUser.name}</p>
                  <p className="text-[10px] text-amber-300 leading-none">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300 ml-0.5" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#002B1A] border border-amber-500/30 rounded-xl shadow-2xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-widest border-b border-emerald-800">
                    Account
                  </div>
                  <div className="px-3 py-2 text-emerald-100 border-b border-emerald-800">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-[10px] text-emerald-300/80">{currentUser.email}</div>
                    <div className="text-[10px] text-amber-300 mt-0.5">{currentUser.department}</div>
                  </div>
                  {availableUsers.length > 1 && (
                    <>
                      <div className="px-3 py-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-widest border-b border-emerald-800">
                        Switch Role
                      </div>
                      {availableUsers.map((user) => (
                        <button
                          key={user.id}
                          id={`switch-role-${user.role.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => {
                            switchUserRole(user.role);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-800/80 transition-colors ${
                            currentUser.role === user.role ? 'bg-emerald-800 text-amber-300 font-bold' : 'text-emerald-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-[10px] text-emerald-300/80">{user.department}</div>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#001D11] text-amber-300 border border-emerald-700 font-medium">
                            {user.role}
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                  <div className="border-t border-emerald-800 mt-1 pt-1 px-3">
                    <button
                      id="reset-demo-data-button"
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        setResetConfirmOpen(true);
                      }}
                      className="w-full text-left py-1.5 text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 text-[11px] font-medium"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Demo Seed Data</span>
                    </button>
                    <button
                      id="logout-button"
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left py-1.5 text-red-300 hover:text-red-200 flex items-center space-x-1.5 text-[11px] font-medium"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar & Navigation Tabs */}
        <div className="flex items-center justify-between pt-2.5 pb-2.5 overflow-x-auto gap-3">
          {/* Nav Tabs */}
          <nav className="flex space-x-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500 text-emerald-950 font-bold shadow-md'
                      : 'text-emerald-200 hover:bg-emerald-900/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-950' : 'text-emerald-300'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                        isActive
                          ? 'bg-emerald-950 text-amber-300'
                          : item.highlight
                          ? 'bg-amber-500 text-emerald-950 font-bold'
                          : item.alert
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-emerald-900 text-emerald-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action Buttons */}
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            <button
              id="header-add-book-btn"
              onClick={openAddBookModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Book</span>
            </button>
            <button
              id="header-record-arrival-btn"
              onClick={openRecordArrivalModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
            >
              <PackagePlus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Record Arrival</span>
            </button>
            <button
              id="header-sell-book-btn"
              onClick={openSellBookModal}
              className="bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold px-3 py-1.5 rounded-lg shadow-sm border border-amber-300 flex items-center space-x-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-950" />
              <span>+ Record Sale</span>
            </button>
            <button
              id="header-borrow-book-btn"
              onClick={openBorrowModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Lend Book</span>
            </button>
            <button
              id="header-add-asset-btn"
              onClick={openAddAssetModal}
              className="bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-medium transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>+ Add Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <Modal isOpen onClose={() => setResetConfirmOpen(false)} maxWidth="max-w-md">
          <ModalHeader onClose={() => setResetConfirmOpen(false)}>
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">Reset Demo Data</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-slate-600">
              Are you sure you want to restore the default sample books, sales, borrowings, and office assets? Any
              custom additions will be reset.
            </p>
          </ModalBody>
          <ModalFooter>
            <button
              id="cancel-reset-btn"
              onClick={() => setResetConfirmOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              id="confirm-reset-btn"
              onClick={() => {
                resetAllData();
                setResetConfirmOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
            >
              Confirm Reset
            </button>
          </ModalFooter>
        </Modal>
      )}
    </header>
  );
};
