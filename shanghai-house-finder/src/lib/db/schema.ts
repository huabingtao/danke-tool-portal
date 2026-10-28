export type ListingType = 'second_hand' | 'new_house';

export type POICategory = 'subway' | 'bus' | 'mall' | 'hospital' | 'school' | 'park';

export interface HousePhotoItem {
  url: string;
  label: string; // 如: "客厅实拍" | "主卧实拍" | "次卧实拍" | "厨房实拍" | "卫浴实拍" | "外立面/小区" | "样板间"
  roomType?: string;
}

export interface FloorPlanItem {
  url: string;
  title: string; // 如: "3室2厅1卫 95㎡ 主力户型图"
  rooms: string;
  area: number;
  orientation: string;
  dimensions?: string; // 如: "南向面宽 10.2m · 客厅开间 3.9m"
}

export interface CommunityPOIRecord {
  id?: number;
  community_id: string;
  category: POICategory;
  name: string;
  sub_info: string; // 如: "地铁2号线/9号线" | "三甲综合医院" | "市重点九年一贯制" | "大型综合购物中心"
  distance_meters: number;
  walk_minutes: number;
  lat: number;
  lng: number;
  address?: string;
}

export interface StaticTransportSummary {
  nearestSubway: {
    name: string;
    lines: string[];
    distanceMeters: number;
    walkMinutes: number;
  } | null;
  nearestBus: {
    name: string;
    routes: string[];
    distanceMeters: number;
    walkMinutes: number;
    stopCountWithin500m: number;
  } | null;
  drivingAccess: {
    nearestArterialRoad: string; // 如: "内环高架路 (浦东南路入口)"
    entryDistanceKm: number;
    driveToRingMinutes: number;
    parkingInfo: string; // 如: "车位比 1:1.2 · 地下停车 ¥400/月"
  };
}

export interface AmenityRadarScores {
  transport: number; // 交通便捷度 (0-100)
  mall: number;      // 商业繁华度 (0-100)
  hospital: number;  // 医疗保障度 (0-100)
  school: number;    // 教育资源度 (0-100)
  park: number;      // 生态宜居度 (0-100)
  overall: number;   // 综合评分 (0-100)
}

export interface ListingRecord {
  id: string;
  source_url: string;
  listing_type: ListingType;
  title: string;
  community_id: string;
  community_name: string;
  district: string;
  sub_district: string;
  address: string;
  lat: number;
  lng: number;
  total_price: number; // 万元
  unit_price: number;  // 元/㎡
  area: number;        // ㎡
  rooms: string;
  room_count: number;
  orientation: string;
  floor_info: string;
  build_year: string;
  decoration: string;  // 精装 / 简装 / 毛坯 / 豪装
  elevator: string;    // 有电梯 (两梯两户) / 无电梯
  property_fee: string;
  developer: string;
  floor_plan_urls: string;  // JSON string of FloorPlanItem[]
  house_photo_urls: string; // JSON string of HousePhotoItem[]
  tags: string;             // JSON string of string[]
  transport_json: string;   // JSON string of StaticTransportSummary
  updated_at: string;
}

export interface HouseListing {
  id: string;
  sourceUrl: string;
  listingType: ListingType;
  title: string;
  communityId: string;
  communityName: string;
  district: string;
  subDistrict: string;
  address: string;
  lat: number;
  lng: number;
  totalPrice: number; // 万元
  unitPrice: number;  // 元/㎡
  area: number;       // ㎡
  rooms: string;
  roomCount: number;
  orientation: string;
  floorInfo: string;
  buildYear: string;
  decoration: string;
  elevator: string;
  propertyFee: string;
  developer: string;
  floorPlans: FloorPlanItem[];
  housePhotos: HousePhotoItem[];
  tags: string[];
  transportSummary: StaticTransportSummary;
  pois: {
    subway: CommunityPOIRecord[];
    bus: CommunityPOIRecord[];
    mall: CommunityPOIRecord[];
    hospital: CommunityPOIRecord[];
    school: CommunityPOIRecord[];
    park: CommunityPOIRecord[];
  };
  amenityScores: AmenityRadarScores;
  updatedAt: string;
}

export interface ListingFilterParams {
  minTotalPrice?: number; // 万元
  maxTotalPrice?: number; // 万元
  minUnitPrice?: number;  // 元/㎡
  maxUnitPrice?: number;  // 元/㎡
  listingType?: 'all' | ListingType;
  district?: string;      // 'all' 或上海16个行政区名
  rooms?: number;         // 0=全部, 1, 2, 3, 4(4室及以上)
  minArea?: number;
  maxArea?: number;
  maxSubwayMeters?: number;
  keyword?: string;
  sortBy?: 'default' | 'total_asc' | 'total_desc' | 'unit_asc' | 'unit_desc' | 'area_desc' | 'subway_asc';
}

