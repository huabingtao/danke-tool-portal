export interface PortalItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'tie' | 'calculator' | 'guide' | 'tools';
  url: string;
  iconName: string;
  badge?: string;
  badgeType?: 'emerald' | 'amber' | 'blue' | 'purple';
  featured?: boolean;
  tags: string[];
}

export const PORTAL_CATEGORIES = [
  { key: 'all', label: '全部项目' },
  { key: 'tie', label: '🚗 发车并列大厅' },
  { key: 'calculator', label: '🛒 活动计算器' },
  { key: 'guide', label: '📖 官方攻略站' },
  { key: 'tools', label: '🛠️ 特工工具集' },
];

export const PORTAL_ITEMS: PortalItem[] = [
  {
    id: 'danke-rank',
    title: '《弹壳特攻队》并列发车大厅',
    subtitle: '发车车次与计时器',
    description: '团队发车毫秒级倒计时与班次预约锁定。',
    category: 'tie',
    url: 'https://dankerank.guaguahub.cn',
    iconName: 'Car',
    badge: '核心项目',
    badgeType: 'emerald',
    featured: true,
    tags: ['组队发车', '毫秒级倒计时', '班次预约', '团队并列'],
  },
  {
    id: 'danke-market',
    title: '《弹壳特攻队》活动卖菜/挂菜价格看板',
    subtitle: '活动价格实时看板',
    description: '实时更新活动卖菜与商品价格数据，支持高价卖菜自动匹配与数据共享。',
    category: 'calculator',
    url: 'https://dankemarket.guaguahub.cn',
    iconName: 'ShoppingBag',
    badge: '热门工具',
    badgeType: 'amber',
    featured: true,
    tags: ['卖菜看板', '活动价格', '实时更新', '价格匹配'],
  },
];


