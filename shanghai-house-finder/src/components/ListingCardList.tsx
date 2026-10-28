'use client';

import React from 'react';
import {
  Bus,
  ChevronRight,
  Compass,
  GraduationCap,
  HeartPulse,
  Home,
  LayoutGrid,
  MapPin,
  Maximize2,
  ShoppingBag,
  Train,
  Trees,
} from 'lucide-react';
import type { HouseListing } from '@/lib/db/schema';

interface ListingCardListProps {
  listings: HouseListing[];
  selectedListing: HouseListing | null;
  onSelectListing: (listing: HouseListing) => void;
  onOpenDetail: (listing: HouseListing) => void;
  loading?: boolean;
}

export default function ListingCardList({
  listings,
  selectedListing,
  onSelectListing,
  onOpenDetail,
  loading,
}: ListingCardListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-44 rounded-2xl bg-slate-800/60 animate-pulse border border-slate-800"
          />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
        <Home className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-base font-semibold text-slate-200">
          未找到符合当前总价/单价区间的房源
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          请尝试放宽「总价区间」或「单价区间」，或者点击右上角「爬虫采数」定向抓取该价格段的新房与二手房。
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/80">
      {listings.map((house) => {
        const isSelected = selectedListing?.id === house.id;
        const isNew = house.listingType === 'new_house';
        const coverPhoto = house.housePhotos[0]?.url || '/api/house-photo?scene=living';
        const floorPlanThumb = house.floorPlans[0]?.url || '/api/floor-plan';

        const nearestSubway = house.transportSummary.nearestSubway;
        const nearestBus = house.transportSummary.nearestBus;
        const nearestMall = house.pois.mall[0];
        const nearestHospital = house.pois.hospital[0];
        const nearestSchool = house.pois.school[0];
        const nearestPark = house.pois.park[0];

        return (
          <article
            key={house.id}
            onClick={() => onSelectListing(house)}
            className={`p-3.5 transition cursor-pointer ${
              isSelected
                ? 'bg-sky-950/50 border-l-4 border-l-amber-400'
                : 'hover:bg-slate-800/50'
            }`}
          >
            <div className="flex gap-3.5">
              {/* 左侧：房屋实拍主图 + 右下角户型图缩略角标 */}
              <div className="relative w-38 h-30 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/70 group">
                <img
                  src={coverPhoto}
                  alt={house.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                {/* 二手房 / 新房角标 */}
                <span
                  className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold shadow ${
                    isNew
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-sky-500 text-white'
                  }`}
                >
                  {isNew ? '新房在售' : '二手房'}
                </span>

                {/* 综合宜居评分 */}
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-900/85 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  配套 {house.amenityScores.overall}分
                </span>

                {/* 右下角户型图缩略悬浮窗 */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(house);
                  }}
                  title="点击放大查看高清户型图与实拍图"
                  className="absolute bottom-1.5 right-1.5 w-14 h-11 rounded-md overflow-hidden border-2 border-white/90 shadow-md bg-white hover:scale-110 transition cursor-pointer"
                >
                  <img
                    src={floorPlanThumb}
                    alt="户型图预览"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-[8px] text-white text-center py-0.2">
                    户型图
                  </span>
                </button>
              </div>

              {/* 右侧：核心价格、规格、位置与配套摘要 */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-sky-300">
                      {house.title}
                    </h3>
                  </div>

                  {/* 小区名与板块地理位置 */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-semibold text-slate-200">{house.communityName}</span>
                    <span>·</span>
                    <span className="text-sky-300">
                      {house.district}·{house.subDistrict}
                    </span>
                    <span className="truncate hidden sm:inline text-slate-500">
                      ({house.address})
                    </span>
                  </div>

                  {/* 户型 / 面积 / 朝向 / 楼层 */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium flex items-center gap-1">
                      <LayoutGrid className="w-3 h-3 text-indigo-400" />
                      {house.rooms}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-medium flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-sky-400" />
                      {house.area}㎡
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-amber-400" />
                      {house.orientation}
                    </span>
                    <span className="text-slate-400 text-[11px]">{house.floorInfo}</span>
                  </div>
                </div>

                {/* 总价与单价醒目展示 + 详情按钮 */}
                <div className="flex items-baseline justify-between mt-2 pt-1.5 border-t border-slate-800/60">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-amber-400">
                      {house.totalPrice}
                      <span className="text-xs font-semibold ml-0.5">万</span>
                    </span>
                    <span className="text-xs font-medium text-emerald-400">
                      {house.unitPrice.toLocaleString()} 元/㎡
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(house);
                    }}
                    className="flex items-center gap-0.5 text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    <span>户型/实拍/配套详情</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 底部：交通（地铁/公交）与周边四大配套（商超/医院/学校/公园）速览矩阵 */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/70 grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1 text-slate-300 truncate">
                <Train className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="truncate">
                  {nearestSubway
                    ? `${nearestSubway.name} (${nearestSubway.distanceMeters}m)`
                    : '近地铁站点'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-300 truncate">
                <Bus className="w-3 h-3 text-teal-400 shrink-0" />
                <span className="truncate">
                  {nearestBus
                    ? `${nearestBus.name} (${nearestBus.distanceMeters}m)`
                    : '周边多路公交'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-300 truncate">
                <ShoppingBag className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  {nearestMall
                    ? `${nearestMall.name} (${nearestMall.distance_meters}m)`
                    : '商业配套齐全'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-300 truncate">
                <HeartPulse className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">
                  {nearestHospital
                    ? `${nearestHospital.name} (${nearestHospital.distance_meters}m)`
                    : '医疗中心覆盖'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-300 truncate">
                <GraduationCap className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="truncate">
                  {nearestSchool
                    ? `${nearestSchool.name} (${nearestSchool.distance_meters}m)`
                    : '学区教育配套'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-300 truncate">
                <Trees className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {nearestPark
                    ? `${nearestPark.name} (${nearestPark.distance_meters}m)`
                    : '生态公园绿地'}
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
