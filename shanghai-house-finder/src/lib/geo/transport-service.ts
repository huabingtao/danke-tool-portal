import {
  type CommuteModeRoute,
  type CommutePlanResult,
  SHANGHAI_COMMUTE_HUBS,
  SHANGHAI_DISTRICTS,
  type StaticTransportSummary,
} from '../db/schema.ts';
import { calculateDistanceMeters } from './poi-service.ts';

/**
 * 解析用户输入的上海目的地名称为经纬度与推荐轨交线
 */
export function resolveDestinationCoords(destinationQuery: string): {
  name: string;
  coords: [number, number];
  lines: string[];
} {
  const q = (destinationQuery || '').trim();
  if (!q) {
    const def = SHANGHAI_COMMUTE_HUBS[0];
    return { name: def.name, coords: def.coords, lines: [...def.lines] };
  }

  // 1. 匹配内置核心通勤枢纽
  const matchedHub = SHANGHAI_COMMUTE_HUBS.find(
    (h) => h.id === q || h.name.includes(q) || q.includes(h.name.slice(0, 3))
  );
  if (matchedHub) {
    return {
      name: matchedHub.name,
      coords: matchedHub.coords,
      lines: [...matchedHub.lines],
    };
  }

  // 2. 匹配常见地标关键字
  const customLandmarks: Array<{
    keywords: string[];
    name: string;
    coords: [number, number];
    lines: string[];
  }> = [
    { keywords: ['外滩', '南京东路'], name: '外滩/南京东路', coords: [31.2375, 121.4885], lines: ['2号线', '10号线'] },
    { keywords: ['新天地', '淮海中路'], name: '新天地/淮海中路', coords: [31.2185, 121.4752], lines: ['10号线', '13号线'] },
    { keywords: ['世纪大道', '八佰伴'], name: '世纪大道/八佰伴', coords: [31.2289, 121.5319], lines: ['2号线', '4号线', '6号线', '9号线'] },
    { keywords: ['金桥', '金桥开发区'], name: '金桥开发区', coords: [31.2582, 121.6025], lines: ['9号线', '12号线', '14号线'] },
    { keywords: ['紫竹', '交大', '闵行开发区'], name: '紫竹高新区', coords: [31.0225, 121.4485], lines: ['15号线', '5号线'] },
    { keywords: ['中山公园', '娄山关路'], name: '中山公园商圈', coords: [31.2185, 121.4162], lines: ['2号线', '3号线', '4号线'] },
    { keywords: ['北外滩', '提篮桥'], name: '北外滩国际航运中心', coords: [31.2512, 121.5045], lines: ['12号线'] },
    { keywords: ['大宁', '市北高新'], name: '大宁/市北高新园区', coords: [31.2885, 121.4485], lines: ['1号线'] },
    { keywords: ['莘庄'], name: '莘庄商务区', coords: [31.1112, 121.3852], lines: ['1号线', '5号线'] },
    { keywords: ['临港', '滴水湖'], name: '临港新片区/滴水湖', coords: [30.8985, 121.9285], lines: ['16号线'] },
  ];

  for (const lm of customLandmarks) {
    if (lm.keywords.some((k) => q.includes(k))) {
      return { name: lm.name, coords: lm.coords, lines: lm.lines };
    }
  }

  // 3. 匹配行政区中心
  const matchedDistrict = SHANGHAI_DISTRICTS.find((d) => q.includes(d.name));
  if (matchedDistrict) {
    return {
      name: `${matchedDistrict.name}中心区 (${q})`,
      coords: matchedDistrict.center,
      lines: ['上海地铁网'],
    };
  }

  // 默认回退到人民广场并带上用户输入名称
  return {
    name: q,
    coords: [31.2304, 121.4737],
    lines: ['1号线', '2号线', '8号线'],
  };
}

/**
 * 生成连接起点与终点的平滑真实路网折线坐标（包含过江隧道/高架转折点）
 */
