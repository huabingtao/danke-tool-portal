'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PortalCard from '@/components/PortalCard';
import Footer from '@/components/Footer';
import { PORTAL_ITEMS } from '@/data/portalConfig';
import { Compass, Star, Layers } from 'lucide-react';

export default function Home() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load saved favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('danke_portal_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter((item) => item !== id)
      : [...favorites, id];

    setFavorites(updated);
    try {
      localStorage.setItem('danke_portal_favorites', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Separate favorites & regular items
  const favoriteItems = PORTAL_ITEMS.filter((item) => favorites.includes(item.id));

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      {/* Glow Background Light Spots */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-glow-blue pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-glow-emerald pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-glow-amber pointer-events-none" />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10">
        {/* Favorites Section (If any) */}
        {favoriteItems.length > 0 && (
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Star className="w-4 h-4 fill-current" />
              <h2 className="text-sm font-extrabold text-slate-200 tracking-wide uppercase">
                我的常用快捷收藏 ({favoriteItems.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteItems.map((item) => (
                <PortalCard
                  key={`fav-${item.id}`}
                  item={item}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main Projects Grid */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400">
              <Layers className="w-4 h-4" />
              <h2 className="text-sm font-extrabold text-slate-200 tracking-wide uppercase">
                跳板入口 ({PORTAL_ITEMS.length})
              </h2>
            </div>
          </div>

          {PORTAL_ITEMS.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center space-y-3 border border-white/5">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">暂无可见项目</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PORTAL_ITEMS.map((item) => (
                <PortalCard
                  key={item.id}
                  item={item}
                  isFavorite={favorites.includes(item.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
