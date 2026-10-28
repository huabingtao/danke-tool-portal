'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bus,
  Car,
  Eye,
  GraduationCap,
  HeartPulse,
  LayoutGrid,
  ShoppingBag,
  Train,
  Trees,
} from 'lucide-react';
import FilterHeader from '@/components/FilterHeader';
import HouseMap from '@/components/HouseMap';
import ListingCardList from '@/components/ListingCardList';
import HouseDetailDrawer from '@/components/HouseDetailDrawer';
import CrawlerConsoleModal from '@/components/CrawlerConsoleModal';
import type {
  CommutePlanResult,
  CommunityPOIRecord,
  HouseListing,
  ListingFilterParams,
} from '@/lib/db/schema';

export default function ShanghaiHouseFinderPage() {
  const [filters, setFilters] = useState<ListingFilterParams>({
    listingType: 'all',
    district: 'all',
    sortBy: 'default',
  });
  const [listings, setListings] = useState<HouseListing[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    secondHandCount: 0,
    newHouseCount: 0,
    avgTotalPrice: 0,
    avgUnitPrice: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedListing, setSelectedListing] = useState<HouseListing | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false);
  const [crawlerModalOpen, setCrawlerModalOpen] = useState<boolean>(false);

  const [commuteDestination, setCommuteDestination] = useState<string>('陆家嘴金融城');
  const [commutePlan, setCommutePlan] = useState<CommutePlanResult | null>(null);
  const [activeCommuteMode, setActiveCommuteMode] = useState<'subway' | 'bus' | 'driving'>('subway');
  const [highlightedPoi, setHighlightedPoi] = useState<CommunityPOIRecord | null>(null);
  const [amapKey, setAmapKey] = useState<string>('');

  const fetchListings = useCallback(async (activeFilters: ListingFilterParams) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (activeFilters.minTotalPrice) qs.set('minTotalPrice', String(activeFilters.minTotalPrice));
      if (activeFilters.maxTotalPrice) qs.set('maxTotalPrice', String(activeFilters.maxTotalPrice));
      if (activeFilters.minUnitPrice) qs.set('minUnitPrice', String(activeFilters.minUnitPrice));
      if (activeFilters.maxUnitPrice) qs.set('maxUnitPrice', String(activeFilters.maxUnitPrice));
      if (activeFilters.listingType && activeFilters.listingType !== 'all') {
        qs.set('listingType', activeFilters.listingType);
      }
      if (activeFilters.district && activeFilters.district !== 'all') {
        qs.set('district', activeFilters.district);
      }
      if (activeFilters.rooms) qs.set('rooms', String(activeFilters.rooms));
      if (activeFilters.keyword) qs.set('keyword', activeFilters.keyword);
      if (activeFilters.sortBy) qs.set('sortBy', activeFilters.sortBy);

      const res = await fetch(`/api/listings?${qs.toString()}`);
      const data = await res.json();
      if (Array.isArray(data.listings)) {
        setListings(data.listings);
        setStats(
          data.stats || {
            totalCount: data.listings.length,
            secondHandCount: 0,
            newHouseCount: 0,
            avgTotalPrice: 0,
            avgUnitPrice: 0,
          }
        );
        setSelectedListing((prev) => {
          if (prev && data.listings.some((item: HouseListing) => item.id === prev.id)) {
            return data.listings.find((item: HouseListing) => item.id === prev.id) || data.listings[0] || null;
          }
          return data.listings[0] || null;
        });
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(filters);
  }, [filters, fetchListings]);

  // 当选中房源或通勤目的地变化时，实时请求地铁/公交/自驾三维通勤路线
  useEffect(() => {
    if (!selectedListing) {
      setCommutePlan(null);
      return;
    }
    const qs = new URLSearchParams({
      listingId: selectedListing.id,
      destination: commuteDestination,
    });
    if (amapKey) qs.set('amapKey', amapKey);

    fetch(`/api/commute?${qs.toString()}`)
      .then((r) => r.json())
      .then((plan) => {
        if (plan && plan.routes) {
          setCommutePlan(plan);
        }
      })
      .catch(() => {});
  }, [selectedListing?.id, commuteDestination, amapKey]);

  const handleSelectListing = (listing: HouseListing) => {
    setSelectedListing(listing);
    setHighlightedPoi(null);
  };

  const handleOpenDetail = (listing: HouseListing) => {
    setSelectedListing(listing);
    setDetailDrawerOpen(true);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100">
      {/* 顶部多维筛选栏：支持总价区间、单价区间、二手/新房、16区、通勤终点与爬虫入口 */}
      <FilterHeader
        filters={filters}
        onUpdateFilters={setFilters}
        commuteDestination={commuteDestination}
        onChangeDestination={setCommuteDestination}
        onOpenCrawlerModal={() => setCrawlerModalOpen(true)}
        totalCount={stats.totalCount}
        secondHandCount={stats.secondHandCount}
        newHouseCount={stats.newHouseCount}
        avgTotalPrice={stats.avgTotalPrice}
        avgUnitPrice={stats.avgUnitPrice}
      />

      {/* 主体联动工作区：左侧交互式找房地图 + 右侧房源列表与当前选中房源速览卡 */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* 左侧地图区 (占 58% 宽度) */}
        <div className="flex-1 lg:w-[58%] h-[46vh] lg:h-full relative border-b lg:border-b-0 lg:border-r border-slate-800">
          <HouseMap
            listings={listings}
            selectedListing={selectedListing}
            onSelectListing={handleSelectListing}
            commutePlan={commutePlan}
            activeCommuteMode={activeCommuteMode}
            onChangeCommuteMode={setActiveCommuteMode}
            highlightedPoi={highlightedPoi}
          />
        </div>

        {/* 右侧房源卡片与选中房源全维速览区 (占 42% 宽度) */}
        <div className="lg:w-[42%] h-[54vh] lg:h-full flex flex-col bg-slate-900/95 overflow-hidden">
          {/* 当前选中房源的户型图/实拍图/交通/配套精华速览条 */}
          {selectedListing && (
            <div className="p-3 bg-slate-950/95 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold shrink-0">
                    当前聚焦
                  </span>
                  <h2 className="text-xs font-bold text-white truncate">
                    {selectedListing.district}·{selectedListing.subDistrict} ·{' '}
                    {selectedListing.communityName} ({selectedListing.rooms} {selectedListing.area}㎡)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailDrawerOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer shadow"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>打开全景详情抽屉</span>
                </button>
              </div>

              {/* 户型图 + 实拍图 + 地铁/公交/自驾耗时 + 商超/医院/学校/公园微缩看板 */}
              <div className="grid grid-cols-12 gap-2.5 items-center">
                {/* 户型图与实拍双图直接预览 (占 4 列) */}
                <div
                  onClick={() => setDetailDrawerOpen(true)}
                  className="col-span-4 grid grid-cols-2 gap-1.5 cursor-pointer"
                >
                  <div className="relative h-16 rounded-lg overflow-hidden border border-slate-700 bg-white">
                    <img
                      src={selectedListing.floorPlans[0]?.url}
                      alt="户型图"
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-900/85 text-[9px] text-sky-300 text-center py-0.5 font-semibold">
                      标准户型图
                    </span>
                  </div>
                  <div className="relative h-16 rounded-lg overflow-hidden border border-slate-700 bg-slate-800">
                    <img
                      src={selectedListing.housePhotos[0]?.url}
                      alt="实拍图"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-900/85 text-[9px] text-amber-300 text-center py-0.5 font-semibold">
                      实拍图({selectedListing.housePhotos.length}张)
                    </span>
                  </div>
                </div>

                {/* 交通三方式 + 四大配套摘要 (占 8 列) */}
                <div className="col-span-8 space-y-1.5 text-[11px]">
                  {commutePlan && (
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveCommuteMode('subway')}
                        className={`px-2 py-1 rounded border flex items-center justify-between cursor-pointer ${
                          activeCommuteMode === 'subway'
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Train className="w-3 h-3 text-sky-400" />
                          地铁
                        </span>
                        <span>{commutePlan.routes.subway.durationMinutes}分</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCommuteMode('bus')}
                        className={`px-2 py-1 rounded border flex items-center justify-between cursor-pointer ${
                          activeCommuteMode === 'bus'
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Bus className="w-3 h-3 text-emerald-400" />
                          公交
                        </span>
                        <span>{commutePlan.routes.bus.durationMinutes}分</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveCommuteMode('driving')}
                        className={`px-2 py-1 rounded border flex items-center justify-between cursor-pointer ${
                          activeCommuteMode === 'driving'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-amber-400" />
                          自驾
                        </span>
                        <span>{commutePlan.routes.driving.durationMinutes}分</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-300">
                    <span className="truncate flex items-center gap-1">
                      <ShoppingBag className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      商超: {selectedListing.pois.mall[0]?.name} ({selectedListing.pois.mall[0]?.distance_meters}m)
                    </span>
                    <span className="truncate flex items-center gap-1">
                      <HeartPulse className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                      医院: {selectedListing.pois.hospital[0]?.name} ({selectedListing.pois.hospital[0]?.distance_meters}m)
                    </span>
                    <span className="truncate flex items-center gap-1">
                      <GraduationCap className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                      学校: {selectedListing.pois.school[0]?.name} ({selectedListing.pois.school[0]?.distance_meters}m)
                    </span>
                    <span className="truncate flex items-center gap-1">
                      <Trees className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                      公园: {selectedListing.pois.park[0]?.name} ({selectedListing.pois.park[0]?.distance_meters}m)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 房源列表滚动区 */}
          <div className="flex-1 overflow-y-auto">
            <ListingCardList
              listings={listings}
              selectedListing={selectedListing}
              onSelectListing={handleSelectListing}
              onOpenDetail={handleOpenDetail}
              loading={loading}
            />
          </div>
        </div>

        {/* 右侧滑出式房源全景详情抽屉 */}
        {detailDrawerOpen && selectedListing && (
          <HouseDetailDrawer
            listing={selectedListing}
            onClose={() => setDetailDrawerOpen(false)}
            commutePlan={commutePlan}
            activeCommuteMode={activeCommuteMode}
            onChangeCommuteMode={setActiveCommuteMode}
            onFocusPoiOnMap={(poi) => {
              setHighlightedPoi(poi);
            }}
          />
        )}
      </main>

      {/* 可视化爬虫控制台弹窗 */}
      <CrawlerConsoleModal
        open={crawlerModalOpen}
        onClose={() => setCrawlerModalOpen(false)}
        onCrawlSuccess={() => fetchListings(filters)}
        amapKey={amapKey}
        onChangeAmapKey={setAmapKey}
      />
    </div>
  );
}