export interface CommuteModeRoute {
  mode: 'subway' | 'bus' | 'driving';
  modeLabel: string;
  durationMinutes: number;
  distanceKm: number;
  summary: string;
  steps: string[];
  transferCount?: number;
  walkingMeters?: number;
  estimatedCostYuan: number;
  congestionHint?: string;
  pathCoords: [number, number][]; // [[lat, lng], ...]
}

export interface CommutePlanResult {
  originName: string;
  originCoords: [number, number];
  destinationName: string;
  destinationCoords: [number, number];
  straightDistanceKm: number;
  provider: 'amap-api' | 'shanghai-transit-engine';
  routes: {
    subway: CommuteModeRoute;
    bus: CommuteModeRoute;
    driving: CommuteModeRoute;
  };
}

export interface CrawlJobRecord {
  id: string;
  district: string;
  listing_type: 'all' | ListingType;
  min_price?: number;
  max_price?: number;
  max_items: number;
  status: 'running' | 'completed' | 'failed';
  crawled_count: number;
  enriched_poi_count: number;
  logs_json: string; // JSON string[]
  started_at: string;
  completed_at?: string;
}

export const SHANGHAI_DISTRICTS = [
  { code: 'pudong', name: '浦东', center: [31.2215, 121.5444] as [number, number] },
  { code: 'xuhui', name: '徐汇', center: [31.1885, 121.4365] as [number, number] },
  { code: 'jingan', name: '静安', center: [31.2478, 121.4482] as [number, number] },
  { code: 'huangpu', name: '黄浦', center: [31.2317, 121.4854] as [number, number] },
  { code: 'changning', name: '长宁', center: [31.2078, 121.3905] as [number, number] },
  { code: 'minhang', name: '闵行', center: [31.1128, 121.3817] as [number, number] },
  { code: 'putuo', name: '普陀', center: [31.2495, 121.3956] as [number, number] },
  { code: 'yangpu', name: '杨浦', center: [31.2815, 121.5260] as [number, number] },
  { code: 'hongkou', name: '虹口', center: [31.2762, 121.4846] as [number, number] },
  { code: 'baoshan', name: '宝山', center: [31.3688, 121.4455] as [number, number] },
  { code: 'jiading', name: '嘉定', center: [31.3245, 121.2655] as [number, number] },
  { code: 'songjiang', name: '松江', center: [31.0822, 121.2315] as [number, number] },
  { code: 'qingpu', name: '青浦', center: [31.1650, 121.1742] as [number, number] },
  { code: 'fengxian', name: '奉贤', center: [30.9465, 121.4741] as [number, number] },
  { code: 'jinshan', name: '金山', center: [30.7416, 121.3426] as [number, number] },
  { code: 'chongming', name: '崇明', center: [31.6228, 121.3976] as [number, number] },
] as const;

export const SHANGHAI_COMMUTE_HUBS = [
  { id: 'lujiazui', name: '陆家嘴金融城', district: '浦东', coords: [31.2389, 121.5015] as [number, number], lines: ['2号线', '14号线'] },
  { id: 'zhangjiang', name: '张江科学城/高科', district: '浦东', coords: [31.2016, 121.6025] as [number, number], lines: ['2号线', '13号线'] },
  { id: 'caohejing', name: '漕河泾开发区', district: '徐汇', coords: [31.1695, 121.3992] as [number, number], lines: ['9号线', '12号线', '15号线'] },
  { id: 'jingansi', name: '静安寺/南京西路', district: '静安', coords: [31.2244, 121.4468] as [number, number], lines: ['2号线', '7号线', '14号线'] },
  { id: 'peoplesquare', name: '人民广场/外滩', district: '黄浦', coords: [31.2328, 121.4752] as [number, number], lines: ['1号线', '2号线', '8号线'] },
  { id: 'xujiahui', name: '徐家汇商圈', district: '徐汇', coords: [31.1946, 121.4378] as [number, number], lines: ['1号线', '9号线', '11号线'] },
  { id: 'qiantan', name: '前滩国际商务区', district: '浦东', coords: [31.1538, 121.4795] as [number, number], lines: ['6号线', '8号线', '11号线'] },
  { id: 'hongqiao', name: '虹桥商务区/枢纽', district: '闵行', coords: [31.1942, 121.3189] as [number, number], lines: ['2号线', '10号线', '17号线'] },
  { id: 'wujiaochang', name: '五角场/大创智', district: '杨浦', coords: [31.2986, 121.5142] as [number, number], lines: ['10号线'] },
] as const;
