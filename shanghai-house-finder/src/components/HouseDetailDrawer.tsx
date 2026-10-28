'use client';

import React, { useState } from 'react';
import {
  Building,
  Bus,
  Car,
  ExternalLink,
  GraduationCap,
  HeartPulse,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Maximize2,
  Navigation,
  ShoppingBag,
  Train,
  Trees,
  X,
} from 'lucide-react';
import type {
  CommutePlanResult,
  CommunityPOIRecord,
  HouseListing,
  POICategory,
} from '@/lib/db/schema';

interface HouseDetailDrawerProps {
  listing: HouseListing | null;
  onClose: () => void;
  commutePlan: CommutePlanResult | null;
  activeCommuteMode: 'subway' | 'bus' | 'driving';
  onChangeCommuteMode: (mode: 'subway' | 'bus' | 'driving') => void;
  onFocusPoiOnMap: (poi: CommunityPOIRecord) => void;
}

export default function HouseDetailDrawer({
  listing,
  onClose,
  commutePlan,
  activeCommuteMode,
  onChangeCommuteMode,
  onFocusPoiOnMap,
}: HouseDetailDrawerProps) {
  const [mediaTab, setMediaTab] = useState<'floor_plan' | 'house_photo'>('floor_plan');
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number>(0);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeAmenityTab, setActiveAmenityTab] = useState<POICategory>('mall');

  if (!listing) return null;

  const currentFloorPlan =
    listing.floorPlans[selectedPlanIdx] || listing.floorPlans[0];
  const currentHousePhoto =
    listing.housePhotos[selectedPhotoIdx] || listing.housePhotos[0];

  const isNew = listing.listingType === 'new_house';
  const scores = listing.amenityScores;

  // 五维雷达图 SVG 顶点计算 (中心 90,90, 半径 64)
  const radarAxes = [
    { label: '交通', val: scores.transport, angle: -90 },
    { label: '商超', val: scores.mall, angle: -18 },
    { label: '医疗', val: scores.hospital, angle: 54 },
    { label: '教育', val: scores.school, angle: 126 },
    { label: '公园', val: scores.park, angle: 198 },
  ];

  const radarPolygon = radarAxes
    .map((ax) => {
      const r = (ax.val / 100) * 60;
      const rad = (ax.angle * Math.PI) / 180;
      const x = 90 + r * Math.cos(rad);
      const y = 90 + r * Math.sin(rad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-2xl bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col overflow-hidden text-slate-100">
      {/* 顶部标题栏 */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                isNew
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-sky-500 text-white'
              }`}
            >
              {isNew ? '新房楼盘' : '二手房源'}
            </span>
            <span className="text-xs text-sky-400 font-semibold">
              {listing.district}区 · {listing.subDistrict}板块
            </span>
            <span className="text-xs text-slate-400">编号: {listing.id}</span>
          </div>
          <h2 className="text-base font-bold text-white truncate mt-1">
            {listing.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={listing.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-sky-300 flex items-center gap-1 border border-slate-700 transition"
          >
            <span>原平台房源页</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭详情抽屉"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 主体滚动内容区 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 第一部分：户型图 & 房屋实拍图高清切换画廊 */}
        <section className="bg-slate-950/90 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setMediaTab('floor_plan')}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  mediaTab === 'floor_plan'
                    ? 'bg-sky-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>户型图 ({listing.floorPlans.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaTab('house_photo')}
                className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  mediaTab === 'house_photo'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>房屋实拍图 ({listing.housePhotos.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              点击图片可全屏放大查看细节
            </span>
          </div>

          {mediaTab === 'floor_plan' && currentFloorPlan && (
            <div className="p-4">
              <div
                onClick={() => setLightboxUrl(currentFloorPlan.url)}
                className="relative h-72 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-zoom-in group"
              >
                <img
                  src={currentFloorPlan.url}
                  alt={currentFloorPlan.title}
                  className="w-full h-full object-contain bg-white"
                />
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/85 text-white text-xs flex items-center gap-1 shadow">
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>点击全屏查看户型尺寸</span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">
                    {currentFloorPlan.title}
                  </p>
                  {currentFloorPlan.dimensions && (
                    <p className="text-xs text-sky-300 mt-0.5">
                      尺寸实测：{currentFloorPlan.dimensions}
                    </p>
                  )}
                </div>
                {listing.floorPlans.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    {listing.floorPlans.map((fp, i) => (
                      <button
                        key={fp.title}
                        type="button"
                        onClick={() => setSelectedPlanIdx(i)}
                        className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                          selectedPlanIdx === i
                            ? 'bg-sky-500 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        户型 {i + 1} ({fp.area}㎡)
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mediaTab === 'house_photo' && currentHousePhoto && (
            <div className="p-4">
              <div
                onClick={() => setLightboxUrl(currentHousePhoto.url)}
                className="relative h-72 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-zoom-in"
              >
                <img
                  src={currentHousePhoto.url}
                  alt={currentHousePhoto.label}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/85 text-amber-300 text-xs font-bold border border-amber-400/30">
                  {currentHousePhoto.label}
                </span>
              </div>

              {/* 实拍空间缩略图切换条 */}
              <div className="mt-3 grid grid-cols-5 gap-2">
                {listing.housePhotos.map((photo, idx) => (
                  <button
                    key={photo.label + idx}
                    type="button"
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`relative h-16 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                      selectedPhotoIdx === idx
                        ? 'border-amber-400 scale-102'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-950/85 text-[10px] text-white text-center py-0.5 truncate px-1">
                      {photo.roomType || photo.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 第二部分：房价、面积、地理位置与核心建筑参数 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-xs text-slate-400">挂牌总价 &amp; 单价</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400">
                {listing.totalPrice}万
              </span>
              <span className="text-xs font-semibold text-emerald-400">
                {listing.unitPrice.toLocaleString()} 元/㎡
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              首付(15%)约 {Math.round(listing.totalPrice * 0.15)}万 · 商业贷款支持
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-xs text-slate-400">户型规格 &amp; 装修楼层</span>
            <p className="text-base font-bold text-white mt-1">
              {listing.rooms} · {listing.area}㎡ ({listing.orientation})
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {listing.floorInfo} · {listing.decoration}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80">
            <span className="text-xs text-slate-400">地理位置 &amp; 社区物业</span>
            <p className="text-sm font-bold text-sky-300 mt-1 truncate">
              {listing.communityName}
            </p>
            <p className="text-[11px] text-slate-300 mt-0.5 truncate">
              {listing.address}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {listing.buildYear} · 物业 {listing.propertyFee}
            </p>
          </div>
        </section>

        {/* 第三部分：交通出行三维评估（地铁 / 公交 / 自驾） */}
        <section className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">
                交通出行全维评估（地铁 · 公交 · 自驾）
              </h3>
            </div>
            {commutePlan && (
              <span className="text-xs text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-0.5 rounded-full">
                通勤目的地：{commutePlan.destinationName} (直线 {commutePlan.straightDistanceKm}km)
              </span>
            )}
          </div>

          {/* 静态周边交通设施指标 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
                <Train className="w-3.5 h-3.5" />
                <span>最近地铁站</span>
              </div>
              {listing.transportSummary.nearestSubway ? (
                <>
                  <p className="font-bold text-slate-100">
                    {listing.transportSummary.nearestSubway.name}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    距离 {listing.transportSummary.nearestSubway.distanceMeters}米 · 步行约{' '}
                    {listing.transportSummary.nearestSubway.walkMinutes}分钟
                  </p>
                </>
              ) : (
                <p className="text-slate-400">周边轨交站点覆盖</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-1.5 text-teal-400 font-semibold mb-1">
                <Bus className="w-3.5 h-3.5" />
                <span>周边公交站点</span>
              </div>
              {listing.transportSummary.nearestBus ? (
                <>
                  <p className="font-bold text-slate-100">
                    {listing.transportSummary.nearestBus.name}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    距小区 {listing.transportSummary.nearestBus.distanceMeters}米 · 500m内{' '}
                    {listing.transportSummary.nearestBus.stopCountWithin500m}个站点
                  </p>
                </>
              ) : (
                <p className="text-slate-400">出小区即达公交站</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                <Car className="w-3.5 h-3.5" />
                <span>自驾高架与车位</span>
              </div>
              <p className="font-bold text-slate-100 truncate">
                {listing.transportSummary.drivingAccess.nearestArterialRoad}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {listing.transportSummary.drivingAccess.entryDistanceKm}km上快速路 ·{' '}
                {listing.transportSummary.drivingAccess.parkingInfo}
              </p>
            </div>
          </div>

          {/* 动态通勤三方案对比卡片 */}
          {commutePlan && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    {
                      key: 'subway',
                      icon: Train,
                      color: 'text-sky-400',
                      route: commutePlan.routes.subway,
                    },
                    {
                      key: 'bus',
                      icon: Bus,
                      color: 'text-emerald-400',
                      route: commutePlan.routes.bus,
                    },
                    {
                      key: 'driving',
                      icon: Car,
                      color: 'text-amber-400',
                      route: commutePlan.routes.driving,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = activeCommuteMode === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onChangeCommuteMode(item.key)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'bg-indigo-950/80 border-indigo-400 shadow-md'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1 ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {item.route.modeLabel}
                        </span>
                        <span className="text-xs font-extrabold text-white">
                          约 {item.route.durationMinutes} 分钟
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 truncate">
                        {item.route.summary}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        全程 {item.route.distanceKm}km · 预计 ¥{item.route.estimatedCostYuan}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* 当前选中出行方式的分步导航说明 */}
              <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span>
                    路线详情（{commutePlan.routes[activeCommuteMode].modeLabel}：
                    {listing.communityName} → {commutePlan.destinationName}）
                  </span>
                  <span className="text-sky-400 text-[11px]">已同步高亮在左侧地图</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  {commutePlan.routes[activeCommuteMode].steps.map((step, i) => (
                    <li key={i} className="text-[11px] leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
                {commutePlan.routes[activeCommuteMode].congestionHint && (
                  <p className="text-[11px] text-amber-300/90 pt-1">
                    💡 {commutePlan.routes[activeCommuteMode].congestionHint}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 第四部分：附近商超、医院、学校、公园全维清单 + 五维雷达评分 */}
        <section className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              <span>周边生活配套全景（商超 · 医院 · 学校 · 公园 · 轨交）</span>
            </h3>
            <span className="text-xs font-bold text-amber-400">
              宜居综合得分：{scores.overall} / 100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* 五维配套雷达图 (占 4 列) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-900/90 rounded-xl p-3 border border-slate-800">
              <svg width="180" height="180" viewBox="0 0 180 180">
                {[20, 40, 60].map((r) => (
                  <circle
                    key={r}
                    cx="90"
                    cy="90"
                    r={r}
                    fill="none"
                    stroke="#334155"
                    strokeDasharray="2,2"
                  />
                ))}
                {radarAxes.map((ax) => {
                  const rad = (ax.angle * Math.PI) / 180;
                  const x2 = 90 + 62 * Math.cos(rad);
                  const y2 = 90 + 62 * Math.sin(rad);
                  const lx = 90 + 78 * Math.cos(rad);
                  const ly = 90 + 78 * Math.sin(rad);
                  return (
                    <g key={ax.label}>
                      <line
                        x1="90"
                        y1="90"
                        x2={x2}
                        y2={y2}
                        stroke="#475569"
                        strokeWidth="1"
                      />
                      <text
                        x={lx}
                        y={ly + 4}
                        textAnchor="middle"
                        fill="#cbd5e1"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {ax.label} {ax.val}
                      </text>
                    </g>
                  );
                })}
                <polygon
                  points={radarPolygon}
                  fill="#0ea5e9"
                  fillOpacity="0.32"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
              </svg>
              <span className="text-[11px] text-slate-400">
                1.5km 黄金生活圈五维指数
              </span>
            </div>

            {/* 分类配套切换与距离清单 (占 8 列) */}
            <div className="md:col-span-8 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: 'mall', label: '附近商超', icon: ShoppingBag, count: listing.pois.mall.length },
                    { key: 'hospital', label: '附近医院', icon: HeartPulse, count: listing.pois.hospital.length },
                    { key: 'school', label: '附近学校', icon: GraduationCap, count: listing.pois.school.length },
                    { key: 'park', label: '附近公园', icon: Trees, count: listing.pois.park.length },
                    { key: 'subway', label: '地铁站', icon: Train, count: listing.pois.subway.length },
                    { key: 'bus', label: '公交站', icon: Bus, count: listing.pois.bus.length },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = activeAmenityTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveAmenityTab(tab.key)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        active
                          ? 'bg-sky-500 text-white shadow'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>
                        {tab.label} ({tab.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {listing.pois[activeAmenityTab].map((poi, idx) => (
                  <div
                    key={`${poi.name}_${idx}`}
                    onClick={() => onFocusPoiOnMap(poi)}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <p className="text-xs font-bold text-slate-100 truncate">
                          {poi.name}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {poi.sub_info}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-400 block">
                        {poi.distance_meters} 米
                      </span>
                      <span className="text-[10px] text-slate-400">
                        步行约 {poi.walk_minutes} 分钟
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 大图灯箱预览弹窗 */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="高清大图预览"
            className="max-w-full max-h-full rounded-2xl shadow-2xl border border-slate-700 bg-white"
          />
        </div>
      )}
    </div>
  );
}
