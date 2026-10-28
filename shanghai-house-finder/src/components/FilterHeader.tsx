'use client';

import React, { useState } from 'react';
import {
  Building2,
  Compass,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Train,
  SlidersHorizontal,
} from 'lucide-react';
import {
  type ListingFilterParams,
  type ListingType,
  SHANGHAI_COMMUTE_HUBS,
  SHANGHAI_DISTRICTS,
} from '@/lib/db/schema';

interface FilterHeaderProps {
  filters: ListingFilterParams;
  onUpdateFilters: (next: ListingFilterParams) => void;
  commuteDestination: string;
  onChangeDestination: (dest: string) => void;
  onOpenCrawlerModal: () => void;
  totalCount: number;
  secondHandCount: number;
  newHouseCount: number;
  avgTotalPrice: number;
  avgUnitPrice: number;
}

const TOTAL_PRICE_PRESETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: '不限总价' },
  { label: '350万内', max: 350 },
  { label: '350-600万', min: 350, max: 600 },
  { label: '600-900万', min: 600, max: 900 },
  { label: '900-1400万', min: 900, max: 1400 },
  { label: '1400万+', min: 1400 },
];

const UNIT_PRICE_PRESETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: '不限单价' },
  { label: '4.5万/㎡内', max: 45000 },
  { label: '4.5-7万/㎡', min: 45000, max: 70000 },
  { label: '7-10万/㎡', min: 70000, max: 100000 },
  { label: '10-13万/㎡', min: 100000, max: 130000 },
  { label: '13万/㎡+', min: 130000 },
];

