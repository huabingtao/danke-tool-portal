import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '弹壳特工队 - 并列发车与攻略协作平台',
  description: 'Minimalist Art 风格的《弹壳特工队》并列发车组队、战力匹配与攻略协作平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased min-h-screen bg-dark-bg text-slate-100 flex flex-col">
        <header className="glass-header sticky top-0 z-50 py-4 mb-6">
          <div className="app-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                弹
              </div>
              <span className="text-xl font-bold tracking-tight text-gradient">
                弹壳特工队 · 并列发车平台
              </span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
              <a href="#" className="hover:text-blue-400 transition-colors">发车大厅</a>
              <a href="#" className="hover:text-blue-400 transition-colors">攻略中心</a>
              <a href="#" className="hover:text-blue-400 transition-colors">战力计算器</a>
            </nav>
          </div>
        </header>

        <main className="flex-1 app-container pb-12">
          {children}
        </main>

        <footer className="glass-header mt-auto py-6 text-center text-xs text-slate-500 border-t border-slate-800">
          <div className="app-container">
            <p>© 2026 弹壳特工队并列发车平台 · Minimalist Art Edition</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
