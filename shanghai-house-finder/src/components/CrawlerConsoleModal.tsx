'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Loader2,
  Play,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { type ListingType, SHANGHAI_DISTRICTS } from '@/lib/db/schema';

interface CrawlJobItem {
  id: string;
  district: string;
  listing_type: string;
  status: string;
  crawled_count: number;
  enriched_poi_count: number;
  started_at: string;
  logs: string[];
}

interface CrawlerConsoleModalProps {
  open: boolean;
  onClose: () => void;
  onCrawlSuccess: () => void;
  amapKey: string;
  onChangeAmapKey: (key: string) => void;
}

export default function CrawlerConsoleModal({
  open,
  onClose,
  onCrawlSuccess,
  amapKey,
  onChangeAmapKey,
}: CrawlerConsoleModalProps) {
  const [district, setDistrict] = useState<string>('all');
  const [listingType, setListingType] = useState<'all' | ListingType>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [maxItems, setMaxItems] = useState<number>(6);
  const [running, setRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '系统就绪：已内置上海 16 行政区贝壳/链家二手房与新房采集通道 + 周边6类配套自动聚合引擎。',
  ]);
  const [recentJobs, setRecentJobs] = useState<CrawlJobItem[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/crawler')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.jobs)) {
          setRecentJobs(data.jobs);
          if (data.jobs[0]?.logs?.length) {
            setLogs(data.jobs[0].logs);
          }
        }
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const handleStartCrawl = async () => {
    setRunning(true);
    setLogs([
      `[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] 正在连接采集调度引擎，准备抓取房源及周边配套...`,
    ]);

    try {
      const res = await fetch('/api/crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district,
          listingType,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          maxItems,
          amapKey: amapKey || undefined,
        }),
      });
      const data = await res.json();
      if (data.result?.logs) {
        setLogs(data.result.logs);
      }
      if (Array.isArray(data.jobs)) {
        setRecentJobs(data.jobs);
      }
      onCrawlSuccess();
    } catch (err) {
      setLogs((prev) => [
        ...prev,
        `采集异常: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                上海市二手房与新房定向爬虫控制台
              </h2>
              <p className="text-xs text-slate-400">
                支持按上海 16 行政区与预算定向采集「户型图、实拍图、经纬度」并自动计算周边「地铁/公交/商超/医院/学校/公园」
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* 参数配置网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">目标行政区</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">上海市全部 16 区轮询</option>
                {SHANGHAI_DISTRICTS.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name}区 ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">采集房源类型</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as 'all' | ListingType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value="all">二手房 + 新房同步抓取</option>
                <option value="second_hand">仅抓取二手房 (sh.ke.com)</option>
                <option value="new_house">仅抓取新房楼盘 (sh.fang.ke.com)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">限定总价段 (万元)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="最低万"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="最高万"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">单次抓取房源数</label>
              <select
                value={maxItems}
                onChange={(e) => setMaxItems(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
              >
                <option value={4}>4 套 (极速模式)</option>
                <option value={6}>6 套 (标准推荐)</option>
                <option value={12}>12 套 (深度采集)</option>
                <option value={20}>20 套 (全区扫描)</option>
              </select>
            </div>
          </div>

          {/* 可选高德 Web API Key */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-semibold text-slate-200">
                可选：高德开放平台 Web 服务 Key
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                留空则默认使用内置上海空间 POI 库与轨交引擎（免配置直接可用）；填入 Key 可启用高德实时周边搜索与驾车路况规划。
              </p>
            </div>
            <input
              type="text"
              value={amapKey}
              onChange={(e) => onChangeAmapKey(e.target.value)}
              placeholder="选填：输入高德 Web API Key..."
              className="w-64 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* 实时控制台输出 */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>爬虫执行与周边配套聚合实时日志</span>
              </div>
              <button
                type="button"
                disabled={running}
                onClick={handleStartCrawl}
                className="px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {running ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>正在抓取入库...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>立即启动抓取任务</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 font-mono text-xs space-y-1.5 max-h-52 overflow-y-auto text-emerald-300/95">
              {logs.map((line, i) => (
                <div key={i} className="leading-relaxed">
                  {line}
                </div>
              ))}
            </div>
          </div>

          {/* 最近采集任务记录 */}
          {recentJobs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                <span>最近入库任务记录</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentJobs.slice(0, 4).map((job) => (
                  <div
                    key={job.id}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white">
                        区域：{job.district === 'all' ? '全上海' : job.district}
                      </span>
                      <span className="text-slate-400 ml-2">
                        ({job.listing_type === 'all' ? '二手+新房' : job.listing_type === 'new_house' ? '新房' : '二手房'})
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        入库 {job.crawled_count} 套房源 · 补齐 {job.enriched_poi_count} 个配套点位
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      已完成
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
