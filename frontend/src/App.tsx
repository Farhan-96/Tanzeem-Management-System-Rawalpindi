/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { AuthPage } from './components/AuthPage';
import { DashboardView } from './components/DashboardView';
import { BookCatalogView } from './components/BookCatalogView';
import { BookLendingView } from './components/BookLendingView';
import { BookSalesView } from './components/BookSalesView';
import { BookArrivalsView } from './components/BookArrivalsView';
import { PendingPaymentsView } from './components/PendingPaymentsView';
import { OfficeAssetsView } from './components/OfficeAssetsView';
import { ActivityLogsView } from './components/ActivityLogsView';

import { AddBookModal } from './components/modals/AddBookModal';
import { RecordArrivalModal } from './components/modals/RecordArrivalModal';
import { BorrowBookModal } from './components/modals/BorrowBookModal';
import { SellBookModal } from './components/modals/SellBookModal';
import { CollectPaymentModal } from './components/modals/CollectPaymentModal';
import { AddAssetModal } from './components/modals/AddAssetModal';
import { PrintInvoiceModal } from './components/modals/PrintInvoiceModal';
import { Book, BookSaleRecord } from './types';

function MainAppContent() {
  const { isAuthenticated, authLoading, dataLoading } = useApp();

  // All hooks must run unconditionally (before any early return)
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [recordArrivalModalOpen, setRecordArrivalModalOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [addAssetModalOpen, setAddAssetModalOpen] = useState(false);
  const [collectPaymentModalOpen, setCollectPaymentModalOpen] = useState(false);
  const [printInvoiceModalOpen, setPrintInvoiceModalOpen] = useState(false);
  const [preselectedBook, setPreselectedBook] = useState<Book | null>(null);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);
  const [selectedSaleRecord, setSelectedSaleRecord] = useState<BookSaleRecord | null>(null);
  const [saleToEdit, setSaleToEdit] = useState<BookSaleRecord | null>(null);

  const openAddBookModal = () => {
    setBookToEdit(null);
    setAddBookModalOpen(true);
  };

  const openRecordArrivalModal = () => setRecordArrivalModalOpen(true);

  const openEditBookModal = (book: Book) => {
    setBookToEdit(book);
    setAddBookModalOpen(true);
  };

  const openBorrowModal = (book?: Book) => {
    setPreselectedBook(book || null);
    setBorrowModalOpen(true);
  };

  const openSellBookModal = (book?: Book) => {
    setSaleToEdit(null);
    setPreselectedBook(book || null);
    setSellModalOpen(true);
  };

  const openEditSaleModal = (sale: BookSaleRecord) => {
    setPreselectedBook(null);
    setSaleToEdit(sale);
    setSellModalOpen(true);
  };

  const openAddAssetModal = () => setAddAssetModalOpen(true);

  const openCollectPaymentModal = (saleRecord: BookSaleRecord) => {
    setSelectedSaleRecord(saleRecord);
    setCollectPaymentModalOpen(true);
  };

  const openPrintInvoiceModal = (saleRecord: BookSaleRecord) => {
    setSelectedSaleRecord(saleRecord);
    setPrintInvoiceModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8F5] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#003822] text-sm font-medium">
          <Loader2 className="w-5 h-5 animate-spin" />
          Checking authentication…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#F6F8F5] text-slate-900 font-sans antialiased flex flex-col selection:bg-amber-200 selection:text-emerald-950 print:min-h-0 print:h-auto print:block">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openAddBookModal={openAddBookModal}
        openRecordArrivalModal={openRecordArrivalModal}
        openSellBookModal={openSellBookModal}
        openBorrowModal={openBorrowModal}
        openAddAssetModal={openAddAssetModal}
      />

      {dataLoading && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 print:hidden">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Loading data from database…
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 print:hidden">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            openAddBookModal={openAddBookModal}
            openRecordArrivalModal={openRecordArrivalModal}
            openSellBookModal={openSellBookModal}
            openBorrowModal={openBorrowModal}
            openAddAssetModal={openAddAssetModal}
            openPrintInvoiceModal={openPrintInvoiceModal}
            openCollectPaymentModal={openCollectPaymentModal}
          />
        )}

        {activeTab === 'books' && (
          <BookCatalogView
            openAddBookModal={openAddBookModal}
            openEditBookModal={openEditBookModal}
            openSellBookModal={openSellBookModal}
            openBorrowModal={openBorrowModal}
          />
        )}

        {activeTab === 'lending' && <BookLendingView openBorrowModal={openBorrowModal} />}

        {activeTab === 'sales' && (
          <BookSalesView
            openSellBookModal={openSellBookModal}
            openEditSaleModal={openEditSaleModal}
            openCollectPaymentModal={openCollectPaymentModal}
            openPrintInvoiceModal={openPrintInvoiceModal}
          />
        )}

        {activeTab === 'arrivals' && (
          <BookArrivalsView openRecordArrivalModal={openRecordArrivalModal} />
        )}

        {activeTab === 'pending-dues' && (
          <PendingPaymentsView
            openCollectPaymentModal={openCollectPaymentModal}
            openPrintInvoiceModal={openPrintInvoiceModal}
            openEditSaleModal={openEditSaleModal}
          />
        )}

        {activeTab === 'assets' && <OfficeAssetsView openAddAssetModal={openAddAssetModal} />}

        {activeTab === 'logs' && <ActivityLogsView />}
      </main>

      <footer className="bg-[#002B1A] text-emerald-200/80 border-t border-emerald-900 text-xs py-4 text-center mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-white">Tanzeem Office & Library System</strong> &bull; Central Inventory, Sales & Asset Control
          </div>
          <div className="text-[11px] text-amber-300/80 font-medium">
            Official Theme inspired by tanzeem.org &bull; Role-Based Management System
          </div>
        </div>
      </footer>

      <AddBookModal
        isOpen={addBookModalOpen}
        onClose={() => {
          setAddBookModalOpen(false);
          setBookToEdit(null);
        }}
        bookToEdit={bookToEdit}
      />

      <RecordArrivalModal
        isOpen={recordArrivalModalOpen}
        onClose={() => setRecordArrivalModalOpen(false)}
      />

      <BorrowBookModal
        isOpen={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        preselectedBook={preselectedBook}
      />

      <SellBookModal
        isOpen={sellModalOpen}
        onClose={() => {
          setSellModalOpen(false);
          setSaleToEdit(null);
          setPreselectedBook(null);
        }}
        preselectedBook={preselectedBook}
        saleToEdit={saleToEdit}
        openPrintInvoiceModal={openPrintInvoiceModal}
      />

      <CollectPaymentModal
        isOpen={collectPaymentModalOpen}
        onClose={() => setCollectPaymentModalOpen(false)}
        saleRecord={selectedSaleRecord}
      />

      <AddAssetModal isOpen={addAssetModalOpen} onClose={() => setAddAssetModalOpen(false)} />

      <PrintInvoiceModal
        isOpen={printInvoiceModalOpen}
        onClose={() => setPrintInvoiceModalOpen(false)}
        saleRecord={selectedSaleRecord}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
