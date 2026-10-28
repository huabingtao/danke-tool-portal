import { seedShanghaiRealData } from '../src/lib/crawler/beike-crawler.ts';
import { queryListings } from '../src/lib/db/index.ts';

async function main() {
  console.log('🚀 正在初始化上海市二手房与新房真实房源数据库...');
  const { seededListings, seededPois } = await seedShanghaiRealData();
  const { stats } = queryListings();

  console.log(`✅ 数据初始化完成！`);
  console.log(`   - 已入库房源总数: ${seededListings} 套 (二手房: ${stats.secondHandCount} 套, 新房: ${stats.newHouseCount} 套)`);
  console.log(`   - 已入库周边配套(地铁/公交/商超/医院/学校/公园): ${seededPois} 个空间点位`);
  console.log(`   - 总价覆盖区间: ${stats.minTotalPrice} 万 ~ ${stats.maxTotalPrice} 万 (均价: ${stats.avgTotalPrice} 万)`);
  console.log(`   - 单价覆盖区间: ${stats.minUnitPrice} 元/㎡ ~ ${stats.maxUnitPrice} 元/㎡ (均价: ${stats.avgUnitPrice} 元/㎡)`);
  console.log(`   - 行政区分布:`, JSON.stringify(stats.districtDistribution));
}

main().catch((err) => {
  console.error('❌ Seed 失败:', err);
  process.exit(1);
});
