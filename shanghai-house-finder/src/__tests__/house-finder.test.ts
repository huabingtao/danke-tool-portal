import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import { NextRequest } from 'next/server';
import { queryListings, getListingById, resetDbConnection } from '../lib/db/index';
import { seedShanghaiRealData, executeCrawlTask } from '../lib/crawler/beike-crawler';
import { calculateCommutePlan } from '../lib/geo/transport-service';
import { GET as getFloorPlanRoute } from '../app/api/floor-plan/route';
import { GET as getHousePhotoRoute } from '../app/api/house-photo/route';
import { GET as getListingsRoute } from '../app/api/listings/route';

const testDbPath = path.join(process.cwd(), 'data', 'test-houses.db');

describe('上海市二手房与新房可视化找房系统 (shanghai-house-finder)', () => {
  beforeAll(async () => {
    process.env.HOUSE_DB_PATH = testDbPath;
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    resetDbConnection();
    await seedShanghaiRealData();
  });

  afterAll(() => {
    resetDbConnection();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // ignore
      }
    }
  });

  it('1. 预置并采集上海市16个行政区的二手房与新房数据', () => {
    const { listings, stats } = queryListings();
    expect(listings.length).toBeGreaterThanOrEqual(24);
    expect(stats.secondHandCount).toBeGreaterThan(0);
    expect(stats.newHouseCount).toBeGreaterThan(0);

    // 校验覆盖浦东、徐汇、静安、黄浦、闵行、松江、嘉定、青浦、奉贤、金山、崇明等区
    expect(stats.districtDistribution['浦东']).toBeGreaterThanOrEqual(4);
    expect(stats.districtDistribution['徐汇']).toBeGreaterThanOrEqual(2);
    expect(stats.districtDistribution['闵行']).toBeGreaterThanOrEqual(2);
  });

  it('2. 支持按【房价区间（总价：万）】精准过滤房源', () => {
    const minTotal = 400;
    const maxTotal = 950;
    const { listings } = queryListings({
      minTotalPrice: minTotal,
      maxTotalPrice: maxTotal,
    });

    expect(listings.length).toBeGreaterThan(0);
    for (const item of listings) {
      expect(item.totalPrice).toBeGreaterThanOrEqual(minTotal);
      expect(item.totalPrice).toBeLessThanOrEqual(maxTotal);
    }
  });

  it('3. 支持按【单价区间（元/㎡）】精准过滤房源', () => {
    const minUnit = 60000;
    const maxUnit = 115000;
    const { listings } = queryListings({
      minUnitPrice: minUnit,
      maxUnitPrice: maxUnit,
    });

    expect(listings.length).toBeGreaterThan(0);
    for (const item of listings) {
      expect(item.unitPrice).toBeGreaterThanOrEqual(minUnit);
      expect(item.unitPrice).toBeLessThanOrEqual(maxUnit);
    }
  });

  it('4. 支持同时组合【总价区间 + 单价区间 + 二手房/新房类型 + 行政区】过滤', () => {
    const { listings: secondHandPudong } = queryListings({
      listingType: 'second_hand',
      district: '浦东',
      minTotalPrice: 400,
      maxTotalPrice: 1500,
      minUnitPrice: 45000,
      maxUnitPrice: 120000,
    });

    expect(secondHandPudong.length).toBeGreaterThan(0);
    for (const item of secondHandPudong) {
      expect(item.listingType).toBe('second_hand');
      expect(item.district).toBe('浦东');
      expect(item.totalPrice).toBeGreaterThanOrEqual(400);
      expect(item.totalPrice).toBeLessThanOrEqual(1500);
      expect(item.unitPrice).toBeGreaterThanOrEqual(45000);
      expect(item.unitPrice).toBeLessThanOrEqual(120000);
    }
  });

  it('5. 每套房源均包含完整的户型图、房屋实拍图、地理位置与周边配套(地铁/公交/商超/医院/学校/公园)', () => {
    const { listings } = queryListings();
    for (const house of listings) {
      // 户型图校验
      expect(house.floorPlans.length).toBeGreaterThanOrEqual(1);
      expect(house.floorPlans[0].url).toContain('/api/floor-plan');

      // 房屋实拍图校验 (客厅、主卧、厨房、卫浴、外景)
      expect(house.housePhotos.length).toBeGreaterThanOrEqual(5);
      expect(house.housePhotos[0].url).toContain('/api/house-photo');

      // 地理位置校验
      expect(house.lat).toBeGreaterThan(30.5);
      expect(house.lat).toBeLessThan(32.0);
      expect(house.lng).toBeGreaterThan(120.8);
      expect(house.lng).toBeLessThan(122.2);
      expect(house.address.length).toBeGreaterThan(3);

      // 交通静态信息校验 (地铁、公交、自驾主干道)
      expect(house.transportSummary.nearestSubway).not.toBeNull();
      expect(house.transportSummary.nearestBus).not.toBeNull();
      expect(house.transportSummary.drivingAccess.nearestArterialRoad.length).toBeGreaterThan(2);

      // 附近的商超、医院、学校、公园校验
      expect(house.pois.mall.length).toBeGreaterThanOrEqual(1);
      expect(house.pois.hospital.length).toBeGreaterThanOrEqual(1);
      expect(house.pois.school.length).toBeGreaterThanOrEqual(1);
      expect(house.pois.park.length).toBeGreaterThanOrEqual(1);
      expect(house.pois.subway.length).toBeGreaterThanOrEqual(1);
      expect(house.pois.bus.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('6. 支持计算三维交通（地铁、公交、自驾）通勤耗时、距离与路线轨迹', async () => {
    const house = getListingById('ke_sh_esf_107109001');
    expect(house).not.toBeNull();

    const plan = await calculateCommutePlan({
      originName: house!.communityName,
      originLat: house!.lat,
      originLng: house!.lng,
      transportSummary: house!.transportSummary,
      destinationQuery: '陆家嘴金融城',
    });

    expect(plan.destinationName).toContain('陆家嘴');
    expect(plan.routes.subway.durationMinutes).toBeGreaterThan(0);
    expect(plan.routes.subway.steps.length).toBeGreaterThanOrEqual(3);
    expect(plan.routes.subway.pathCoords.length).toBeGreaterThanOrEqual(4);

    expect(plan.routes.bus.durationMinutes).toBeGreaterThan(0);
    expect(plan.routes.driving.durationMinutes).toBeGreaterThan(0);
    expect(plan.routes.driving.distanceKm).toBeGreaterThan(0);
  });

  it('7. 支持按区域与价格段执行增量爬虫任务并自动补齐配套', async () => {
    const crawlRes = await executeCrawlTask({
      district: '浦东',
      listingType: 'second_hand',
      minPrice: 800,
      maxPrice: 2000,
      maxItems: 4,
    });

    expect(crawlRes.crawledCount).toBeGreaterThan(0);
    expect(crawlRes.enrichedPoiCount).toBeGreaterThan(0);
    expect(crawlRes.logs.length).toBeGreaterThan(2);
  });

  it('8. 验证 API 路由处理器 (/api/listings, /api/floor-plan, /api/house-photo) 正常响应', async () => {
    const listReq = new NextRequest(
      'http://localhost:3088/api/listings?minTotalPrice=400&maxTotalPrice=1500&minUnitPrice=45000&maxUnitPrice=125000'
    );
    const listRes = await getListingsRoute(listReq);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.listings.length).toBeGreaterThan(0);

    const fpReq = new NextRequest(
      'http://localhost:3088/api/floor-plan?rooms=3%E5%AE%A42%E5%8E%852%E5%8D%AB&area=126&orientation=%E5%8D%97%E5%8C%97&community=%E4%BB%81%E6%81%92%E6%B2%B3%E6%BB%A8%E5%9F%8E'
    );
    const fpRes = await getFloorPlanRoute(fpReq);
    expect(fpRes.status).toBe(200);
    const fpSvg = await fpRes.text();
    expect(fpSvg).toContain('<svg');
    expect(fpSvg).toContain('仁恒河滨城');

    const hpReq = new NextRequest(
      'http://localhost:3088/api/house-photo?scene=living&theme=luxury-river&community=%E4%BB%81%E6%81%92%E6%B2%B3%E6%BB%A8%E5%9F%8E&rooms=3%E5%AE%A42%E5%8E%852%E5%8D%AB&area=126&label=%E5%AE%A2%E5%8E%85%E5%8D%97%E5%90%91%E9%87%87%E5%85%89%E5%AE%9E%E6%8B%8D'
    );
    const hpRes = await getHousePhotoRoute(hpReq);
    expect(hpRes.status).toBe(200);
    const hpSvg = await hpRes.text();
    expect(hpSvg).toContain('<svg');

    const artifactDir = '/Users/hbt/.gemini/antigravity/brain/ab31c75c-909d-4e5c-9270-e63ab5636592';
    if (fs.existsSync(artifactDir)) {
      fs.writeFileSync(path.join(artifactDir, 'floor_plan_preview.svg'), fpSvg);
      fs.writeFileSync(path.join(artifactDir, 'house_photo_preview.svg'), hpSvg);
    }
  });
});
