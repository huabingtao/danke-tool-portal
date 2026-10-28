'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bus,
  Car,
  Crosshair,
  GraduationCap,
  HeartPulse,
  Layers,
  Minus,
  Navigation,
  Plus,
  ShoppingBag,
  Train,
  Trees,
} from 'lucide-react';
import type {
  CommutePlanResult,
  CommunityPOIRecord,
  HouseListing,
  POICategory,
} from '@/lib/db/schema';
import { SHANGHAI_DISTRICTS } from '@/lib/db/schema';

interface HouseMapProps {
  listings: HouseListing[];
  selectedListing: HouseListing | null;
  onSelectListing: (listing: HouseListing) => void;
  commutePlan: CommutePlanResult | null;
  activeCommuteMode: 'subway' | 'bus' | 'driving';
  onChangeCommuteMode: (mode: 'subway' | 'bus' | 'driving') => void;
  highlightedPoi: CommunityPOIRecord | null;
}

const POI_META: Record<
  POICategory,
  { label: string; color: string; bg: string; border: string }
> = {
  subway: {
    label: '地铁站',
    color: '#38bdf8',
    bg: 'bg-sky-500',
    border: 'border-sky-300',
  },
  bus: {
    label: '公交站',
    color: '#2dd4bf',
    bg: 'bg-teal-500',
    border: 'border-teal-300',
  },
  mall: {
    label: '商超购物',
    color: '#f59e0b',
    bg: 'bg-amber-500',
    border: 'border-amber-300',
  },
  hospital: {
    label: '医疗医院',
    color: '#f43f5e',
    bg: 'bg-rose-500',
    border: 'border-rose-300',
  },
  school: {
    label: '教育学校',
    color: '#a855f7',
    bg: 'bg-purple-500',
    border: 'border-purple-300',
  },
  park: {
    label: '生态公园',
    color: '#22c55e',
    bg: 'bg-emerald-500',
    border: 'border-emerald-300',
  },
};

function latToMercatorY(lat: number): number {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function latLngToWorldPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const tileSize = 256;
  const scale = tileSize * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const y = ((1 - latToMercatorY(lat) / Math.PI) / 2) * scale;
  return { x, y };
}

