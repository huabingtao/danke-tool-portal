/**
 * 弹壳特工队 - 并列发车平台 微信登录与身份认证模拟模块
 * Survivor Tie & Dispatch Platform WeChat Auth Module
 */

// 预设高质感微信玩家昵称池，用于模拟生成微信随机昵称
const MOCK_WECHAT_NICKNAMES = [
  '破空者·苍穹',
  '枪火圣徒',
  '极光漫游者',
  '暗影走位王',
  '风暴指挥官',
  '星能特工_9527',
  '绝境突围者',
  '微光战术家',
  '量子弹头',
  '终极生存者'
];

// 预设高质感微信头像池 (使用 DiceBear bottts & lorelei 头像服务 API)
const MOCK_AVATAR_SEEDS = [
  'ShadowAgent',
  'GoldWarrior',
  'CyberSurvivor',
  'StormCommander',
  'TacticalMaster',
  'AlphaOperative',
  'VanguardHero',
  'ApexGunner'
];

export const wechatAuth = {
  /**
   * 模拟微信一键登录与游戏账号绑定
   * @param {string} gameId - 特工玩家的游戏 ID (如 "8849201")
   * @param {string} gameNickname - 特工玩家的游戏昵称 (如 "爆裂小弹壳")
   * @returns {Object} 微信用户对象 (含 OpenID、微信随机昵称、头像及绑定的 gameId 与 gameNickname)
   */
  mockLogin(gameId, gameNickname) {
    if (!gameId || typeof gameId !== 'string' || !gameId.trim()) {
      throw new Error('[wechatAuth] 游戏ID(gameId)不能为空');
    }
    if (!gameNickname || typeof gameNickname !== 'string' || !gameNickname.trim()) {
      throw new Error('[wechatAuth] 游戏昵称(gameNickname)不能为空');
    }

    const cleanGameId = gameId.trim();
    const cleanGameNickname = gameNickname.trim();

    // 随机挑选微信昵称前缀或组合后缀
    const randomNameIndex = Math.floor(Math.random() * MOCK_WECHAT_NICKNAMES.length);
    const mockWechatNickname = `${MOCK_WECHAT_NICKNAMES[randomNameIndex]}_${cleanGameId.slice(-4)}`;

    // 生成随机 OpenID
    const randomHash = Math.random().toString(36).substring(2, 11);
    const openId = `wx_openid_${Date.now().toString(36)}_${randomHash}`;

    // 使用 DiceBear 动态生成精美 SVG 微信头像 URL
    const avatarSeed = MOCK_AVATAR_SEEDS[Math.floor(Math.random() * MOCK_AVATAR_SEEDS.length)];
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}_${cleanGameId}&backgroundColor=111827,1e1b4b,0f172a`;

    const userObject = {
      openId,
      nickname: mockWechatNickname,
      avatar,
      gameId: cleanGameId,
      gameNickname: cleanGameNickname,
      boundAt: Date.now(),
      loginTime: Date.now(),
      isVip: true,
      authProvider: 'wechat_mock'
    };

    return userObject;
  }
};

export default wechatAuth;
