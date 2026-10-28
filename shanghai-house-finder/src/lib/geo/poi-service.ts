import type {
  AmenityRadarScores,
  CommunityPOIRecord,
  POICategory,
  StaticTransportSummary,
} from '../db/schema.ts';

/**
 * 计算两个经纬度坐标之间的球面距离（单位：米）
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * 步行耗时估算（按上海城市道路绕行系数 1.22，步速 78m/min）
 */
export function estimateWalkMinutes(straightMeters: number): number {
  const walkingDistance = Math.round(straightMeters * 1.18);
  return Math.max(1, Math.round(walkingDistance / 78));
}

export interface SpatialPOIAnchor {
  category: POICategory;
  name: string;
  sub_info: string;
  lat: number;
  lng: number;
  district: string;
}

/**
 * 上海市真实核心地铁、公交枢纽、商超、医院、学校、公园地理坐标锚点库
 * 支持在免 Key 离线/受限环境下与爬虫提取点位融合计算真实空间距离
 */
export const SHANGHAI_REAL_POI_ANCHORS: SpatialPOIAnchor[] = [
  // ================= 浦东新区 (联洋 / 张江 / 前滩 / 陆家嘴 / 唐镇 / 三林) =================
  { category: 'subway', name: '9号线 芳甸路站', sub_info: '地铁9号线 · 3号口', lat: 31.2298, lng: 121.5558, district: '浦东' },
  { category: 'subway', name: '2号线/9号线 世纪大道站', sub_info: '地铁2/4/6/9号线 四线换乘枢纽', lat: 31.2289, lng: 121.5319, district: '浦东' },
  { category: 'subway', name: '18号线 迎春路站', sub_info: '地铁18号线 · 联洋核心站', lat: 31.2226, lng: 121.5562, district: '浦东' },
  { category: 'subway', name: '2号线 张江高科站', sub_info: '地铁2号线 · 科学城门户', lat: 31.2018, lng: 121.5928, district: '浦东' },
  { category: 'subway', name: '13号线 中科路站', sub_info: '地铁13号线 · 近张江科学之门', lat: 31.1835, lng: 121.6088, district: '浦东' },
  { category: 'subway', name: '6/8/11号线 东方体育中心站', sub_info: '地铁6/8/11号线 · 前滩核心枢纽', lat: 31.1535, lng: 121.4803, district: '浦东' },
  { category: 'subway', name: '2号线 唐镇站', sub_info: '地铁2号线 · 阳光城天娇旁', lat: 31.2138, lng: 121.6626, district: '浦东' },
  { category: 'bus', name: '丁香路芳甸路公交站', sub_info: '983路 / 987路 / 浦东35路 / 花木1路', lat: 31.2255, lng: 121.5572, district: '浦东' },
  { category: 'bus', name: '祖冲之路科苑路公交站', sub_info: '浦东11路 / 浦东12路 / 张江环线 / 大桥六线', lat: 31.2031, lng: 121.5992, district: '浦东' },
  { category: 'bus', name: '耀体路平家桥路站 (前滩公交枢纽)', sub_info: '84路 / 174路 / 浦东97路', lat: 31.1552, lng: 121.4785, district: '浦东' },
  { category: 'bus', name: '高科东路唐安路公交站', sub_info: '浦东2路 / 浦东20路 / 636路', lat: 31.2156, lng: 121.6601, district: '浦东' },
  { category: 'mall', name: '大拇指广场 & 联洋广场', sub_info: '大型社区商业综合体 · 家乐福/盒马鲜生/餐饮影院', lat: 31.2268, lng: 121.5579, district: '浦东' },
  { category: 'mall', name: '世纪汇广场 & 陆家嘴九六广场', sub_info: '浦东核心级购物中心 · 300+品牌入驻', lat: 31.2285, lng: 121.5332, district: '浦东' },
  { category: 'mall', name: '长泰广场 & 汇智国际商业中心', sub_info: '张江旗舰级开放式商业街区 · 盒马鲜生/影城', lat: 31.2046, lng: 121.6012, district: '浦东' },
  { category: 'mall', name: '前滩太古里 & 晶耀前滩', sub_info: '国际一线奢品购物中心 · 滨江旗舰生活圈', lat: 31.1539, lng: 121.4819, district: '浦东' },
  { category: 'mall', name: '唐镇阳光天地购物中心', sub_info: '区域核心MALL · 永辉超市/亲子餐饮', lat: 31.2132, lng: 121.6632, district: '浦东' },
  { category: 'hospital', name: '上海交通大学医学院附属仁济医院(东院)', sub_info: '三级甲等综合医院 · 综合实力全国前十', lat: 31.2105, lng: 121.5295, district: '浦东' },
  { category: 'hospital', name: '上海中医药大学附属曙光医院(东院)', sub_info: '三级甲等医院 · 张江科学城核心医疗', lat: 31.1992, lng: 121.6065, district: '浦东' },
  { category: 'hospital', name: '莱佛士医院 & 东方医院(南院)', sub_info: '三级甲等综合医院 + 国际医疗中心', lat: 31.1588, lng: 121.4862, district: '浦东' },
  { category: 'hospital', name: '浦东新区人民医院(川沙总院)', sub_info: '三级乙等区域医疗中心 · 24h急诊', lat: 31.1965, lng: 121.6882, district: '浦东' },
  { category: 'school', name: '上海市进才实验小学 & 进才实验中学', sub_info: '浦东第一梯队公办九年一贯制名校', lat: 31.2248, lng: 121.5525, district: '浦东' },
  { category: 'school', name: '张江集团中学 & 竹园小学(张江校区)', sub_info: '浦东顶尖理科强校 + 重点公办小学', lat: 31.1975, lng: 121.5968, district: '浦东' },
  { category: 'school', name: '华东师范大学第二附属中学前滩学校', sub_info: '华二系九年一贯制公办第一梯队', lat: 31.1518, lng: 121.4776, district: '浦东' },
  { category: 'school', name: '福山唐城外国语小学 & 建平培德实验中学', sub_info: '浦东福山正达系名小 + 建平系初中', lat: 31.2175, lng: 121.6588, district: '浦东' },
  { category: 'park', name: '世纪公园 (140公顷城市绿肺)', sub_info: '国家4A级城市森林湖泊公园 · 环湖跑道5km', lat: 31.2155, lng: 121.5515, district: '浦东' },
  { category: 'park', name: '广兰公园 & 张江艺术公园', sub_info: '张江科学城滨水生态绿地', lat: 31.2072, lng: 121.6085, district: '浦东' },
  { category: 'park', name: '前滩休闲公园 & 前滩友城公园', sub_info: '黄浦江一线滨江绿道 · 漫步骑行圣地', lat: 31.1542, lng: 121.4735, district: '浦东' },
  { category: 'park', name: '唐丰公园 & 金海湿地公园', sub_info: '大型生态湿地与社区体育公园', lat: 31.2215, lng: 121.6562, district: '浦东' },

  // ================= 徐汇区 (徐家汇 / 康健 / 徐汇滨江 / 漕河泾) =================
  { category: 'subway', name: '1/9/11号线 徐家汇站', sub_info: '地铁1/9/11号线 三线超级枢纽', lat: 31.1946, lng: 121.4378, district: '徐汇' },
  { category: 'subway', name: '11号线 云锦路站 / 龙耀路站', sub_info: '地铁11号线 · 徐汇滨江西岸核心', lat: 31.1756, lng: 121.4582, district: '徐汇' },
  { category: 'subway', name: '1号线/12号线 漕宝路站', sub_info: '地铁1号线/12号线 双轨换乘', lat: 31.1682, lng: 121.4335, district: '徐汇' },
  { category: 'bus', name: '肇嘉浜路天平路公交枢纽', sub_info: '43路 / 50路 / 72路 / 806路 / 926路 / 徐闵线', lat: 31.1965, lng: 121.4415, district: '徐汇' },
  { category: 'bus', name: '龙腾大道丰谷路公交站', sub_info: '浦西滨江1路 / 1222路 / 734路', lat: 31.1742, lng: 121.4605, district: '徐汇' },
  { category: 'mall', name: '港汇恒隆广场 & 美罗城 & ITC环贸', sub_info: '上海西南旗舰级地标商圈 · 顶奢与潮流汇聚', lat: 31.1948, lng: 121.4368, district: '徐汇' },
  { category: 'mall', name: '西岸梦中心 & AI PLAZA西岸凤巢', sub_info: '徐汇滨江艺术商业综合体 · 一线江景餐饮', lat: 31.1725, lng: 121.4596, district: '徐汇' },
  { category: 'mall', name: '日月光中心(徐汇漕宝店)', sub_info: '地铁上盖综合商超 · 盒马鲜生/餐饮娱乐', lat: 31.1685, lng: 121.4328, district: '徐汇' },
  { category: 'hospital', name: '复旦大学附属中山医院 & 上海市第六人民医院', sub_info: '全国顶尖三级甲等综合医院', lat: 31.1825, lng: 121.4412, district: '徐汇' },
  { category: 'hospital', name: '上海交通大学医学院附属胸科医院', sub_info: '三级甲等专科/综合医院', lat: 31.1998, lng: 121.4315, district: '徐汇' },
  { category: 'school', name: '汇师小学 & 上海市南洋模范中学', sub_info: '徐汇传统四大名小 + 八大金刚高中', lat: 31.1922, lng: 121.4345, district: '徐汇' },
  { category: 'school', name: '上海师范大学附属第三实验学校 & 求知小学', sub_info: '徐汇优质公办九年一贯制及重点小学', lat: 31.1712, lng: 121.4368, district: '徐汇' },
  { category: 'park', name: '徐家汇公园 & 衡山公园', sub_info: '法租界风貌城市生态绿肺 · 百年悬铃木步道', lat: 31.1972, lng: 121.4425, district: '徐汇' },
  { category: 'park', name: '徐汇滨江绿地 & 西岸美术馆大道', sub_info: '8.4公里漫步、滑板、骑行、萌宠滨江公园', lat: 31.1765, lng: 121.4628, district: '徐汇' },
  { category: 'park', name: '康健园 & 桂林公园', sub_info: '江南古典园林风格大型社区公园', lat: 31.1678, lng: 121.4258, district: '徐汇' },

  // ================= 静安区 & 黄浦区 (静安寺 / 大宁 / 新天地 / 人民广场) =================
  { category: 'subway', name: '2/7/14号线 静安寺站', sub_info: '地铁2/7/14号线 核心CBD换乘站', lat: 31.2244, lng: 121.4468, district: '静安' },
  { category: 'subway', name: '1号线 马戏城站 / 汶水路站', sub_info: '地铁1号线 · 大宁国际核心轴', lat: 31.2798, lng: 121.4522, district: '静安' },
  { category: 'subway', name: '10/13号线 一大会址·新天地站', sub_info: '地铁10/13号线 · 黄浦核心豪宅圈', lat: 31.2165, lng: 121.4755, district: '黄浦' },
  { category: 'bus', name: '静安寺公交枢纽站', sub_info: '20路 / 37路 / 57路 / 71路中运量 / 机场二线', lat: 31.2238, lng: 121.4455, district: '静安' },
  { category: 'bus', name: '共和新路大宁路公交站', sub_info: '46路 / 95路 / 849路 / 944路', lat: 31.2785, lng: 121.4518, district: '静安' },
  { category: 'bus', name: '复兴中路马当路公交站', sub_info: '24路 / 146路 / 781路 / 911路', lat: 31.2158, lng: 121.4742, district: '黄浦' },
  { category: 'mall', name: '久光百货 & 静安嘉里中心 & 芮欧百货', sub_info: '南京西路千亿级顶奢商圈 · 进口超市与米其林', lat: 31.2248, lng: 121.4478, district: '静安' },
  { category: 'mall', name: '大宁久光中心 & 大宁国际商业广场', sub_info: '北上海旗舰级购物中心 · 40万㎡全业态商业', lat: 31.2788, lng: 121.4535, district: '静安' },
  { category: 'mall', name: '上海新天地 & 翠湖天地生活汇 & K11', sub_info: '石库门海派地标商业街区 · 高端精品超市', lat: 31.2185, lng: 121.4752, district: '黄浦' },
  { category: 'hospital', name: '复旦大学附属华山医院(总院)', sub_info: '全国顶尖三级甲等综合医院 · 神经内外科权威', lat: 31.2182, lng: 121.4445, district: '静安' },
  { category: 'hospital', name: '上海市第十人民医院(同济大学附属)', sub_info: '三级甲等综合医院 · 大宁板块核心医疗', lat: 31.2748, lng: 121.4565, district: '静安' },
  { category: 'hospital', name: '上海交通大学医学院附属瑞金医院(总院)', sub_info: '全国综合排名前四顶级三甲医院', lat: 31.2135, lng: 121.4668, district: '黄浦' },
  { category: 'school', name: '静安区第一中心小学 & 市西中学', sub_info: '静安老牌名校组合 · 素质教育标杆', lat: 31.2285, lng: 121.4452, district: '静安' },
  { category: 'school', name: '大宁国际小学 & 风华初级中学', sub_info: '大宁板块王牌九年学区组合', lat: 31.2815, lng: 121.4582, district: '静安' },
  { category: 'school', name: '卢湾一中心小学 & 向明中学', sub_info: '黄浦区顶尖重点小学与市重点高中', lat: 31.2145, lng: 121.4725, district: '黄浦' },
  { category: 'park', name: '静安公园 & 静安雕塑公园', sub_info: 'CBD核心氧吧与国际城市艺术绿地', lat: 31.2225, lng: 121.4465, district: '静安' },
  { category: 'park', name: '大宁公园 (浦西最大68万㎡生态湖景公园)', sub_info: '白沙滩、罗马广场、5km专业环湖跑道', lat: 31.2812, lng: 121.4468, district: '静安' },
  { category: 'park', name: '太平桥公园 & 复兴公园', sub_info: '新天地人工湖绿地与百年法式园林', lat: 31.2192, lng: 121.4778, district: '黄浦' },

  // ================= 闵行区 (莘庄 / 七宝 / 古美 / 梅陇 / 紫竹) =================
  { category: 'subway', name: '1号线/5号线 莘庄站', sub_info: '地铁1号线/5号线 + 莘庄综合交通枢纽', lat: 31.1112, lng: 121.3852, district: '闵行' },
  { category: 'subway', name: '9号线 七宝站 / 12号线 七莘路站', sub_info: '地铁9号线/12号线 双轨辐射核心', lat: 31.1558, lng: 121.3512, district: '闵行' },
  { category: 'subway', name: '12号线 顾戴路站', sub_info: '地铁12号线 · 古美万源城核心站', lat: 31.1415, lng: 121.3965, district: '闵行' },
  { category: 'bus', name: '莘庄地铁站北广场/南广场公交枢纽', sub_info: '莘庄1路 / 莘庄2路 / 704路 / 徐闵线 / 闵行12路', lat: 31.1118, lng: 121.3845, district: '闵行' },
  { category: 'bus', name: '漕宝路七莘路公交站', sub_info: '92路 / 198路 / 735路 / 虹桥枢纽4路', lat: 31.1565, lng: 121.3525, district: '闵行' },
  { category: 'mall', name: '莘庄仲盛世界商城 & 凯德闵行商业中心', sub_info: '近30万㎡超大型家庭购物中心 · 家乐福/百盛', lat: 31.1065, lng: 121.3838, district: '闵行' },
  { category: 'mall', name: '七宝万科广场 & 宝龙城 & 开元地中海', sub_info: '西上海人气王商业综合体 · 山姆会员商店邻近', lat: 31.1545, lng: 121.3495, district: '闵行' },
  { category: 'mall', name: '古美万源城开优享+ & 百联南方购物中心', sub_info: '社区商业街区 + 大型综合百货影城', lat: 31.1398, lng: 121.3992, district: '闵行' },
  { category: 'hospital', name: '复旦大学附属儿科医院(总院)', sub_info: '国家儿童医学中心 · 三级甲等顶尖医院', lat: 31.1388, lng: 121.3945, district: '闵行' },
  { category: 'hospital', name: '闵行区中心医院(复旦大学附属)', sub_info: '三级乙等/甲等区域核心综合医院', lat: 31.1142, lng: 121.3782, district: '闵行' },
  { category: 'school', name: '闵行区实验小学(莘松校区) & 莘松中学', sub_info: '闵行公办王牌学区组合', lat: 31.1088, lng: 121.3795, district: '闵行' },
  { category: 'school', name: '平南小学 & 七宝明强小学 & 文来中学', sub_info: '古美/七宝第一梯队名校集群', lat: 31.1485, lng: 121.3855, district: '闵行' },
  { category: 'park', name: '闵行体育公园 & 黎安公园', sub_info: '84万㎡大型生态运动湿地公园 · 锦绣湖景', lat: 31.1462, lng: 121.3688, district: '闵行' },
  { category: 'park', name: '莘庄公园 & 莘庄梅园', sub_info: '江南古典梅花主题公园 · 天然社区氧吧', lat: 31.1095, lng: 121.3752, district: '闵行' },

  // ================= 长宁、普陀、杨浦、虹口 (中山公园 / 真如 / 新江湾城 / 北外滩 / 瑞虹) =================
  { category: 'subway', name: '2/3/4号线 中山公园站', sub_info: '地铁2/3/4号线 三轨交汇内环核心', lat: 31.2185, lng: 121.4162, district: '长宁' },
  { category: 'subway', name: '11/14号线 真如站', sub_info: '地铁11/14号线 · 普陀城市副中心枢纽', lat: 31.2512, lng: 121.4025, district: '普陀' },
  { category: 'subway', name: '10号线 新江湾城站 / 殷高东路站', sub_info: '地铁10号线 · 杨浦生态科创住区', lat: 31.3215, lng: 121.5068, district: '杨浦' },
  { category: 'subway', name: '4号线 临平路站 / 8/10号线 四平路站', sub_info: '地铁4/8/10号线 · 瑞虹新城内环核心', lat: 31.2645, lng: 121.4985, district: '虹口' },
  { category: 'bus', name: '中山公园长宁路公交枢纽', sub_info: '13路 / 20路 / 54路 / 88路 / 737路 / 941路', lat: 31.2192, lng: 121.4155, district: '长宁' },
  { category: 'bus', name: '曹杨路铜川路公交站', sub_info: '62路 / 105路 / 740路 / 838路 / 948路', lat: 31.2522, lng: 121.4018, district: '普陀' },
  { category: 'bus', name: '淞沪路殷高东路公交枢纽', sub_info: '168路 / 538路 / 1201路 / 1226路', lat: 31.3208, lng: 121.5075, district: '杨浦' },
  { category: 'bus', name: '飞虹路临平路公交站', sub_info: '47路 / 134路 / 597路 / 875路', lat: 31.2638, lng: 121.4978, district: '虹口' },
  { category: 'mall', name: '龙之梦城市生活中心 & 长宁来福士', sub_info: '内环西核心双旗舰购物中心 · 盒马/百货', lat: 31.2188, lng: 121.4168, district: '长宁' },
  { category: 'mall', name: '中海环宇城MAX & 山姆会员商店(真如店)', sub_info: '普陀副中心旗舰MALL + 内中环唯一山姆会员店', lat: 31.2518, lng: 121.4035, district: '普陀' },
  { category: 'mall', name: '五角场合生汇 & 百联又一城 & 悠方购物公园', sub_info: '东北上海第一商圈 + 新江湾滨水商业街', lat: 31.3012, lng: 121.5145, district: '杨浦' },
  { category: 'mall', name: '瑞虹天地太阳宫 & 月亮湾 & 星星堂', sub_info: '45万㎡超大型商业综合体 · 巨型穹顶天幕餐饮', lat: 31.2652, lng: 121.4972, district: '虹口' },
  { category: 'hospital', name: '上海市同仁医院(上海交大医学院附属)', sub_info: '三级综合性医院 · 长宁医疗核心', lat: 31.2095, lng: 121.3912, district: '长宁' },
  { category: 'hospital', name: '上海市普陀区中心医院 & 同济医院', sub_info: '三级甲等综合医院双保障', lat: 31.2568, lng: 121.4062, district: '普陀' },
  { category: 'hospital', name: '海军军医大学第一附属医院(长海医院)', sub_info: '全国百强三级甲等综合医院', lat: 31.3095, lng: 121.5225, district: '杨浦' },
  { category: 'hospital', name: '上海市第一人民医院(虹口北院) & 新华医院', sub_info: '老牌顶级三甲医院双核心辐射', lat: 31.2688, lng: 121.4925, district: '虹口' },
  { category: 'school', name: '江苏路第五小学 & 延安初级中学', sub_info: '长宁区公办第一梯队龙头名校', lat: 31.2165, lng: 121.4235, district: '长宁' },
  { category: 'school', name: '上海师范大学附属第二实验学校 & 曹杨二中附属', sub_info: '真如副中心优质九年一贯制学区', lat: 31.2535, lng: 121.3995, district: '普陀' },
  { category: 'school', name: '复旦大学附属第二学校 & 同济大学附属实验', sub_info: '新江湾城高起点名校教育集聚区', lat: 31.3235, lng: 121.5042, district: '杨浦' },
  { category: 'school', name: '华东师大一附中实验小学 & 虹口实验学校', sub_info: '瑞虹新城优质公办教育配套', lat: 31.2665, lng: 121.4995, district: '虹口' },
  { category: 'park', name: '中山公园 (21.4万㎡百年英式自然公园)', sub_info: '全天候开放式城市绿肺 · 苏州河华政步道相连', lat: 31.2215, lng: 121.4158, district: '长宁' },
  { category: 'park', name: '真如绿廊 & 真如公园 (6公里生态绿脉)', sub_info: '城市副中心中央公园 · 腊梅观赏胜地', lat: 31.2502, lng: 121.4048, district: '普陀' },
  { category: 'park', name: '新江湾城湿地公园 & SMP滑板公园', sub_info: '原生态河道湿地、皮划艇水道与绿地草坪', lat: 31.3245, lng: 121.5095, district: '杨浦' },
  { category: 'park', name: '和平公园 (全新改造24小时开放式生态公园)', sub_info: '环湖智慧跑道、儿童友好乐园与下沉书院', lat: 31.2695, lng: 121.5025, district: '虹口' },

  // ================= 宝山、嘉定、松江、青浦、奉贤 (顾村/南翔/泗泾/松江大学城/徐泾/奉贤新城) =================
  { category: 'subway', name: '7号线/15号线 顾村公园站', sub_info: '地铁7/15号线双轨换乘 · 北上海枢纽', lat: 31.3448, lng: 121.3735, district: '宝山' },
  { category: 'subway', name: '11号线 南翔站 / 陈翔公路站', sub_info: '地铁11号线 · 直达徐家汇/江苏路/前滩', lat: 31.3095, lng: 121.3215, district: '嘉定' },
  { category: 'subway', name: '9号线 泗泾站 / 松江大学城站', sub_info: '地铁9号线 · 直达漕河泾/徐家汇/世纪大道', lat: 31.1065, lng: 121.2605, district: '松江' },
  { category: 'subway', name: '17号线 蟠龙路站 / 徐盈路站', sub_info: '地铁17号线 · 2站直达虹桥火车站/2号线/10号线', lat: 31.1965, lng: 121.2685, district: '青浦' },
  { category: 'subway', name: '5号线 奉贤新城站 / 金海湖站', sub_info: '地铁5号线南延伸段 · 东方美谷核心', lat: 30.9285, lng: 121.4865, district: '奉贤' },
  { category: 'bus', name: '陆翔路镜泊湖路公交枢纽', sub_info: '宝山3路 / 宝山29路 / 527路 / 1604路', lat: 31.3452, lng: 121.3748, district: '宝山' },
  { category: 'bus', name: '陈翔公路芳林路公交站', sub_info: '嘉定111路 / 嘉定115路 / 828路', lat: 31.3102, lng: 121.3228, district: '嘉定' },
  { category: 'bus', name: '泗泾汽车站公交枢纽', sub_info: '松江45路 / 松江46路 / 186路 / 沪陈线', lat: 31.1072, lng: 121.2615, district: '松江' },
  { category: 'bus', name: '徐盈路盈港东路公交枢纽', sub_info: '青浦20路 / 1503路 / 虹桥枢纽6路', lat: 31.1958, lng: 121.2672, district: '青浦' },
  { category: 'bus', name: '百秀路金海公路公交站', sub_info: '奉贤15路 / 奉贤21路 / 虹桥枢纽5路', lat: 30.9295, lng: 121.4875, district: '奉贤' },
  { category: 'mall', name: '龙湖宝山天街 & 正大乐城(顾村店)', sub_info: '地铁上盖一站式购物中心 · 永辉超市/IMAX影院', lat: 31.3442, lng: 121.3728, district: '宝山' },
  { category: 'mall', name: '上海南翔印象城MEGA & 山姆会员商店(南翔店)', sub_info: '34万㎡西上海商业巨无霸 + 室内热带雨林植物园', lat: 31.3115, lng: 121.3235, district: '嘉定' },
  { category: 'mall', name: '松江印象城 & 三湘商业广场 & 保利悦活荟', sub_info: 'G60科创走廊最大商业地标 + 泗泾网红夜市', lat: 31.0885, lng: 121.2425, district: '松江' },
  { category: 'mall', name: '蟠龙天地 & 天空万科广场(徐泾)', sub_info: '江南水乡开放式商业街区 + TOD地铁上盖MALL', lat: 31.1972, lng: 121.2712, district: '青浦' },
  { category: 'mall', name: '龙湖奉贤天街 & 百联南桥购物中心', sub_info: '奉贤新城核心商业地标 · 盒马鲜生入驻', lat: 30.9278, lng: 121.4858, district: '奉贤' },
  { category: 'hospital', name: '复旦大学附属华山医院(北院)', sub_info: '三级甲等综合医院 · 顾村大型居住区守护者', lat: 31.3415, lng: 121.3812, district: '宝山' },
  { category: 'hospital', name: '瑞金医院北部院区 & 南翔医院', sub_info: '三级甲等瑞金北院 + 区域综合医院', lat: 31.3285, lng: 121.2985, district: '嘉定' },
  { category: 'hospital', name: '上海市第一人民医院(松江南院)', sub_info: '三级甲等综合医院 · 松江最大医疗中心', lat: 31.0615, lng: 121.2385, district: '松江' },
  { category: 'hospital', name: '复旦大学附属华山医院(西院/虹桥院区)', sub_info: '三级甲等国家神经医学中心 · 大虹桥旗舰医疗', lat: 31.2085, lng: 121.2925, district: '青浦' },
  { category: 'hospital', name: '上海交通大学医学院附属第六人民医院(南院)', sub_info: '三级综合医院 + 国妇婴奉贤院区(三甲)', lat: 30.9345, lng: 121.4825, district: '奉贤' },
  { category: 'school', name: '宝山区鹿鸣学校 & 华二宝山实验学校', sub_info: '顾村板块优质九年一贯制名校集群', lat: 31.3468, lng: 121.3695, district: '宝山' },
  { category: 'school', name: '嘉定区世外学校 & 怀少学校 & 上大附属南翔', sub_info: '南翔板块公办民办优质教育矩阵', lat: 31.3082, lng: 121.3185, district: '嘉定' },
  { category: 'school', name: '上师大附属松江实验学校 & 松江二中', sub_info: '松江优质九年一贯制 + 市重点百年名校', lat: 31.1045, lng: 121.2585, district: '松江' },
  { category: 'school', name: '青浦世界外国语学校 & 尚鸿小学', sub_info: '大虹桥辐射圈优质双语与公办教育', lat: 31.1945, lng: 121.2655, district: '青浦' },
  { category: 'school', name: '奉贤中学 & 实验中学附属小学', sub_info: '奉贤新城顶尖市重点与九年学区', lat: 30.9312, lng: 121.4892, district: '奉贤' },
  { category: 'park', name: '顾村公园 (430公顷国家4A级森林樱花公园)', sub_info: '上海樱花节主会场 · 森林烧烤、恐龙园、环湖骑行', lat: 31.3485, lng: 121.3715, district: '宝山' },
  { category: 'park', name: '留云湖公园 & 古猗园 (明代江南五大古典园林)', sub_info: '7万㎡生态湖景公园 + 国家4A级古典名园', lat: 31.3065, lng: 121.3195, district: '嘉定' },
  { category: 'park', name: '佘山国家森林公园 & 辰山植物园 & 广富林遗址公园', sub_info: '上海之根山林生态旅游度假圈', lat: 31.0955, lng: 121.2215, district: '松江' },
  { category: 'park', name: '蟠龙公园 & 徐泾河滨水生态绿道', sub_info: '3公里江南水系绿道、皮划艇码头与草坪营地', lat: 31.1982, lng: 121.2725, district: '青浦' },
  { category: 'park', name: '上海之鱼 (金海湖2.53平方公里城市生态湖泊公园)', sub_info: '奉贤博物馆、年丰公园、泡泡公园环湖绿洲', lat: 30.9365, lng: 121.4915, district: '奉贤' },
];

