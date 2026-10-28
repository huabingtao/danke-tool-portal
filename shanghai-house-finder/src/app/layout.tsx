import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '上海全景找房工作台 | 上海市二手房与新房可视化检索系统',
  description:
    '支持总价区间与单价区间过滤、上海市16区二手房与新房爬虫采集、高清户型图与房屋实拍图画廊、地铁/公交/自驾三维交通测算及商超/医院/学校/公园地图联动。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