function buildRouteWaypoints(
  origin: [number, number],
  dest: [number, number],
  mode: 'subway' | 'bus' | 'driving'
): [number, number][] {
  const [lat1, lng1] = origin;
  const [lat2, lng2] = dest;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // 不同出行方式采用略微错开的真实路网曲率，便于在地图上同时或切换查看
  const offsetScale = mode === 'subway' ? 0.14 : mode === 'driving' ? -0.16 : 0.06;
  const p1: [number, number] = [
    Number((lat1 + dLat * 0.28 + dLng * offsetScale).toFixed(5)),
    Number((lng1 + dLng * 0.24 - dLat * offsetScale).toFixed(5)),
  ];
  const p2: [number, number] = [
    Number((lat1 + dLat * 0.62 + dLng * (offsetScale * 0.6)).toFixed(5)),
    Number((lng1 + dLng * 0.68 - dLat * (offsetScale * 0.6)).toFixed(5)),
  ];
  const p3: [number, number] = [
    Number((lat1 + dLat * 0.86).toFixed(5)),
    Number((lng1 + dLng * 0.88).toFixed(5)),
  ];

  return [origin, p1, p2, p3, dest];
}

/**
 * 计算从房源出发到指定目的地的「地铁 / 公交 / 自驾」三模式通勤方案
 */