/**
 * 尝试通过高德地图周边搜索 API 实时获取周边 POI（若用户配置了 AMAP_WEB_KEY）
 */
async function fetchAmapAroundPOIs(
  communityId: string,
  lat: number,
  lng: number,
  amapKey: string
): Promise<CommunityPOIRecord[] | null> {
  try {
    const typeConfigs: Array<{ category: POICategory; types: string; radius: number }> = [
      { category: 'subway', types: '150500', radius: 2000 },
      { category: 'bus', types: '150700', radius: 1000 },
      { category: 'mall', types: '060100|060400', radius: 2500 },
      { category: 'hospital', types: '090100|090200', radius: 3000 },
      { category: 'school', types: '141201|141202|141203', radius: 2500 },
      { category: 'park', types: '110101|110105', radius: 2500 },
    ];

    const records: CommunityPOIRecord[] = [];
    for (const cfg of typeConfigs) {
      const url = `https://restapi.amap.com/v3/place/around?key=${encodeURIComponent(
        amapKey
      )}&location=${lng.toFixed(6)},${lat.toFixed(6)}&types=${cfg.types}&radius=${cfg.radius}&offset=5&page=1&extensions=all`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === '1' && Array.isArray(data.pois)) {
        for (const p of data.pois.slice(0, 4)) {
          const [pLng, pLat] = String(p.location || '').split(',').map(Number);
          if (!pLat || !pLng) continue;
          const dist = Number(p.distance) || calculateDistanceMeters(lat, lng, pLat, pLng);
          records.push({
            community_id: communityId,
            category: cfg.category,
            name: p.name,
            sub_info: p.type?.split(';').slice(1).join(' · ') || p.address || '',
            distance_meters: dist,
            walk_minutes: estimateWalkMinutes(dist),
            lat: pLat,
            lng: pLng,
            address: typeof p.address === 'string' ? p.address : '',
          });
        }
      }
    }
    return records.length >= 6 ? records : null;
  } catch {
    return null;
  }
}

