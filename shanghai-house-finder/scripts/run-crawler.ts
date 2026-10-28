import { executeCrawlTask } from '../src/lib/crawler/beike-crawler.ts';

async function main() {
  const district = process.argv[2] || 'all';
  const listingType = (process.argv[3] as 'all' | 'second_hand' | 'new_house') || 'all';
  console.log(`🕷️ 启动上海市房源采集任务: 区域=${district}, 类型=${listingType}`);
  const result = await executeCrawlTask({
    district,
    listingType,
    maxItems: 8,
  });
  for (const line of result.logs) {
    console.log(line);
  }
}

main().catch((err) => {
  console.error('❌ 爬虫运行失败:', err);
  process.exit(1);
});
