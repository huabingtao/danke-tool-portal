'use client';

import React from 'react';
import { Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="glass-panel border-t border-white/10 mt-16 py-8 px-4 sm:px-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200">DANKE PORTAL</span>
          <span>· 《弹壳特攻队》特工生态聚合导航中心</span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <span>用心打造专属战队跳板工具</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-current mx-1" />
          <span>© 2026 Survivor.io Fan Tools</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