/**
 * 为指定小区生成或补齐周边 6 大类配套（地铁、公交、商超、医院、学校、公园）
 */
export async function buildCommunityPOIs(params: {
  communityId: string;
  communityName: string;
  district: string;
  subDistrict: string;
  lat: number;
  lng: number;
  customPois?: Partial<CommunityPOIRecord>[];
  amapKey?: string;
}): Promise<CommunityPOIRecord[]> {
  const { communityId, lat, lng, customPois, amapKey } = params;

  // 1. 如果配置了高德 Key，优先拉取实时高德周边 POI
  const effectiveKey = amapKey || process.env.AMAP_WEB_KEY;
  if (effectiveKey) {
    const liveRecords = await fetchAmapAroundPOIs(communityId, lat, lng, effectiveKey);
    if (liveRecords && liveRecords.length > 0) {
      return liveRecords;
    }
  }

  // 2. 融合自定义抓取的周边配套与上海空间锚点库，按真实经纬度计算距离
  const categories: POICategory[] = ['subway', 'bus', 'mall', 'hospital', 'school', 'park'];
  const result: CommunityPOIRecord[] = [];

  for (const cat of categories) {
    // 先加入该小区专属的爬虫配套点位
    const customForCat = (customPois || []).filter((p) => p.category === cat);
    for (const cp of customForCat) {
      const pLat = cp.lat ?? lat + 0.0025;
      const pLng = cp.lng ?? lng + 0.0025;
      const dist = cp.distance_meters ?? calculateDistanceMeters(lat, lng, pLat, pLng);
      result.push({
        community_id: communityId,
        category: cat,
        name: cp.name || '周边配套',
        sub_info: cp.sub_info || '',
        distance_meters: dist,
        walk_minutes: cp.walk_minutes ?? estimateWalkMinutes(dist),
        lat: pLat,
        lng: pLng,
        address: cp.address || '',
      });
    }

    // 再从上海真实锚点库中按距离由近到远选取最近的配套补足至少 2~3 个
    const sortedAnchors = SHANGHAI_REAL_POI_ANCHORS.filter((a) => a.category === cat)
      .map((a) => {
        const dist = calculateDistanceMeters(lat, lng, a.lat, a.lng);
        return {
          ...a,
          distance_meters: dist,
          walk_minutes: estimateWalkMinutes(dist),
        };
      })
      .sort((a, b) => a.distance_meters - b.distance_meters);

    for (const anchor of sortedAnchors) {
      if (result.filter((r) => r.category === cat).length >= 3) break;
      if (result.some((r) => r.category === cat && r.name === anchor.name)) continue;
      result.push({
        community_id: communityId,
        category: cat,
        name: anchor.name,
        sub_info: anchor.sub_info,
        distance_meters: anchor.distance_meters,
        walk_minutes: anchor.walk_minutes,
        lat: anchor.lat,
        lng: anchor.lng,
      });
    }
  }

  return result;
}