export default function FilterHeader({
  filters,
  onUpdateFilters,
  commuteDestination,
  onChangeDestination,
  onOpenCrawlerModal,
  totalCount,
  secondHandCount,
  newHouseCount,
  avgTotalPrice,
  avgUnitPrice,
}: FilterHeaderProps) {
  const [minTotalInput, setMinTotalInput] = useState<string>(
    filters.minTotalPrice ? String(filters.minTotalPrice) : ''
  );
  const [maxTotalInput, setMaxTotalInput] = useState<string>(
    filters.maxTotalPrice ? String(filters.maxTotalPrice) : ''
  );
  const [minUnitInput, setMinUnitInput] = useState<string>(
    filters.minUnitPrice ? String(filters.minUnitPrice) : ''
  );
  const [maxUnitInput, setMaxUnitInput] = useState<string>(
    filters.maxUnitPrice ? String(filters.maxUnitPrice) : ''
  );
  const [keywordInput, setKeywordInput] = useState<string>(filters.keyword || '');
  const [customDestInput, setCustomDestInput] = useState<string>(commuteDestination);

  const applyTotalPriceRange = (minVal?: number, maxVal?: number) => {
    setMinTotalInput(minVal ? String(minVal) : '');
    setMaxTotalInput(maxVal ? String(maxVal) : '');
    onUpdateFilters({
      ...filters,
      minTotalPrice: minVal,
      maxTotalPrice: maxVal,
    });
  };

  const applyUnitPriceRange = (minVal?: number, maxVal?: number) => {
    setMinUnitInput(minVal ? String(minVal) : '');
    setMaxUnitInput(maxVal ? String(maxVal) : '');
    onUpdateFilters({
      ...filters,
      minUnitPrice: minVal,
      maxUnitPrice: maxVal,
    });
  };

  const handleManualPriceApply = () => {
    const minT = minTotalInput.trim() ? Number(minTotalInput) : undefined;
    const maxT = maxTotalInput.trim() ? Number(maxTotalInput) : undefined;
    const minU = minUnitInput.trim() ? Number(minUnitInput) : undefined;
    const maxU = maxUnitInput.trim() ? Number(maxUnitInput) : undefined;

    onUpdateFilters({
      ...filters,
      minTotalPrice: minT && minT > 0 ? minT : undefined,
      maxTotalPrice: maxT && maxT > 0 ? maxT : undefined,
      minUnitPrice: minU && minU > 0 ? minU : undefined,
      maxUnitPrice: maxU && maxU > 0 ? maxU : undefined,
      keyword: keywordInput.trim() || undefined,
    });
  };

  const handleResetAll = () => {
    setMinTotalInput('');
    setMaxTotalInput('');
    setMinUnitInput('');
    setMaxUnitInput('');
    setKeywordInput('');
    onUpdateFilters({
      listingType: 'all',
      district: 'all',
      rooms: undefined,
      minTotalPrice: undefined,
      maxTotalPrice: undefined,
      minUnitPrice: undefined,
      maxUnitPrice: undefined,
      keyword: undefined,
      sortBy: 'default',
    });
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 shadow-lg z-20">
      {/* 第一栏：品牌标题 + 统计速览 + 通勤终点 + 爬虫入口 */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white">
                上海全景找房工作台
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium">
                二手房 &amp; 新房双擎
              </span>
            </div>
            <p className="text-xs text-slate-400">
              覆盖上海16区 · 户型图/实拍图 · 地铁/公交/自驾三维通勤 · 商超/医院/学校/公园地图联动
            </p>
          </div>
        </div>

        {/* 实时筛选命中指标 */}
        <div className="hidden xl:flex items-center gap-4 bg-slate-800/70 px-3.5 py-1.5 rounded-xl border border-slate-700/70 text-xs">
          <div>
            <span className="text-slate-400">当前房源：</span>
            <span className="font-bold text-sky-400 text-sm">{totalCount}</span>
            <span className="text-slate-400 ml-1">
              套 (二手 {secondHandCount} / 新房 {newHouseCount})
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-700" />
          <div>
            <span className="text-slate-400">均总价：</span>
            <span className="font-semibold text-amber-400">{avgTotalPrice} 万</span>
          </div>
          <div className="h-3.5 w-px bg-slate-700" />
          <div>
            <span className="text-slate-400">均单价：</span>
            <span className="font-semibold text-emerald-400">
              {avgUnitPrice.toLocaleString()} 元/㎡
            </span>
          </div>
        </div>

        {/* 通勤目的地设定 & 爬虫按钮 */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
            <Train className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">通勤终点:</span>
            <select
              aria-label="选择常见通勤目的地"
              value={
                SHANGHAI_COMMUTE_HUBS.some((h) => h.name === commuteDestination)
                  ? commuteDestination
                  : 'custom'
              }
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setCustomDestInput(e.target.value);
                  onChangeDestination(e.target.value);
                }
              }}
              className="bg-transparent text-sky-300 font-medium focus:outline-none cursor-pointer"
            >
              {SHANGHAI_COMMUTE_HUBS.map((hub) => (
                <option key={hub.id} value={hub.name} className="bg-slate-900 text-slate-100">
                  {hub.name} ({hub.district})
                </option>
              ))}
              <option value="custom" className="bg-slate-900 text-slate-100">
                自定义地点...
              </option>
            </select>
            <input
              type="text"
              value={customDestInput}
              onChange={(e) => setCustomDestInput(e.target.value)}
              onBlur={() => {
                if (customDestInput.trim()) onChangeDestination(customDestInput.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customDestInput.trim()) {
                  onChangeDestination(customDestInput.trim());
                }
              }}
              placeholder="输入任意上海办公地..."
              className="w-28 bg-slate-900/80 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={onOpenCrawlerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>爬虫采数 / 增量更新</span>
          </button>
        </div>
      </div>

      {/* 第二栏：核心筛选区（总价区间输入 + 单价区间输入 + 二手房/新房切换 + 搜索） */}
      <div className="px-4 py-2.5 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center bg-slate-900/95">
        {/* 房源类型切换 + 关键词搜索 (占 3 列) */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 shrink-0">
            {(
              [
                { key: 'all', label: '全部' },
                { key: 'second_hand', label: '二手房' },
                { key: 'new_house', label: '新房' },
              ] as const
            ).map((tab) => {
              const active = (filters.listingType || 'all') === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    onUpdateFilters({
                      ...filters,
                      listingType: tab.key as 'all' | ListingType,
                    })
                  }
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualPriceApply();
              }}
              placeholder="搜小区/板块/学区/地铁..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 房价区间输入（总价：万元）(占 4.5 列) */}
        <div className="lg:col-span-4 flex flex-wrap items-center gap-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/80">
          <span className="text-xs font-semibold text-amber-400 whitespace-nowrap flex items-center gap-1">
            <Filter className="w-3 h-3" />
            总价区间(万):
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              aria-label="最低总价(万)"
              value={minTotalInput}
              onChange={(e) => setMinTotalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualPriceApply()}
              placeholder="最低万"
              className="w-18 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              aria-label="最高总价(万)"
              value={maxTotalInput}
              onChange={(e) => setMaxTotalInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualPriceApply()}
              placeholder="最高万"
              className="w-18 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400">万</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap ml-auto">
            {TOTAL_PRICE_PRESETS.slice(1, 5).map((preset) => {
              const isMatch =
                filters.minTotalPrice === preset.min && filters.maxTotalPrice === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyTotalPriceRange(preset.min, preset.max)}
                  className={`px-1.5 py-0.5 rounded text-[11px] transition cursor-pointer ${
                    isMatch
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 单价区间输入（单价：元/㎡）(占 4.5 列) */}
        <div className="lg:col-span-5 flex flex-wrap items-center gap-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/80">
          <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            单价区间(元/㎡):
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              aria-label="最低单价(元/㎡)"
              value={minUnitInput}
              onChange={(e) => setMinUnitInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualPriceApply()}
              placeholder="最低元/㎡"
              className="w-22 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="number"
              aria-label="最高单价(元/㎡)"
              value={maxUnitInput}
              onChange={(e) => setMaxUnitInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualPriceApply()}
              placeholder="最高元/㎡"
              className="w-22 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {UNIT_PRICE_PRESETS.slice(1, 4).map((preset) => {
              const isMatch =
                filters.minUnitPrice === preset.min && filters.maxUnitPrice === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyUnitPriceRange(preset.min, preset.max)}
                  className={`px-1.5 py-0.5 rounded text-[11px] transition cursor-pointer ${
                    isMatch
                      ? 'bg-emerald-500 text-slate-950 font-semibold'
                      : 'bg-slate-700/70 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={handleManualPriceApply}
              className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition cursor-pointer"
            >
              筛选
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              title="重置所有筛选条件"
              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 第三栏：上海 16 行政区快速定位 + 户型居室 + 排序控制 */}
      <div className="px-4 py-1.5 bg-slate-950/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <span className="text-slate-400 flex items-center gap-1 mr-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            行政区:
          </span>
          <button
            type="button"
            onClick={() => onUpdateFilters({ ...filters, district: 'all' })}
            className={`px-2 py-0.5 rounded-md transition shrink-0 cursor-pointer ${
              !filters.district || filters.district === 'all'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            全上海
          </button>
          {SHANGHAI_DISTRICTS.map((d) => {
            const active = filters.district === d.name;
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => onUpdateFilters({ ...filters, district: d.name })}
                className={`px-2 py-0.5 rounded-md transition shrink-0 cursor-pointer ${
                  active
                    ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* 居室筛选 */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">户型:</span>
            {[
              { val: undefined, label: '不限' },
              { val: 2, label: '二室' },
              { val: 3, label: '三室' },
              { val: 4, label: '四室+' },
            ].map((r) => {
              const active = filters.rooms === r.val;
              return (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => onUpdateFilters({ ...filters, rooms: r.val })}
                  className={`px-2 py-0.5 rounded transition cursor-pointer ${
                    active
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="房源排序方式"
              value={filters.sortBy || 'default'}
              onChange={(e) =>
                onUpdateFilters({
                  ...filters,
                  sortBy: e.target.value as ListingFilterParams['sortBy'],
                })
              }
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="default">默认综合排序</option>
              <option value="total_asc">总价：从低到高</option>
              <option value="total_desc">总价：从高到低</option>
              <option value="unit_asc">单价：从低到高</option>
              <option value="unit_desc">单价：从高到低</option>
              <option value="area_desc">面积：从大到小</option>
              <option value="subway_asc">地铁距离：由近及远</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
