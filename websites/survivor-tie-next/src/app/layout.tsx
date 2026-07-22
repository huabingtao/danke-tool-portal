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
        {children}
        <footer className="glass-header mt-auto py-6 text-center text-xs text-slate-500 border-t border-slate-800">
          <div className="app-container">
            <p>© 2026 弹壳特工队并列发车平台 · Minimalist Art Edition</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