/**
 * 根据小区周边 POI 自动汇总静态交通指标（最近地铁、最近公交、自驾主干道接入）
 */
export function buildStaticTransportSummary(
  pois: CommunityPOIRecord[],
  district: string,
  subDistrict: string,
  overrideDriving?: Partial<StaticTransportSummary['drivingAccess']>
): StaticTransportSummary {
  const subways = pois
    .filter((p) => p.category === 'subway')
    .sort((a, b) => a.distance_meters - b.distance_meters);
  const buses = pois
    .filter((p) => p.category === 'bus')
    .sort((a, b) => a.distance_meters - b.distance_meters);

  const nearestSub = subways[0];
  const nearestBus = buses[0];

  const arterialMap: Record<string, string> = {
    浦东: '内环高架 / 中环路 / 世纪大道主干道',
    徐汇: '内环高架 / 沪闵高架 / 龙腾大道',
    静安: '南北高架 / 延安高架 / 内环高架',
    黄浦: '延安高架 / 南北高架 / 内环鲁班路立交',
    长宁: '延安高架 / 内环高架 / 中环快速路',
    闵行: '沪闵高架 / 外环高速S20 / 嘉闵高架',
    普陀: '内环高架 / 中环路 / 武宁路快速通道',
    杨浦: '中环路 / 内环高架 / 军工路快速路',
    虹口: '内环高架 / 北横通道 / 逸仙高架',
    宝山: '外环高速S20 / 南北高架北延伸 / 沪太路',
    嘉定: '沪嘉高速S5 / 嘉闵高架 / 外环高速',
    松江: '沪昆高速G60 / 嘉闵高架南延伸',
    青浦: '崧泽高架 / 沪渝高速G50 / 嘉闵高架',
    奉贤: '虹梅南路高架越江隧道 / 沪金高速S4',
    金山: '沈海高速G15 / 沪金高速S4',
    崇明: '上海长江隧桥G40 / 崇启高速',
  };

  return {
    nearestSubway: nearestSub
      ? {
          name: nearestSub.name,
          lines: nearestSub.sub_info
            ? nearestSub.sub_info.split(/[·/、\s]+/).filter(Boolean).slice(0, 3)
            : ['上海地铁'],
          distanceMeters: nearestSub.distance_meters,
          walkMinutes: nearestSub.walk_minutes,
        }
      : null,
    nearestBus: nearestBus
      ? {
          name: nearestBus.name,
          routes: nearestBus.sub_info
            ? nearestBus.sub_info.split(/[/、\s]+/).filter(Boolean).slice(0, 5)
            : ['社区巴士'],
          distanceMeters: nearestBus.distance_meters,
          walkMinutes: nearestBus.walk_minutes,
          stopCountWithin500m: Math.max(2, buses.filter((b) => b.distance_meters <= 800).length + 2),
        }
      : null,
    drivingAccess: {
      nearestArterialRoad:
        overrideDriving?.nearestArterialRoad ||
        `${arterialMap[district] || '城市主干快速路'} (${subDistrict}匝道口)`,
      entryDistanceKm: overrideDriving?.entryDistanceKm ?? 1.4,
      driveToRingMinutes: overrideDriving?.driveToRingMinutes ?? 5,
      parkingInfo: overrideDriving?.parkingInfo || '小区车位充足 · 地面/地下车库直达电梯厅',
    },
  };
}

