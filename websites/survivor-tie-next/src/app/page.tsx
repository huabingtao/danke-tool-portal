'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { AdminPanel } from '../components/AdminPanel';
import { BatchLobby } from '../components/BatchLobby';
import { CabinRoom } from '../components/CabinRoom';
import { useStore } from '../store/useStore';

export default function Home() {
  const { isAdmin, batches } = useStore();
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<'lobby' | 'admin' | 'cabin'>('lobby');
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // React to mode change (Admin / Creator vs Player / View)
  useEffect(() => {
    if (!mounted) return;
    if (isAdmin) {
      if (currentView !== 'cabin') {
        setCurrentView('admin');
      }
    } else {
      if (currentView === 'admin') {
        setCurrentView('lobby');
      }
    }
  }, [isAdmin, mounted, currentView]);

  // Global custom event listeners for enterCabin and openAuthModal
  useEffect(() => {
    const handleOpenAuth = () => setIsAuthModalOpen(true);
    const handleEnterCabinEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const batchId =
        typeof customEvent.detail === 'string'
          ? customEvent.detail
          : customEvent.detail?.batchId;
      if (batchId) {
        setSelectedBatchId(batchId);
        setCurrentView('cabin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('openAuthModal', handleOpenAuth);
    window.addEventListener('enterCabin', handleEnterCabinEvent);

    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuth);
      window.removeEventListener('enterCabin', handleEnterCabinEvent);
    };
  }, []);

  const handleEnterCabin = (batchId: string) => {
    setSelectedBatchId(batchId);
    setCurrentView('cabin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackLobby = () => {
    setSelectedBatchId(null);
    setCurrentView(isAdmin ? 'admin' : 'lobby');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find the selected batch for CabinRoom
  const selectedBatch =
    batches.find((b) => b.id === selectedBatchId) || batches[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Navigation Bar */}
      <Header />

      {/* Main Container Area */}
      <main className="flex-1 app-container pb-12">
        {!mounted ? (
          /* Hydration loading fallback */
          <div className="py-20 text-center text-slate-400 animate-pulse">
            加载发车大厅中...
          </div>
        ) : currentView === 'cabin' && selectedBatch ? (
          /* Cabin Room View */
          <CabinRoom batch={selectedBatch} onBackLobby={handleBackLobby} />
        ) : isAdmin || currentView === 'admin' ? (
          /* Creator / Admin Panel View */
          <AdminPanel />
        ) : (
          /* Player / Batch Lobby View */
          <BatchLobby onEnterCabin={handleEnterCabin} />
        )}
      </main>

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
