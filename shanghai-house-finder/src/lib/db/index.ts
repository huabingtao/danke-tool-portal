import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import type {
  CommunityPOIRecord,
  CrawlJobRecord,
  FloorPlanItem,
  HouseListing,
  HousePhotoItem,
  ListingFilterParams,
  ListingRecord,
  StaticTransportSummary,
} from './schema.ts';
import {
  buildStaticTransportSummary,
  calculateAmenityScores,
} from '../geo/poi-service.ts';

let dbInstance: DatabaseSync | null = null;
let currentDbPath: string | null = null;

export function getDbPath(): string {
  if (process.env.HOUSE_DB_PATH) {
    return process.env.HOUSE_DB_PATH;
  }
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'houses.db');
}

export function getDb(): DatabaseSync {
  const targetPath = getDbPath();
  if (dbInstance && currentDbPath === targetPath) {
    return dbInstance;
  }

  const dir = path.dirname(targetPath);
  if (targetPath !== ':memory:' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(targetPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL,
      listing_type TEXT NOT NULL,
      title TEXT NOT NULL,
      community_id TEXT NOT NULL,
      community_name TEXT NOT NULL,
      district TEXT NOT NULL,
      sub_district TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      total_price REAL NOT NULL,
      unit_price REAL NOT NULL,
      area REAL NOT NULL,
      rooms TEXT NOT NULL,
      room_count INTEGER NOT NULL,
      orientation TEXT NOT NULL,
      floor_info TEXT NOT NULL,
      build_year TEXT NOT NULL,
      decoration TEXT NOT NULL,
      elevator TEXT NOT NULL,
      property_fee TEXT NOT NULL,
      developer TEXT NOT NULL,
      floor_plan_urls TEXT NOT NULL,
      house_photo_urls TEXT NOT NULL,
      tags TEXT NOT NULL,
      transport_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_listings_total_price ON listings(total_price);
    CREATE INDEX IF NOT EXISTS idx_listings_unit_price ON listings(unit_price);
    CREATE INDEX IF NOT EXISTS idx_listings_district ON listings(district);
    CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(listing_type);

    CREATE TABLE IF NOT EXISTS community_pois (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      community_id TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      sub_info TEXT NOT NULL,
      distance_meters INTEGER NOT NULL,
      walk_minutes INTEGER NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      address TEXT DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_pois_community ON community_pois(community_id);

    CREATE TABLE IF NOT EXISTS crawl_jobs (
      id TEXT PRIMARY KEY,
      district TEXT NOT NULL,
      listing_type TEXT NOT NULL,
      min_price REAL,
      max_price REAL,
      max_items INTEGER NOT NULL,
      status TEXT NOT NULL,
      crawled_count INTEGER NOT NULL DEFAULT 0,
      enriched_poi_count INTEGER NOT NULL DEFAULT 0,
      logs_json TEXT NOT NULL DEFAULT '[]',
      started_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);

  dbInstance = db;
  currentDbPath = targetPath;
  return db;
}

export function resetDbConnection(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore
    }
    dbInstance = null;
    currentDbPath = null;
  }
}

/**
 * 插入或更新单套房源及其所属小区的周边配套（地铁、公交、商超、医院、学校、公园）
 */
export function upsertListingWithPOIs(
  record: ListingRecord,
  pois?: CommunityPOIRecord[]
): void {
  const db = getDb();

  const stmt = db.prepare(`
    INSERT INTO listings (
      id, source_url, listing_type, title, community_id, community_name,
      district, sub_district, address, lat, lng,
      total_price, unit_price, area, rooms, room_count,
      orientation, floor_info, build_year, decoration, elevator,
      property_fee, developer, floor_plan_urls, house_photo_urls,
      tags, transport_json, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      source_url = excluded.source_url,
      listing_type = excluded.listing_type,
      title = excluded.title,
      community_id = excluded.community_id,
      community_name = excluded.community_name,
      district = excluded.district,
      sub_district = excluded.sub_district,
      address = excluded.address,
      lat = excluded.lat,
      lng = excluded.lng,
      total_price = excluded.total_price,
      unit_price = excluded.unit_price,
      area = excluded.area,
      rooms = excluded.rooms,
      room_count = excluded.room_count,
      orientation = excluded.orientation,
      floor_info = excluded.floor_info,
      build_year = excluded.build_year,
      decoration = excluded.decoration,
      elevator = excluded.elevator,
      property_fee = excluded.property_fee,
      developer = excluded.developer,
      floor_plan_urls = excluded.floor_plan_urls,
      house_photo_urls = excluded.house_photo_urls,
      tags = excluded.tags,
      transport_json = excluded.transport_json,
      updated_at = excluded.updated_at
  `);

  stmt.run(
    record.id,
    record.source_url,
    record.listing_type,
    record.title,
    record.community_id,
    record.community_name,
    record.district,
    record.sub_district,
    record.address,
    record.lat,
    record.lng,
    record.total_price,
    record.unit_price,
    record.area,
    record.rooms,
    record.room_count,
    record.orientation,
    record.floor_info,
    record.build_year,
    record.decoration,
    record.elevator,
    record.property_fee,
    record.developer,
    record.floor_plan_urls,
    record.house_photo_urls,
    record.tags,
    record.transport_json,
    record.updated_at
  );

  if (pois && pois.length > 0) {
    const delStmt = db.prepare(`DELETE FROM community_pois WHERE community_id = ?`);
    delStmt.run(record.community_id);

    const insPoi = db.prepare(`
      INSERT INTO community_pois (
        community_id, category, name, sub_info, distance_meters, walk_minutes, lat, lng, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of pois) {
      insPoi.run(
        record.community_id,
        p.category,
        p.name,
        p.sub_info,
        p.distance_meters,
        p.walk_minutes,
        p.lat,
        p.lng,
        p.address || ''
      );
    }
  }
}

function hydrateListing(
  row: ListingRecord,
  poiMap: Map<string, CommunityPOIRecord[]>
): HouseListing {
  const rawPois = poiMap.get(row.community_id) || [];
  const groupedPois = {
    subway: rawPois.filter((p) => p.category === 'subway').sort((a, b) => a.distance_meters - b.distance_meters),
    bus: rawPois.filter((p) => p.category === 'bus').sort((a, b) => a.distance_meters - b.distance_meters),
    mall: rawPois.filter((p) => p.category === 'mall').sort((a, b) => a.distance_meters - b.distance_meters),
    hospital: rawPois.filter((p) => p.category === 'hospital').sort((a, b) => a.distance_meters - b.distance_meters),
    school: rawPois.filter((p) => p.category === 'school').sort((a, b) => a.distance_meters - b.distance_meters),
    park: rawPois.filter((p) => p.category === 'park').sort((a, b) => a.distance_meters - b.distance_meters),
  };

  let floorPlans: FloorPlanItem[] = [];
  let housePhotos: HousePhotoItem[] = [];
  let tags: string[] = [];
  let transportSummary: StaticTransportSummary;

  try {
    floorPlans = JSON.parse(row.floor_plan_urls || '[]');
  } catch {
    floorPlans = [];
  }

  try {
    housePhotos = JSON.parse(row.house_photo_urls || '[]');
  } catch {
    housePhotos = [];
  }

  try {
    tags = JSON.parse(row.tags || '[]');
  } catch {
    tags = [];
  }

  try {
    const parsed = JSON.parse(row.transport_json || '{}');
    if (parsed && parsed.drivingAccess) {
      transportSummary = parsed;
    } else {
      transportSummary = buildStaticTransportSummary(rawPois, row.district, row.sub_district);
    }
  } catch {
    transportSummary = buildStaticTransportSummary(rawPois, row.district, row.sub_district);
  }

  const amenityScores = calculateAmenityScores(rawPois);

  return {
    id: row.id,
    sourceUrl: row.source_url,
    listingType: row.listing_type,
    title: row.title,
    communityId: row.community_id,
    communityName: row.community_name,
    district: row.district,
    subDistrict: row.sub_district,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    totalPrice: row.total_price,
    unitPrice: row.unit_price,
    area: row.area,
    rooms: row.rooms,
    roomCount: row.room_count,
    orientation: row.orientation,
    floorInfo: row.floor_info,
    buildYear: row.build_year,
    decoration: row.decoration,
    elevator: row.elevator,
    propertyFee: row.property_fee,
    developer: row.developer,
    floorPlans,
    housePhotos,
    tags,
    transportSummary,
    pois: groupedPois,
    amenityScores,
    updatedAt: row.updated_at,
  };
}

export interface QueryListingsResult {
  listings: HouseListing[];
  stats: {
    totalCount: number;
    secondHandCount: number;
    newHouseCount: number;
    avgTotalPrice: number;
    avgUnitPrice: number;
    minTotalPrice: number;
    maxTotalPrice: number;
    minUnitPrice: number;
    maxUnitPrice: number;
    districtDistribution: Record<string, number>;
  };
}

/**
 * 多维检索上海市房源（支持总价区间、单价区间、二手/新房、区域、居室、面积、关键词及排序）
 */
export function queryListings(filters: ListingFilterParams = {}): QueryListingsResult {
  const db = getDb();
  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (typeof filters.minTotalPrice === 'number' && !Number.isNaN(filters.minTotalPrice) && filters.minTotalPrice > 0) {
    conditions.push('total_price >= ?');
    params.push(filters.minTotalPrice);
  }

  if (typeof filters.maxTotalPrice === 'number' && !Number.isNaN(filters.maxTotalPrice) && filters.maxTotalPrice > 0) {
    conditions.push('total_price <= ?');
    params.push(filters.maxTotalPrice);
  }

  if (typeof filters.minUnitPrice === 'number' && !Number.isNaN(filters.minUnitPrice) && filters.minUnitPrice > 0) {
    conditions.push('unit_price >= ?');
    params.push(filters.minUnitPrice);
  }

  if (typeof filters.maxUnitPrice === 'number' && !Number.isNaN(filters.maxUnitPrice) && filters.maxUnitPrice > 0) {
    conditions.push('unit_price <= ?');
    params.push(filters.maxUnitPrice);
  }

  if (filters.listingType && filters.listingType !== 'all') {
    conditions.push('listing_type = ?');
    params.push(filters.listingType);
  }

  if (filters.district && filters.district !== 'all') {
    conditions.push('district = ?');
    params.push(filters.district);
  }

  if (typeof filters.rooms === 'number' && filters.rooms > 0) {
    if (filters.rooms >= 4) {
      conditions.push('room_count >= 4');
    } else {
      conditions.push('room_count = ?');
      params.push(filters.rooms);
    }
  }

  if (typeof filters.minArea === 'number' && !Number.isNaN(filters.minArea) && filters.minArea > 0) {
    conditions.push('area >= ?');
    params.push(filters.minArea);
  }

  if (typeof filters.maxArea === 'number' && !Number.isNaN(filters.maxArea) && filters.maxArea > 0) {
    conditions.push('area <= ?');
    params.push(filters.maxArea);
  }

  if (filters.keyword && filters.keyword.trim() !== '') {
    const kw = `%${filters.keyword.trim()}%`;
    conditions.push(
      '(title LIKE ? OR community_name LIKE ? OR district LIKE ? OR sub_district LIKE ? OR address LIKE ? OR tags LIKE ?)'
    );
    params.push(kw, kw, kw, kw, kw, kw);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'ORDER BY updated_at DESC, total_price ASC';
  switch (filters.sortBy) {
    case 'total_asc':
      orderBy = 'ORDER BY total_price ASC';
      break;
    case 'total_desc':
      orderBy = 'ORDER BY total_price DESC';
      break;
    case 'unit_asc':
      orderBy = 'ORDER BY unit_price ASC';
      break;
    case 'unit_desc':
      orderBy = 'ORDER BY unit_price DESC';
      break;
    case 'area_desc':
      orderBy = 'ORDER BY area DESC';
      break;
  }

  const rows = db
    .prepare(`SELECT * FROM listings ${whereClause} ${orderBy}`)
    .all(...params) as unknown as ListingRecord[];

  const allPois = db
    .prepare(`SELECT * FROM community_pois ORDER BY distance_meters ASC`)
    .all() as unknown as CommunityPOIRecord[];

  const poiMap = new Map<string, CommunityPOIRecord[]>();
  for (const poi of allPois) {
    const arr = poiMap.get(poi.community_id) || [];
    arr.push(poi);
    poiMap.set(poi.community_id, arr);
  }

  let listings = rows.map((r) => hydrateListing(r, poiMap));

  if (typeof filters.maxSubwayMeters === 'number' && filters.maxSubwayMeters > 0) {
    listings = listings.filter((item) => {
      const dist = item.transportSummary.nearestSubway?.distanceMeters ?? 9999;
      return dist <= filters.maxSubwayMeters!;
    });
  }

  if (filters.sortBy === 'subway_asc') {
    listings.sort((a, b) => {
      const da = a.transportSummary.nearestSubway?.distanceMeters ?? 9999;
      const dbDist = b.transportSummary.nearestSubway?.distanceMeters ?? 9999;
      return da - dbDist;
    });
  }

  // 计算统计摘要
  const totalCount = listings.length;
  const secondHandCount = listings.filter((l) => l.listingType === 'second_hand').length;
  const newHouseCount = listings.filter((l) => l.listingType === 'new_house').length;
  const avgTotalPrice =
    totalCount > 0
      ? Math.round(listings.reduce((acc, cur) => acc + cur.totalPrice, 0) / totalCount)
      : 0;
  const avgUnitPrice =
    totalCount > 0
      ? Math.round(listings.reduce((acc, cur) => acc + cur.unitPrice, 0) / totalCount)
      : 0;

  const totalPrices = listings.map((l) => l.totalPrice);
  const unitPrices = listings.map((l) => l.unitPrice);

  const districtDistribution: Record<string, number> = {};
  for (const l of listings) {
    districtDistribution[l.district] = (districtDistribution[l.district] || 0) + 1;
  }

  return {
    listings,
    stats: {
      totalCount,
      secondHandCount,
      newHouseCount,
      avgTotalPrice,
      avgUnitPrice,
      minTotalPrice: totalPrices.length > 0 ? Math.min(...totalPrices) : 0,
      maxTotalPrice: totalPrices.length > 0 ? Math.max(...totalPrices) : 0,
      minUnitPrice: unitPrices.length > 0 ? Math.min(...unitPrices) : 0,
      maxUnitPrice: unitPrices.length > 0 ? Math.max(...unitPrices) : 0,
      districtDistribution,
    },
  };
}

export function getListingById(id: string): HouseListing | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM listings WHERE id = ?`)
    .get(id) as unknown as ListingRecord | undefined;
  if (!row) return null;

  const pois = db
    .prepare(`SELECT * FROM community_pois WHERE community_id = ? ORDER BY distance_meters ASC`)
    .all(row.community_id) as unknown as CommunityPOIRecord[];

  const poiMap = new Map<string, CommunityPOIRecord[]>();
  poiMap.set(row.community_id, pois);
  return hydrateListing(row, poiMap);
}

export function createCrawlJob(job: CrawlJobRecord): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO crawl_jobs (
      id, district, listing_type, min_price, max_price, max_items,
      status, crawled_count, enriched_poi_count, logs_json, started_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.district,
    job.listing_type,
    job.min_price ?? null,
    job.max_price ?? null,
    job.max_items,
    job.status,
    job.crawled_count,
    job.enriched_poi_count,
    job.logs_json,
    job.started_at,
    job.completed_at ?? null
  );
}

export function updateCrawlJob(
  id: string,
  patch: Partial<Pick<CrawlJobRecord, 'status' | 'crawled_count' | 'enriched_poi_count' | 'logs_json' | 'completed_at'>>
): void {
  const db = getDb();
  const current = db
    .prepare(`SELECT * FROM crawl_jobs WHERE id = ?`)
    .get(id) as unknown as CrawlJobRecord | undefined;
  if (!current) return;

  db.prepare(`
    UPDATE crawl_jobs SET
      status = ?,
      crawled_count = ?,
      enriched_poi_count = ?,
      logs_json = ?,
      completed_at = ?
    WHERE id = ?
  `).run(
    patch.status ?? current.status,
    patch.crawled_count ?? current.crawled_count,
    patch.enriched_poi_count ?? current.enriched_poi_count,
    patch.logs_json ?? current.logs_json,
    patch.completed_at ?? current.completed_at ?? null,
    id
  );
}

export function getRecentCrawlJobs(limit = 10): Array<
  Omit<CrawlJobRecord, 'logs_json'> & { logs: string[] }
> {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM crawl_jobs ORDER BY started_at DESC LIMIT ?`)
    .all(limit) as unknown as CrawlJobRecord[];
  return rows.map((r) => {
    let logs: string[] = [];
    try {
      logs = JSON.parse(r.logs_json || '[]');
    } catch {
      logs = [];
    }
    const { logs_json: _ignored, ...rest } = r;
    return { ...rest, logs };
  });
}