function worldPixelToLatLng(x: number, y: number, zoom: number): { lat: number; lng: number } {
  const tileSize = 256;
  const scale = tileSize * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

export default function HouseMap({
  listings,
  selectedListing,
  onSelectListing,
  commutePlan,
  activeCommuteMode,
  onChangeCommuteMode,
  highlightedPoi,
}: HouseMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>({
    width: 860,
    height: 680,
  });

  // 默认中心：上海市人民广场/陆家嘴连线中心
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 31.215,
    lng: 121.465,
  });
  const [zoom, setZoom] = useState<number>(11.6);
  const [mapStyle, setMapStyle] = useState<'amap' | 'dark' | 'vector'>('amap');
  const [activePoiFilter, setActivePoiFilter] = useState<'all' | POICategory>('all');
  const [showCommuteLine, setShowCommuteLine] = useState<boolean>(true);
  const [hoveredPoi, setHoveredPoi] = useState<CommunityPOIRecord | null>(null);

  // 拖拽状态
  const dragRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startCenter: { lat: number; lng: number };
  }>({
    dragging: false,
    startX: 0,
    startY: 0,
    startCenter: { lat: 31.215, lng: 121.465 },
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setViewport({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const obs = new ResizeObserver(updateSize);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // 当选中房源变化时，平滑将地图中心聚焦至该房源并放大到周边配套观察层级
  useEffect(() => {
    if (selectedListing) {
      setCenter({ lat: selectedListing.lat, lng: selectedListing.lng });
      setZoom((prev) => (prev < 13.8 ? 14.2 : prev));
    }
  }, [selectedListing?.id]);

  // 当点击详情抽屉中的某个具体配套时，聚焦该配套
  useEffect(() => {
    if (highlightedPoi) {
      setCenter({ lat: highlightedPoi.lat, lng: highlightedPoi.lng });
      setZoom(15);
      setHoveredPoi(highlightedPoi);
    }
  }, [highlightedPoi]);

  const project = (lat: number, lng: number): { x: number; y: number } => {
    const cWorld = latLngToWorldPixel(center.lat, center.lng, zoom);
    const pWorld = latLngToWorldPixel(lat, lng, zoom);
    return {
      x: viewport.width / 2 + (pWorld.x - cWorld.x),
      y: viewport.height / 2 + (pWorld.y - cWorld.y),
    };
  };

  // 计算当前缩放级别下每像素代表多少米（用于绘制精准的 500m / 1000m / 1500m 生活圈同心圆）
  const metersPerPixel = useMemo(() => {
    return (156543.03392 * Math.cos((center.lat * Math.PI) / 180)) / Math.pow(2, zoom);
  }, [center.lat, zoom]);

  const radiusToPx = (meters: number) => Math.max(8, meters / metersPerPixel);

  // 计算底层瓦片网格 (整数缩放级)
  const tileZoom = Math.min(17, Math.max(9, Math.round(zoom)));
  const tiles = useMemo(() => {
    if (mapStyle === 'vector') return [];
    const scaleFactor = Math.pow(2, zoom - tileZoom);
    const tileDisplaySize = 256 * scaleFactor;
    const cTileWorld = latLngToWorldPixel(center.lat, center.lng, tileZoom);

    const centerTileX = Math.floor(cTileWorld.x / 256);
    const centerTileY = Math.floor(cTileWorld.y / 256);
    const colsHalf = Math.ceil(viewport.width / tileDisplaySize / 2) + 1;
    const rowsHalf = Math.ceil(viewport.height / tileDisplaySize / 2) + 1;

    const list: Array<{
      key: string;
      url: string;
      left: number;
      top: number;
      size: number;
    }> = [];

    for (let dx = -colsHalf; dx <= colsHalf; dx++) {
      for (let dy = -rowsHalf; dy <= rowsHalf; dy++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        const left =
          viewport.width / 2 + (tx * 256 - cTileWorld.x) * scaleFactor;
        const top =
          viewport.height / 2 + (ty * 256 - cTileWorld.y) * scaleFactor;

        const url =
          mapStyle === 'amap'
            ? `https://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=${tx}&y=${ty}&z=${tileZoom}`
            : `https://basemaps.cartocdn.com/dark_all/${tileZoom}/${tx}/${ty}.png`;

        list.push({
          key: `${tileZoom}_${tx}_${ty}`,
          url,
          left,
          top,
          size: tileDisplaySize + 0.5,
        });
      }
    }
    return list;
  }, [center.lat, center.lng, zoom, tileZoom, viewport.width, viewport.height, mapStyle]);

  // 选中房源的所有周边配套
  const visiblePois = useMemo(() => {
    if (!selectedListing) return [];
    const all: CommunityPOIRecord[] = [
      ...selectedListing.pois.subway,
      ...selectedListing.pois.bus,
      ...selectedListing.pois.mall,
      ...selectedListing.pois.hospital,
      ...selectedListing.pois.school,
      ...selectedListing.pois.park,
    ];
    if (activePoiFilter === 'all') return all;
    return all.filter((p) => p.category === activePoiFilter);
  }, [selectedListing, activePoiFilter]);

  // 当前选中的通勤路线坐标
  const activeRoute = commutePlan?.routes?.[activeCommuteMode] || null;
  const routeSvgPoints = useMemo(() => {
    if (!activeRoute || !showCommuteLine) return '';
    return activeRoute.pathCoords
      .map(([lat, lng]) => {
        const pt = project(lat, lng);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }, [activeRoute, showCommuteLine, center.lat, center.lng, zoom, viewport.width, viewport.height]);

  // 黄浦江标志性S弯矢量曲线（用于地图视觉参考）
  const huangpuRiverPoints = useMemo(() => {
    const coords: [number, number][] = [
      [31.015, 121.415],
      [31.085, 121.462],
      [31.145, 121.468],
      [31.178, 121.465],
      [31.198, 121.492],
      [31.222, 121.498],
      [31.242, 121.493],
      [31.258, 121.525],
      [31.285, 121.562],
      [31.345, 121.535],
    ];
    return coords
      .map(([lat, lng]) => {
        const pt = project(lat, lng);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }, [center.lat, center.lng, zoom, viewport.width, viewport.height]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startCenter: { ...center },
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const startWorld = latLngToWorldPixel(
      dragRef.current.startCenter.lat,
      dragRef.current.startCenter.lng,
      zoom
    );
    const nextLatLng = worldPixelToLatLng(startWorld.x - dx, startWorld.y - dy, zoom);
    setCenter(nextLatLng);
  };

  const handleMouseUp = () => {
    dragRef.current.dragging = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.45 : -0.45;
    setZoom((prev) => Math.min(16.5, Math.max(9.8, Number((prev + delta).toFixed(2)))));
  };

  const handleFitShanghai = () => {
    setCenter({ lat: 31.215, lng: 121.465 });
    setZoom(11.3);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden select-none bg-slate-900 cursor-grab active:cursor-grabbing"
    >
      {/* 1. 瓦片底图层 (支持高德标准瓦片 / 深色科技瓦片 + 离线矢量网格无缝兜底) */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          mapStyle === 'amap' ? 'bg-[#eef2f6]' : 'bg-[#0b1120]'
        }`}
      >
        {tiles.map((t) => (
          <img
            key={t.key}
            src={t.url}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: `${t.left}px`,
              top: `${t.top}px`,
              width: `${t.size}px`,
              height: `${t.size}px`,
            }}
            className={mapStyle === 'amap' ? 'opacity-90' : 'opacity-85'}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ))}
      </div>

      {/* 2. SVG 空间地理矢量层 (黄浦江水系、上海环线、生活圈同心圆、通勤轨迹折线) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <radialGradient id="circleGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.16" />
            <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        {/* 黄浦江矢量水系参考线 */}
        <polyline
          points={huangpuRiverPoints}
          fill="none"
          stroke={mapStyle === 'amap' ? '#38bdf8' : '#0284c7'}
          strokeWidth={Math.max(4, (zoom - 9) * 3)}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={mapStyle === 'vector' ? 0.55 : 0.22}
        />

        {/* 16行政区背景水印地名 */}
        {SHANGHAI_DISTRICTS.map((dist) => {
          const pt = project(dist.center[0], dist.center[1]);
          if (pt.x < -80 || pt.x > viewport.width + 80 || pt.y < -80 || pt.y > viewport.height + 80) {
            return null;
          }
          return (
            <g key={dist.code} transform={`translate(${pt.x}, ${pt.y})`}>
              <text
                textAnchor="middle"
                fill={mapStyle === 'amap' ? '#475569' : '#64748b'}
                opacity={zoom > 13.5 ? 0.35 : 0.65}
                fontSize={zoom > 12.5 ? 13 : 11}
                fontWeight="700"
              >
                {dist.name}区
              </text>
            </g>
          );
        })}

        {/* 选中房源的 500m / 1000m / 1500m 周边生活圈同心圆 */}
        {selectedListing && (() => {
          const pt = project(selectedListing.lat, selectedListing.lng);
          const r500 = radiusToPx(500);
          const r1000 = radiusToPx(1000);
          const r1500 = radiusToPx(1500);
          return (
            <g transform={`translate(${pt.x}, ${pt.y})`}>
              <circle
                r={r1500}
                fill="url(#circleGrad)"
                stroke="#0284c7"
                strokeWidth="1.2"
                strokeDasharray="6,4"
              />
              <circle
                r={r1000}
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <circle
                r={r500}
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              {r1500 > 45 && (
                <>
                  <text
                    x={0}
                    y={-r500 + 13}
                    textAnchor="middle"
                    fill="#059669"
                    fontSize="10"
                    fontWeight="700"
                  >
                    500m 步行6分钟圈
                  </text>
                  <text
                    x={0}
                    y={-r1000 + 13}
                    textAnchor="middle"
                    fill="#0284c7"
                    fontSize="10"
                    fontWeight="700"
                  >
                    1km 步行12分钟圈
                  </text>
                  <text
                    x={0}
                    y={-r1500 + 14}
                    textAnchor="middle"
                    fill="#0369a1"
                    fontSize="10"
                    fontWeight="700"
                  >
                    1.5km 黄金生活圈
                  </text>
                </>
              )}
            </g>
          );
        })()}

        {/* 通勤路线轨迹 (从当前选中房源 -> 通勤目的地) */}
        {selectedListing && commutePlan && showCommuteLine && routeSvgPoints && (
          <g>
            <polyline
              points={routeSvgPoints}
              fill="none"
              stroke="#0f172a"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.35"
            />
            <polyline
              points={routeSvgPoints}
              fill="none"
              stroke={
                activeCommuteMode === 'subway'
                  ? '#0284c7'
                  : activeCommuteMode === 'bus'
                  ? '#10b981'
                  : '#f59e0b'
              }
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={activeCommuteMode === 'subway' ? 'none' : '8,5'}
            />
          </g>
        )}
      </svg>

      {/* 3. 通勤终点地标标记 */}
      {selectedListing && commutePlan && showCommuteLine && (() => {
        const destPt = project(
          commutePlan.destinationCoords[0],
          commutePlan.destinationCoords[1]
        );
        return (
          <div
            style={{ left: `${destPt.x}px`, top: `${destPt.y}px` }}
            className="absolute -translate-x-1/2 -translate-y-full z-20 pointer-events-none"
          >
            <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-lg border border-indigo-300 flex items-center gap-1.5 whitespace-nowrap">
              <Navigation className="w-3.5 h-3.5 text-amber-300" />
              <span>终点：{commutePlan.destinationName}</span>
              {activeRoute && (
                <span className="px-1.5 py-0.5 rounded bg-indigo-900/80 text-amber-300 text-[11px]">
                  {activeRoute.durationMinutes}分钟
                </span>
              )}
            </div>
            <div className="w-2.5 h-2.5 bg-indigo-600 rotate-45 mx-auto -mt-1 border-r border-b border-indigo-300" />
          </div>
        );
      })()}

      {/* 4. 选中房源的周边 6 大配套图钉 (地铁/公交/商超/医院/学校/公园) */}
      {selectedListing &&
        visiblePois.map((poi, idx) => {
          const pt = project(poi.lat, poi.lng);
          if (
            pt.x < -40 ||
            pt.x > viewport.width + 40 ||
            pt.y < -40 ||
            pt.y > viewport.height + 40
          ) {
            return null;
          }
          const meta = POI_META[poi.category];
          const isHovered =
            hoveredPoi?.name === poi.name && hoveredPoi?.category === poi.category;

          return (
            <div
              key={`${poi.category}_${poi.name}_${idx}`}
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
              onMouseEnter={() => setHoveredPoi(poi)}
              onMouseLeave={() => setHoveredPoi(null)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${
                isHovered ? 'z-30 scale-125' : 'z-10 hover:scale-110'
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setHoveredPoi(poi);
                }}
                className={`px-2 py-0.5 rounded-full text-white text-[11px] font-medium shadow-md border ${meta.bg} ${meta.border} flex items-center gap-1 whitespace-nowrap cursor-pointer`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>{poi.name.length > 9 ? poi.name.slice(0, 9) + '…' : poi.name}</span>
                <span className="opacity-90 text-[10px]">{poi.distance_meters}m</span>
              </button>

              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 p-2.5 rounded-xl bg-slate-900/95 text-white text-xs shadow-xl border border-slate-700 pointer-events-none">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-300">
                      {meta.label}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      距小区 {poi.distance_meters}m · 步行约{poi.walk_minutes}分钟
                    </span>
                  </div>
                  <p className="font-bold text-slate-100">{poi.name}</p>
                  {poi.sub_info && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{poi.sub_info}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {/* 5. 上海市所有命中的二手房与新房房源价格气泡 */}
      {listings.map((house) => {
        const pt = project(house.lat, house.lng);
        if (
          pt.x < -80 ||
          pt.x > viewport.width + 80 ||
          pt.y < -80 ||
          pt.y > viewport.height + 80
        ) {
          return null;
        }
        const isSelected = selectedListing?.id === house.id;
        const isNew = house.listingType === 'new_house';

        return (
          <div
            key={house.id}
            style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            className={`absolute -translate-x-1/2 -translate-y-full transition-all ${
              isSelected ? 'z-30 scale-110' : 'z-20 hover:z-30 hover:scale-105'
            }`}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectListing(house);
              }}
              className={`group px-2.5 py-1 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-white ring-4 ring-amber-400/40'
                  : isNew
                  ? 'bg-emerald-600/95 hover:bg-emerald-500 text-white border-emerald-300/70'
                  : 'bg-sky-600/95 hover:bg-sky-500 text-white border-sky-300/70'
              }`}
            >
              <span
                className={`px-1 py-0.2 rounded text-[10px] font-extrabold ${
                  isSelected
                    ? 'bg-slate-950 text-amber-400'
                    : isNew
                    ? 'bg-emerald-900/70 text-emerald-200'
                    : 'bg-sky-900/70 text-sky-200'
                }`}
              >
                {isNew ? '新房' : '二手'}
              </span>
              <span>{house.communityName.slice(0, 6)}</span>
              <span className={isSelected ? 'text-slate-950 font-black' : 'text-amber-200'}>
                {house.totalPrice}万
              </span>
              <span className="text-[10px] opacity-85 font-normal hidden sm:inline">
                ({(house.unitPrice / 10000).toFixed(1)}万/㎡)
              </span>
            </button>
            <div
              className={`w-2.5 h-2.5 rotate-45 mx-auto -mt-1 border-r border-b ${
                isSelected
                  ? 'bg-amber-500 border-white'
                  : isNew
                  ? 'bg-emerald-600 border-emerald-300'
                  : 'bg-sky-600 border-sky-300'
              }`}
            />
          </div>
        );
      })}

      {/* 6. 顶部浮动配套图层过滤栏 */}
      <div className="absolute top-3 left-3 right-16 z-30 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
          <span className="text-slate-400 font-medium mr-1 hidden sm:inline">周边配套图层:</span>
          {(
            [
              { key: 'all', label: '全部配套', icon: Layers },
              { key: 'subway', label: '地铁', icon: Train },
              { key: 'bus', label: '公交', icon: Bus },
              { key: 'mall', label: '商超', icon: ShoppingBag },
              { key: 'hospital', label: '医院', icon: HeartPulse },
              { key: 'school', label: '学校', icon: GraduationCap },
              { key: 'park', label: '公园', icon: Trees },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = activePoiFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePoiFilter(item.key)}
                className={`px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                  active
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 通勤方式图层快速切换 */}
        {selectedListing && commutePlan && (
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs">
            <span className="text-slate-400 mr-1">通勤路线:</span>
            {(
              [
                { mode: 'subway', label: '地铁', icon: Train, mins: commutePlan.routes.subway.durationMinutes },
                { mode: 'bus', label: '公交', icon: Bus, mins: commutePlan.routes.bus.durationMinutes },
                { mode: 'driving', label: '自驾', icon: Car, mins: commutePlan.routes.driving.durationMinutes },
              ] as const
            ).map((m) => {
              const Icon = m.icon;
              const active = activeCommuteMode === m.mode && showCommuteLine;
              return (
                <button
                  key={m.mode}
                  type="button"
                  onClick={() => {
                    setShowCommuteLine(true);
                    onChangeCommuteMode(m.mode);
                  }}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>
                    {m.label} {m.mins}分
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. 右侧地图缩放与底图切换工具条 */}
      <div className="absolute top-3 right-3 z-30 flex flex-col gap-2 pointer-events-auto">
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg overflow-hidden">
          <button
            type="button"
            title="放大地图"
            onClick={() => setZoom((z) => Math.min(16.5, Number((z + 0.6).toFixed(2))))}
            className="p-2 text-slate-200 hover:bg-slate-800 border-b border-slate-800 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="缩小地图"
            onClick={() => setZoom((z) => Math.max(9.8, Number((z - 0.6).toFixed(2))))}
            className="p-2 text-slate-200 hover:bg-slate-800 border-b border-slate-800 cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="复位上海全景视野"
            onClick={handleFitShanghai}
            className="p-2 text-sky-400 hover:bg-slate-800 cursor-pointer"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg p-1 gap-1 text-[11px]">
          {(
            [
              { id: 'amap', label: '标准图' },
              { id: 'dark', label: '深色图' },
              { id: 'vector', label: '矢量图' },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setMapStyle(st.id)}
              className={`px-2 py-1 rounded-lg font-medium transition cursor-pointer ${
                mapStyle === st.id
                  ? 'bg-sky-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 8. 左下角地图图例与当前选中房源空间摘要 */}
      <div className="absolute bottom-3 left-3 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg text-xs text-slate-300 flex flex-wrap items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sky-500 inline-block" />
          <span>二手房 ({listings.filter((l) => l.listingType === 'second_hand').length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
          <span>新房 ({listings.filter((l) => l.listingType === 'new_house').length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
          <span>当前选中房源</span>
        </div>
        {selectedListing && (
          <div className="text-sky-300 border-l border-slate-700 pl-3 font-medium">
            当前：{selectedListing.district}·{selectedListing.subDistrict} · {selectedListing.communityName}
          </div>
        )}
      </div>
    </div>
  );
}