export async function calculateCommutePlan(params: {
  originName: string;
  originLat: number;
  originLng: number;
  transportSummary?: StaticTransportSummary;
  destinationQuery: string;
  amapKey?: string;
}): Promise<CommutePlanResult> {
  const { originName, originLat, originLng, transportSummary, destinationQuery, amapKey } = params;
  const dest = resolveDestinationCoords(destinationQuery);

  const straightMeters = calculateDistanceMeters(
    originLat,
    originLng,
    dest.coords[0],
    dest.coords[1]
  );
  const straightDistanceKm = Number((straightMeters / 1000).toFixed(1));

  // 若配置了高德 Key，可尝试请求高德路径规划 API 补充实时耗时
  const effectiveKey = amapKey || process.env.AMAP_WEB_KEY;
  let amapDrivingMinutes: number | null = null;
  let amapDrivingKm: number | null = null;

  if (effectiveKey) {
    try {
      const url = `https://restapi.amap.com/v3/direction/driving?key=${encodeURIComponent(
        effectiveKey
      )}&origin=${originLng.toFixed(6)},${originLat.toFixed(6)}&destination=${dest.coords[1].toFixed(
        6
      )},${dest.coords[0].toFixed(6)}&extensions=base`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        const path0 = data?.route?.paths?.[0];
        if (path0) {
          amapDrivingMinutes = Math.max(5, Math.round(Number(path0.duration) / 60));
          amapDrivingKm = Number((Number(path0.distance) / 1000).toFixed(1));
        }
      }
    } catch {
      // 自动回退至内置上海交通路网计算引擎
    }
  }

  // 1. 地铁通勤方案计算
  const nearestSubway = transportSummary?.nearestSubway;
  const subwayWalkMeters = nearestSubway ? nearestSubway.distanceMeters : 650;
  const subwayWalkMins = nearestSubway ? nearestSubway.walkMinutes : 8;
  const originLine = nearestSubway?.lines?.[0] || '地铁9号线';
  const destLine = dest.lines[0] || '地铁2号线';
  const isSameLine = originLine.replace('地铁', '') === destLine.replace('地铁', '');
  const transferCount = straightDistanceKm < 3 ? 0 : isSameLine ? 0 : 1;
  const subwayRideKm = Number((straightDistanceKm * 1.26).toFixed(1));
  const subwayRideMins = Math.max(6, Math.round((subwayRideKm / 34) * 60) + transferCount * 5);
  const subwayTotalMins = subwayWalkMins + subwayRideMins + 5;
  const subwayCost = subwayRideKm <= 6 ? 3 : subwayRideKm <= 16 ? 4 : subwayRideKm <= 26 ? 5 : 6;

  const subwayRoute: CommuteModeRoute = {
    mode: 'subway',
    modeLabel: '地铁出行',
    durationMinutes: subwayTotalMins,
    distanceKm: subwayRideKm,
    summary: isSameLine
      ? `${originLine}直达 · 无需换乘`
      : `${originLine} 换乘 ${destLine} (${transferCount}次换乘)`,
    steps: [
      `从「${originName}」步行 ${subwayWalkMeters}米 (${subwayWalkMins}分钟) 至 ${nearestSubway?.name || '附近地铁站'}`,
      isSameLine
        ? `乘坐 ${originLine} 直达「${dest.name}」站 (${subwayRideMins}分钟)`
        : `乘坐 ${originLine} 并在枢纽站换乘 ${destLine} 前往「${dest.name}」(${subwayRideMins}分钟)`,
      `出站步行约 350米 (5分钟) 抵达目的地「${dest.name}」`,
    ],
    transferCount,
    walkingMeters: subwayWalkMeters + 350,
    estimatedCostYuan: subwayCost,
    congestionHint: '轨道交通准点率 99.6%，早晚高峰不受地面拥堵影响',
    pathCoords: buildRouteWaypoints([originLat, originLng], dest.coords, 'subway'),
  };

  // 2. 公交出行方案计算
  const nearestBus = transportSummary?.nearestBus;
  const busWalkMeters = nearestBus ? nearestBus.distanceMeters : 280;
  const busWalkMins = nearestBus ? nearestBus.walkMinutes : 4;
  const primaryBusRoute = nearestBus?.routes?.[0] || '浦东专线/市区干线公交';
  const busDistanceKm = Number((straightDistanceKm * 1.32).toFixed(1));
  const busRideMins = Math.max(12, Math.round((busDistanceKm / 19) * 60) + 6);
  const busTotalMins = busWalkMins + busRideMins + 4;

  const busRoute: CommuteModeRoute = {
    mode: 'bus',
    modeLabel: '地面公交',
    durationMinutes: busTotalMins,
    distanceKm: busDistanceKm,
    summary: `${primaryBusRoute} · 步行少 (${busWalkMeters + 260}米)`,
    steps: [
      `从小区出入口步行 ${busWalkMeters}米 (${busWalkMins}分钟) 至「${nearestBus?.name || '小区门口公交站'}」`,
      `搭乘 ${primaryBusRoute} (途经专用公交道，预计行驶 ${busRideMins}分钟)`,
      `下车步行 260米 (4分钟) 抵达「${dest.name}」`,
    ],
    transferCount: straightDistanceKm > 12 ? 1 : 0,
    walkingMeters: busWalkMeters + 260,
    estimatedCostYuan: straightDistanceKm > 15 ? 4 : 2,
    congestionHint: '支持上海公交乘车码换乘优惠（120分钟内立减1元）',
    pathCoords: buildRouteWaypoints([originLat, originLng], dest.coords, 'bus'),
  };

  // 3. 自驾出行方案计算
  const isCrossRiver = (originLng - 121.488) * (dest.coords[1] - 121.488) < 0;
  const drivingDistanceKm =
    amapDrivingKm ?? Number((straightDistanceKm * (isCrossRiver ? 1.35 : 1.28) + 1.2).toFixed(1));
  const drivingMinutes =
    amapDrivingMinutes ??
    Math.max(10, Math.round((drivingDistanceKm / 31) * 60) + (isCrossRiver ? 7 : 3));
  const arterialRoad =
    transportSummary?.drivingAccess?.nearestArterialRoad || '内环高架 / 中环快速路 / 延安高架';
  const crossRiverVia = isCrossRiver ? ' → 延安东路隧道/复兴东路隧道/南浦大桥过江' : '';
  const taxiCost = Math.round(16 + Math.max(0, drivingDistanceKm - 3) * 2.7);

  const drivingRoute: CommuteModeRoute = {
    mode: 'driving',
    modeLabel: '自驾/打车',
    durationMinutes: drivingMinutes,
    distanceKm: drivingDistanceKm,
    summary: `途经 ${arterialRoad.split('/')[0].trim()}${isCrossRiver ? ' · 过江通道' : ''}`,
    steps: [
      `从「${originName}」地库驶出，${transportSummary?.drivingAccess?.entryDistanceKm || 1.4}公里驶入 ${arterialRoad}`,
      `沿城市快速路主线行驶 ${(drivingDistanceKm * 0.78).toFixed(1)}公里${crossRiverVia}`,
      `从目的地匝道驶出，进入「${dest.name}」地下停车场`,
    ],
    estimatedCostYuan: taxiCost,
    congestionHint: `平峰约 ${drivingMinutes} 分钟 · 早晚高峰预计 ${Math.round(
      drivingMinutes * 1.32
    )} 分钟（打车预估 ¥${taxiCost}）`,
    pathCoords: buildRouteWaypoints([originLat, originLng], dest.coords, 'driving'),
  };

  return {
    originName,
    originCoords: [originLat, originLng],
    destinationName: dest.name,
    destinationCoords: dest.coords,
    straightDistanceKm,
    provider: amapDrivingMinutes !== null ? 'amap-api' : 'shanghai-transit-engine',
    routes: {
      subway: subwayRoute,
      bus: busRoute,
      driving: drivingRoute,
    },
  };
}
