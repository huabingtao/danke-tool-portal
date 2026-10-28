import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InkFlow AI - 智能内容创作与微信排版工作台',
  description: 'Local-First 架构的微信公众号长文与短视频脚本 AI 创作排版工作台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