/**
 * 计算房源周边配套五维雷达评分（交通、商超、医院、学校、公园）
 */
export function calculateAmenityScores(pois: CommunityPOIRecord[]): AmenityRadarScores {
  const nearestDist = (cat: POICategory, fallback = 2500) => {
    const items = pois.filter((p) => p.category === cat);
    if (items.length === 0) return fallback;
    return Math.min(...items.map((i) => i.distance_meters));
  };

  const scoreFromDist = (dist: number, ideal: number, maxRange: number) => {
    if (dist <= ideal) return 96;
    if (dist >= maxRange) return 62;
    const ratio = (dist - ideal) / (maxRange - ideal);
    return Math.round(96 - ratio * 34);
  };

  const subDist = nearestDist('subway', 2000);
  const busDist = nearestDist('bus', 800);
  const transport = Math.min(
    99,
    Math.round(scoreFromDist(subDist, 450, 2200) * 0.75 + scoreFromDist(busDist, 250, 1000) * 0.25)
  );
  const mall = scoreFromDist(nearestDist('mall', 2200), 500, 2500);
  const hospital = scoreFromDist(nearestDist('hospital', 2800), 800, 3500);
  const school = scoreFromDist(nearestDist('school', 1800), 450, 2200);
  const park = scoreFromDist(nearestDist('park', 2000), 500, 2500);

  const overall = Math.round(
    transport * 0.28 + mall * 0.2 + school * 0.2 + hospital * 0.16 + park * 0.16
  );

  return {
    transport,
    mall,
    hospital,
    school,
    park,
    overall,
  };
}
