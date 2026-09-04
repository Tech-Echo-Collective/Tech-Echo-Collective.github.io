"use strict";

const BALANCE_MODEL = globalThis.CRADLES_BALANCE;
const CAP = 20000;
const LA_CAP = CAP;
const SPECIAL_KNOWLEDGE_SCALE = CAP / 1000;
const SPECIAL_MATH_SCIENCE_SCALE = 100;
const SPEC_MAX = 5000;
const DEFAULT_ECO = 50000;
const ECO_METER_CAP = 300000;
const EERF_MAX_LEVEL = 5;
const BASE_RESTART_POP = 2600;
const MIN_SUSTAINABLE_POP = 1200;
const SAVE_VERSION = 10;
const STORE_KEY = "three-sun-chronicle:v1";
const ENDING_STORE_KEY = "three-sun-chronicle:ending:v1";
const ENDING_STATS_STORE_KEY = "three-sun-chronicle:ending-stats:v1";
const ENDING_PAGE = "ending.html";
const RNG_MOD = 2147483647;
const RNG_MUL = 48271;
const KNOWLEDGE_TREND_MIN = -180;
const KNOWLEDGE_TREND_MAX = 240;
const METRIC_SAMPLE_LIMIT = 80;
const METRIC_CHART_WINDOW = 15;
const CIVILIZATION_SAMPLE_LIMIT = 64;
const FINAL_METRIC_ARCHIVE_LIMIT = 32;
const MAP_OWNER_PLAYER = "player";
const MAP_OWNER_NEUTRAL = "neutral";
const MAP_OWNER_RIVAL = "rival";
const MAP_OWNER_RUINS = "ruins";
const PLAYER_ENTITY_ID = "player-realm";
const NEUTRAL_ENTITY_ID = "free-cities";
const NEUTRAL_COAST_ENTITY_ID = "coastal-republic";
const RIVAL_ENTITY_ID = "solar-court";
const RIVAL_ASH_ENTITY_ID = "ash-confederacy";
const POLITICAL_ENTITY_IDS = [
  PLAYER_ENTITY_ID,
  NEUTRAL_ENTITY_ID,
  NEUTRAL_COAST_ENTITY_ID,
  RIVAL_ENTITY_ID,
  RIVAL_ASH_ENTITY_ID
];
const PLAYER_ARMY_ID = "player-first-legion";
const DEFAULT_REALM_NAME = "长生军";
const DEFAULT_GOVERNOR_ID = "east-asian-man";
const GOVERNORS = {
  "east-asian-man": {
    label: "杨卫平",
    caption: "汉人血统。\n他坚信空谈误国，实干兴邦。\n他也坚信：历来强盗要侵入，最终必送命。",
    image: "assets/governor-east-asian-man.png",
    skill: "民生防线｜人口正增长 +8%；防御 +6。"
  },
  "white-woman": {
    label: "克莱尔·英格丽德·麦克劳德",
    caption: "维京-凯尔特血统。\n当然，她可以是一位优秀的执政官。\n但她更想成为一位女武神。",
    image: "assets/governor-white-woman.png",
    skill: "女武神｜神学正增长 +8%；攻击 +6。"
  },
  "black-man": {
    label: "拉特尔·‘公羊’·塞万提斯三世",
    caption: "拉美-非洲混血。\n他有自己的梦想，比如有一天，殖民者能停止掠夺他的家乡。\n当然，只是个梦想。",
    image: "assets/governor-black-man.png",
    skill: "公羊之梦｜经济正增长 +10%；强化有利地形并减轻地形惩罚。"
  },
  listener: {
    label: "监听员",
    caption: "三体世界的监听员。\n你已经是身经百战见得多了。\n你觉得三体世界不好，现在，你来建设它。",
    image: "assets/governor-trisolaran-listener.png",
    skill: "监听者｜取消战争迷雾，显示全图军事动向。"
  }
};
const AI_AGGRESSIONS = {
  restrained: { label: "克制", intervalScale: 1.5, playerTargetBias: 1, attackBonus: -3 },
  standard: { label: "标准", intervalScale: 1, playerTargetBias: 4, attackBonus: 0 },
  aggressive: { label: "好战", intervalScale: 0.76, playerTargetBias: 8, attackBonus: 4 },
  total: { label: "全面战争", intervalScale: 0.56, playerTargetBias: 13, attackBonus: 8 }
};
const POLITICAL_STRATEGIES = {
  balanced: { label: "均衡发展", description: "稳定积累发展、技术与军备。", development: 1.1, technology: 0.55, attack: 2, defense: 2 },
  science: { label: "技术优先", description: "集中资源推进技术与军队现代化。", development: 0.9, technology: 1.35, attack: 7, defense: 3 },
  fortress: { label: "要塞国家", description: "强化领土工事与守军组织。", development: 0.85, technology: 0.45, attack: -1, defense: 10 },
  expansion: { label: "扩张主义", description: "优先扩军并寻找可进攻边境。", development: 0.8, technology: 0.4, attack: 9, defense: 0 },
  trade: { label: "商业网络", description: "以繁荣和补给支撑长期发展。", development: 1.4, technology: 0.65, attack: 1, defense: 3 },
  faith: { label: "正信共同体", description: "秩序与共同信仰提高防御韧性。", development: 1, technology: 0.3, attack: 0, defense: 7 }
};
const DIFFICULTIES = {
  easy: {
    label: "简单",
    playerForce: 1.22,
    neutralPower: 0.72,
    rivalPower: 0.76,
    enemyAttackInterval: 13,
    enemyCasualtyScale: 0.82,
    disasterMultiplier: 0.78
  },
  normal: {
    label: "普通",
    playerForce: 1,
    neutralPower: 0.92,
    rivalPower: 1,
    enemyAttackInterval: 10,
    enemyCasualtyScale: 1,
    disasterMultiplier: 1
  },
  hard: {
    label: "困难",
    playerForce: 0.94,
    neutralPower: 1.08,
    rivalPower: 1.2,
    enemyAttackInterval: 8,
    enemyCasualtyScale: 1.12,
    disasterMultiplier: 1.22
  },
  ultimate: {
    label: "终极困难",
    playerForce: 0.86,
    neutralPower: 1.25,
    rivalPower: 1.45,
    enemyAttackInterval: 6,
    enemyCasualtyScale: 1.24,
    disasterMultiplier: 1.48
  }
};
const MAP_GRID_SIZE = 5;
const MAP_REGIONS = [
  { id: "frostCrown", name: "寒鸦冻原", row: 0, col: 0, strength: 28, terrain: "tundra" },
  { id: "northReach", name: "北境冰原", row: 0, col: 1, strength: 34, terrain: "tundra" },
  { id: "sunCoast", name: "日冕海岸", row: 0, col: 2, strength: 48, terrain: "coast" },
  { id: "mirrorCoast", name: "镜海湾", row: 0, col: 3, strength: 42, terrain: "coast" },
  { id: "northHarbor", name: "北辰港", row: 0, col: 4, strength: 38, terrain: "coast" },
  { id: "ironHills", name: "铁山关", row: 1, col: 0, strength: 52, terrain: "mountain" },
  { id: "westernMarch", name: "西陲旷野", row: 1, col: 1, strength: 38, terrain: "plain" },
  { id: "capital", name: "中央盆地", row: 1, col: 2, strength: 66, terrain: "basin", core: true },
  { id: "easternBasin", name: "东部城邦", row: 1, col: 3, strength: 46, terrain: "urban" },
  { id: "easternCliffs", name: "东崖要塞", row: 1, col: 4, strength: 54, terrain: "mountain" },
  { id: "saltFlats", name: "盐湖废原", row: 2, col: 0, strength: 30, terrain: "salt" },
  { id: "southGate", name: "南门高地", row: 2, col: 1, strength: 58, terrain: "mountain" },
  { id: "skyPrairie", name: "苍穹草原", row: 2, col: 2, strength: 34, terrain: "plain" },
  { id: "ashRiver", name: "灰河上游", row: 2, col: 3, strength: 40, terrain: "river" },
  { id: "reedMarsh", name: "芦苇沼泽", row: 2, col: 4, strength: 31, terrain: "river" },
  { id: "obsidianSteppe", name: "黑曜荒原", row: 3, col: 0, strength: 36, terrain: "waste" },
  { id: "redCanyon", name: "赤岩峡谷", row: 3, col: 1, strength: 55, terrain: "canyon" },
  { id: "deltaPorts", name: "三角洲港群", row: 3, col: 2, strength: 44, terrain: "river" },
  { id: "farCape", name: "远望海角", row: 3, col: 3, strength: 32, terrain: "coast" },
  { id: "seaWall", name: "潮汐海墙", row: 3, col: 4, strength: 50, terrain: "coast" },
  { id: "silentDunes", name: "寂静沙丘", row: 4, col: 0, strength: 29, terrain: "waste" },
  { id: "southernCrater", name: "南方环坑", row: 4, col: 1, strength: 47, terrain: "canyon" },
  { id: "greenDelta", name: "青绿三角洲", row: 4, col: 2, strength: 39, terrain: "river" },
  { id: "glassFields", name: "琉璃原野", row: 4, col: 3, strength: 35, terrain: "plain" },
  { id: "lastLight", name: "终光海岬", row: 4, col: 4, strength: 45, terrain: "coast" }
];
const INITIAL_REGION_CONTROLLERS = {
  capital: PLAYER_ENTITY_ID,
  westernMarch: PLAYER_ENTITY_ID,
  southGate: PLAYER_ENTITY_ID,
  skyPrairie: PLAYER_ENTITY_ID,
  greenDelta: PLAYER_ENTITY_ID,
  frostCrown: NEUTRAL_ENTITY_ID,
  ironHills: NEUTRAL_ENTITY_ID,
  saltFlats: NEUTRAL_ENTITY_ID,
  obsidianSteppe: NEUTRAL_ENTITY_ID,
  silentDunes: NEUTRAL_ENTITY_ID,
  mirrorCoast: NEUTRAL_COAST_ENTITY_ID,
  easternBasin: NEUTRAL_COAST_ENTITY_ID,
  deltaPorts: NEUTRAL_COAST_ENTITY_ID,
  northHarbor: NEUTRAL_COAST_ENTITY_ID,
  reedMarsh: NEUTRAL_COAST_ENTITY_ID,
  northReach: RIVAL_ENTITY_ID,
  sunCoast: RIVAL_ENTITY_ID,
  redCanyon: RIVAL_ENTITY_ID,
  easternCliffs: RIVAL_ENTITY_ID,
  southernCrater: RIVAL_ENTITY_ID,
  ashRiver: RIVAL_ASH_ENTITY_ID,
  farCape: RIVAL_ASH_ENTITY_ID,
  seaWall: RIVAL_ASH_ENTITY_ID,
  glassFields: RIVAL_ASH_ENTITY_ID,
  lastLight: RIVAL_ASH_ENTITY_ID
};
const MILITARY_FORCE_CAP = 120000;
const MAP_EVENT_NONE = "边境暂无大规模军事行动。";
const KNOWLEDGE_TREND_RESTART_RATES = [0, 0.08, 0.12, 0.16, 0.2, 0.25];
const KNOWLEDGE_TREND_RESTART_CAPS = [0, 8, 14, 20, 28, 36];
const KNOWLEDGE_TREND_STAGES = [
  { id: "collapse", min: -Infinity, label: "荒无人烟" },
  { id: "decline", min: -60, label: "衰退" },
  { id: "stalled", min: -15, label: "停滞" },
  { id: "budding", min: 15, label: "萌芽" },
  { id: "formed", min: 55, label: "成形" },
  { id: "expanding", min: 110, label: "扩张" },
  { id: "surging", min: 190, label: "群星璀璨" }
];
const EERF_SCIENCE_REQUIREMENTS = [0, 0, 2000, 4000, 8000, 16000];
const SCIENCE_RESTART_RATES = [0, 0.03, 0.06, 0.09, 0.125, 0.165];
const SCIENCE_RESTART_CAPS = [0, 750, 1450, 2200, 3000, 3800];
const BELIEF_RESTART_RATE_MULTIPLIER = 1.08;
const BELIEF_RESTART_CAPS = [0, 820, 1600, 2450, 3350, 4200];
const LA_EERF_MAX_KNOWLEDGE_RATE = 0.5;
const LA_EERF_MAX_TREND_RATE = 0.8;
const C_STAGNANT_CIVILIZATION_STREAK = 18;
const C_BRONZE_ERA_SCIENCE_CAP = 1600;
const I_LOW_ORDER_CIVILIZATION_STREAK = 16;
const I_LOW_ORDER_THRESHOLD = 20;
const J_MEMORY_CIVILIZATION_STREAK = 3;
const J_MEMORY_LA_THRESHOLD = 18000;
const DIVIDE_AUTO_ACTION = "balance";
const DIVIDE_AUTO_DELAY_MS = 180;
const ENDING_THRESHOLDS = {
  companionKnowledge: 9000,
  exodusKnowledge: 16000,
  balancedKnowledge: 14500,
  middleScience: 12500,
  lowKnowledge: 7000,
  exodusPopulation: 10000,
  exodusEconomy: 95000,
  authoritarianPopulation: 10000,
  orderHigh: 80,
  collapseCycle: 7,
  conquestForce: 18000
};

const SPECIAL_DECISIONS = {
  levyHost: {
    label: "征兵",
    stage: "war-prelude",
    visible: true,
    description: "征兵令贴满城门，青壮年被编入新的军团。",
    cooldownYears: 4,
    requirements: { pop: 7000, eco: 32000, stability: 30 },
    effects: { pop: -1600, eco: -18000, stability: -4 },
    military: { force: 5200, attack: 3, defense: 1 }
  },
  secureFrontier: {
    label: "边疆戒严",
    stage: "war-prelude",
    visible: true,
    description: "边疆进入戒严，烽火台、关卡和军需账簿同时运转。",
    cooldownYears: 5,
    requirements: { eco: 30000, stability: 24 },
    effects: { eco: -16000, stability: 8 },
    military: { force: 1400, attack: -1, defense: 7 }
  },
  crownAuthority: {
    label: "强化王权",
    stage: "war-prelude",
    visible: true,
    description: "中央命令压过诸侯私令，王权重新接管军政。",
    cooldownYears: 8,
    requirements: { sc: 4000, be: 4000, stability: 55 },
    effects: { eco: -26000, stability: 12 },
    military: { force: 2200, attack: 3, defense: 4 }
  },
  trainLegion: {
    label: "整训军团",
    stage: "war-prelude",
    visible: true,
    description: "军官重编队列、旗语与补给章程，军团的进攻能力得到提升。",
    cooldownYears: 4,
    requirements: { pop: 6500, eco: 28000, sc: 1800 },
    effects: { pop: -500, eco: -17000, stability: -2 },
    military: { force: 1800, attack: 9, defense: 1 }
  },
  fieldWorks: {
    label: "构筑工事",
    stage: "war-prelude",
    visible: true,
    description: "军队在当前驻地构筑壕沟、粮站与永久防线。",
    cooldownYears: 4,
    requirements: { eco: 24000, stability: 28 },
    effects: { eco: -15000, stability: 1 },
    military: { force: 600, attack: 0, defense: 9, fortification: 12 }
  }
};

const SCIENCE_ERAS = [
  { threshold: 0, name: "石器时代" },
  { threshold: 500, name: "铜石并用时代" },
  { threshold: 1200, name: "青铜时代" },
  { threshold: 2500, name: "铁器时代" },
  { threshold: 4000, name: "古典机械时代" },
  { threshold: 6000, name: "蒸汽时代" },
  { threshold: 8000, name: "电气时代" },
  { threshold: 10000, name: "原子时代" },
  { threshold: 12000, name: "信息时代" },
  { threshold: 14000, name: "太空时代" },
  { threshold: 16000, name: "星际航行时代" },
  { threshold: 18000, name: "宇宙工程时代" },
  { threshold: 20000, name: "戴森球时代" }
];

const BELIEF_ERAS = [
  { threshold: 0, name: "巫祝萌芽" },
  { threshold: 500, name: "图腾祭司" },
  { threshold: 1200, name: "祖灵城邦" },
  { threshold: 2500, name: "神权律法" },
  { threshold: 4000, name: "经院神学" },
  { threshold: 6000, name: "圣城体系" },
  { threshold: 8000, name: "正典教会" },
  { threshold: 10000, name: "三位一体" },
  { threshold: 12000, name: "教皇选举" },
  { threshold: 14000, name: "尼西亚信经" },
  { threshold: 16000, name: "异端审判" },
  { threshold: 18000, name: "唯有上帝" },
  { threshold: 20000, name: "天国王朝" }
];

const ACTIONS = {
  science: {
    label: "建造研究所",
    type: "progress",
    delta: { sc: 235, be: -20, pop: -120, eco: -7800, stability: -2 },
    text: "我们必须知道；我们必将知道。\n ——大卫·希尔伯特，1930年",
    chronicleText: "研究者把恐惧写成公式，科学上升，但旧祭司们感到不安。"
  },
  belief: {
    label: "潜心苦修",
    type: "special",
    delta: { sc: -18, be: 170, pop: 300, eco: -6400, stability: 4 },
    text: "万物非主，唯有真主。",
    chronicleText: "苦修者重新解释星象，人群获得秩序，怀疑者退回暗处。"
  },
  population: {
    label: "扩建聚居地",
    type: "progress",
    delta: { sc: -18, be: 24, pop: 2600, eco: -9500, stability: -5 },
    text: "居者有其屋，耕者有其田。\n安得广厦千万间，大庇天下寒士俱欢颜？",
    chronicleText: "新的洞穴、温室与地下街区被打开，人口膨胀带来繁荣，也带来拥挤。"
  },
  balance: {
    label: "均衡治理",
    type: "progress",
    delta: { sc: 95, be: 95, pop: 1100, eco: 4000, stability: 8 },
    text: "政治是妥协的艺术。由此，百花齐放，百家争鸣；\n我看没什么，起码挺热闹。",
    chronicleText: "学院和神殿互相让出一步，文明暂时学会用两种语言说话。"
  },
  order: {
    label: "维持秩序",
    type: "special",
    delta: { sc: -6, be: 22, pop: -160, eco: -11500, stability: 18 },
    text: "您自由了。\n——《悲惨世界》，1862年",
    chronicleText: "巡夜队、粮票与临时法院重新挤压混乱，经济为秩序让路。"
  },
  suppressBelief: {
    label: "打压神学",
    type: "special",
    delta: { sc: 125, be: -125, pop: -420, eco: -8800, stability: -8 },
    text: "陛下，我不需要上帝这个假设。\n——皮埃尔·西蒙·拉普拉斯，1802年",
    chronicleText: "学院夺回祭坛、税粮与钟楼，教化蒙昧。神学退却，科学获得一段残酷的清场。"
  },
  suppressScience: {
    label: "打压科学",
    type: "special",
    delta: { sc: -125, be: 125, pop: 120, eco: -6200, stability: 3 },
    text: "不管怎么说，它依然在转动！\n——伽利略·伽利莱，1632年",
    chronicleText: "祭司接管学院、工坊与账簿，清算异端。科学退却，神学获得一段安静的扩张。"
  },
  hibernate: {
    label: "脱水",
    type: "special",
    delta(state) {
      return {
        sc: 35,
        be: 35,
        pop: -Math.max(1, Math.ceil(state.pop * 0.06)),
        eco: -5000,
        stability: 14
      };
    },
    text: "脱水！脱水！！！",
    chronicleText: "一批人进入脱水状态，文明用当下的热闹换取下一次醒来的秩序。"
  },
  arts: {
    label: "文艺复兴",
    type: "progress",
    delta: { sc: 0, be: 0, la: 750, pop: 260, eco: -9200, stability: 3 },
    text: "真正的艺术，是不显得像艺术。\n——巴尔达萨雷·卡斯蒂廖内，1528年",
    chronicleText: "佛罗伦萨的晨钟敲碎中世纪的蒙昧,人文主义的曙光正为每块大理石注入体温."
  },
  economy: {
    label: "刺激经济",
    type: "progress",
    delta(state) {
      return {
        sc: -8,
        be: -6,
        pop: -Math.max(0, Math.round(state.pop * 0.008)),
        eco: Math.round(18000 + Math.sqrt(Math.max(0, state.pop)) * 72 + state.stability * 190),
        stability: -1
      };
    },
    text: "牛奶会有的，面包也会有的。一切都会有的！\n ——弗拉基米尔·伊里奇·列宁，1917年",
    chronicleText: "粮仓、工坊和税制重新开始工作，文明卖出了理想，得到了现金。"
  },
  militaryCampaign: {
    label: "发动远征",
    type: "special",
    mapExpansionOnly: true,
    delta: { sc: 12, be: -4, pop: -1400, eco: -42000, stability: -6 },
    text: "我来，我见，我征服。\n——尤利乌斯·凯撒，公元前49年",
    chronicleText: "远征军携带三段行程的补给越过边境；他们将持续推进，直到第三块领土或第一次失败。",
    militaryIntent: "attack"
  },
  levyHost: {
    label: SPECIAL_DECISIONS.levyHost.label,
    type: "special",
    mapExpansionOnly: true,
    policyId: "levyHost",
    delta() {
      return policyDelta("levyHost");
    },
    text: "天下兴亡，匹夫有责。\n——顾炎武，1639年",
    chronicleText: "征兵令扩充了军队，也把家庭、粮仓与工坊拖进战争。",
    effect() {
      applyPolicyActionEffect("levyHost");
    }
  },
  secureFrontier: {
    label: SPECIAL_DECISIONS.secureFrontier.label,
    type: "special",
    mapExpansionOnly: true,
    policyId: "secureFrontier",
    delta() {
      return policyDelta("secureFrontier");
    },
    text: "沿海省份，应立严禁，无许片帆入海，违者置重典。\n——屯泰，1655年",
    chronicleText: "边疆戒严提高了防御，也让贸易路线变得僵硬。",
    effect() {
      applyPolicyActionEffect("secureFrontier");
    }
  },
  crownAuthority: {
    label: SPECIAL_DECISIONS.crownAuthority.label,
    type: "special",
    mapExpansionOnly: true,
    policyId: "crownAuthority",
    delta() {
      return policyDelta("crownAuthority");
    },
    text: "君王通过他的建筑而使自己不朽。\n——腓特烈·奥古斯特一世，1728年",
    chronicleText: "强化王权让军队更像国家的手臂，而不是地方领主的私产。",
    effect() {
      applyPolicyActionEffect("crownAuthority");
    }
  },
  trainLegion: {
    label: SPECIAL_DECISIONS.trainLegion.label,
    type: "special",
    mapExpansionOnly: true,
    policyId: "trainLegion",
    delta() {
      return policyDelta("trainLegion");
    },
    text: "胜兵先胜而后求战，败兵先战而后求胜。\n——《孙子兵法》",
    chronicleText: "军团完成整训，新的进攻章程开始生效。",
    effect() {
      applyPolicyActionEffect("trainLegion");
    }
  },
  fieldWorks: {
    label: SPECIAL_DECISIONS.fieldWorks.label,
    type: "special",
    mapExpansionOnly: true,
    policyId: "fieldWorks",
    delta() {
      return policyDelta("fieldWorks");
    },
    text: "高筑墙、广积粮、缓称王。\n——朱升，1356年",
    chronicleText: "军团在驻地构筑工事，区域防御随之增强。",
    effect() {
      applyPolicyActionEffect("fieldWorks");
    }
  },
  buildEerf: {
    label: "建造 EERF",
    type: "special",
    delta: { sc: -45, be: -35, pop: -800, eco: -65000, stability: -4 },
    text: "E.E.R.F.极端环境抵抗设施在地下开工。\n子子孙孙无穷匮也，而山不加增，何苦而不平？",
    chronicleText: "极端环境抵抗设施在地下开工，地表文明为下一代火种支付第一笔代价。",
    effect() {
      state.eerfLevel = Math.max(state.eerfLevel, 1);
    }
  },
  upgradeEerf: {
    label: "升级 EERF",
    type: "special",
    delta(state) {
      const nextLevel = Math.min(EERF_MAX_LEVEL, state.eerfLevel + 1);
      const cost = 36000 + nextLevel * 34000;
      return {
        sc: -20 - nextLevel * 6,
        be: -18 - nextLevel * 5,
        pop: -Math.round(600 + nextLevel * 450),
        eco: -cost,
        stability: -3
      };
    },
    text: "风雨不动安如山。\n呜呼！何时眼前突兀见此屋，吾庐独破受冻死亦足！",
    chronicleText: "更深的门、更厚的隔热层、更长的冬眠协议被写入 EERF。",
    effect() {
      state.eerfLevel = Math.min(EERF_MAX_LEVEL, state.eerfLevel + 1);
    }
  },
  recovery: {
    label: "炉边谈话",
    type: "special",
    crisisOnly: true,
    canRunWithZeroPopulation: true,
    delta(state) {
      const relief = Math.max(24000, Math.round(Math.sqrt(Math.max(1, state.pop)) * 130 + state.stability * 320));
      const seedPopulation = state.pop <= 0 ? 3000 : 0;
      return {
        sc: -25,
        be: -15,
        pop: seedPopulation,
        eco: relief,
        stability: -3
      };
    },
    text: "我想花几分钟时间，向我们的人民谈谈银行的情况。\n ——富兰克林·罗斯福，1933年",
    chronicleText: "城邦发行硬债、重启税粮并征用冬眠库物资，财政恢复了最小心跳。"
  },
  restartCivilization: {
    label: "重启文明",
    type: "special",
    restartOnly: true,
    canRunWithZeroPopulation: true,
    delta: {},
    text: "神又说，要有光。于是又有了光。",
    chronicleText: "幸存者打开 EERF 和废墟档案，下一代文明从火种中醒来。"
  },
  settleEnding: {
    label: "脱离苦海",
    type: "special",
    settleOnly: true,
    canRunWithZeroPopulation: true,
    delta: {},
    text: "必须想象你是幸福的。",
    chronicleText: "文明把当前状态写成最终结局。"
  }
};

const ACTION_SHORTCUTS = [
  { key: "s", actionId: "science", label: "S" },
  { key: "b", actionId: "belief", label: "B" },
  { key: "p", actionId: "population", label: "P" },
  { key: "b", shiftKey: true, actionId: "balance", label: "Shift+B" },
  { key: "z", actionId: "order", label: "Z" },
  { key: "1", actionId: "suppressBelief", label: "1" },
  { key: "2", actionId: "suppressScience", label: "2" },
  { key: "h", actionId: "hibernate", label: "H" },
  { key: "l", actionId: "arts", label: "L" },
  { key: "e", actionId: "economy", label: "E" },
  { key: "m", actionId: "militaryCampaign", label: "M" },
  { key: "v", actionId: "levyHost", label: "V" },
  { key: "x", actionId: "secureFrontier", label: "X" },
  { key: "c", actionId: "crownAuthority", label: "C" },
  { key: "g", actionId: "trainLegion", label: "G" },
  { key: "d", actionId: "fieldWorks", label: "D" },
  { key: "f", actionId: "buildEerf", label: "F" },
  { key: "u", actionId: "upgradeEerf", label: "U" },
  { key: "o", actionId: "recovery", label: "O" },
  { key: "r", actionId: "restartCivilization", label: "R" },
  { key: "t", actionId: "settleEnding", label: "T" }
];

const ACTION_SHORTCUT_LABELS = ACTION_SHORTCUTS.reduce((labels, shortcut) => {
  labels[shortcut.actionId] = shortcut.label;
  return labels;
}, {});

const UTILITY_SHORTCUTS = [
  { key: "l", shiftKey: true, buttonId: "clearLogButton", label: "Shift+L", run: clearChronicle },
  { key: "n", shiftKey: true, buttonId: "newGameButton", label: "Shift+N", run: randomizeOrStartNewWorld }
];

const dom = {};
let state = null;
let autoRunHandle = 0;
let currentLogFilter = "all";

class Lcg {
  constructor(seed) {
    this.state = normalizeSeed(seed);
  }

  next() {
    this.state = (this.state * RNG_MUL) % RNG_MOD;
    return this.state / RNG_MOD;
  }

  nextInt(max) {
    return Math.floor(this.next() * max);
  }
}

function normalizeSeed(value) {
  const number = Number.isFinite(Number(value)) ? Number(value) : Date.now();
  const seed = Math.floor(Math.abs(number)) % RNG_MOD;
  return seed > 0 ? seed : 1;
}

function createNewState(seedValue = Date.now()) {
  const seed = normalizeSeed(seedValue);
  const endingStats = loadEndingStats();
  const initialSnapshot = {
    sc: 240,
    be: 360,
    la: 0,
    pop: 7600,
    eco: DEFAULT_ECO,
    stability: 52
  };
  return {
    saveVersion: SAVE_VERSION,
    seed,
    rngState: seed,
    setupComplete: false,
    setupStage: "name",
    realmName: "",
    difficulty: "normal",
    aiAggression: "standard",
    governorId: DEFAULT_GOVERNOR_ID,
    startingRegionId: "capital",
    mapUiExpanded: true,
    lastSavedAt: null,
    loadedFromSave: false,
    turn: 0,
    count: 1,
    ...initialSnapshot,
    populationGrowthMultiplier: 1,
    knowledgeGrowthMultiplier: 1,
    controlEfficiencyMultiplier: 1,
    scTrend: 12,
    beTrend: 16,
    controlLocked: false,
    autoRunUntilCollapse: false,
    populationLockTurns: 0,
    doomCountdown: 0,
    lockedPopulation: null,
    eerfLevel: 0,
    restartPopulationSeed: BASE_RESTART_POP,
    metricTrends: { sc: 0, be: 0, la: 0, pop: 0, eco: 0, stability: 0 },
    metricSamples: [createMetricSample(0, 1, initialSnapshot, { label: "文明苏醒" })],
    map: createInitialMapState(
      { realmName: DEFAULT_REALM_NAME, difficulty: "normal", seed, startingRegionId: "capital" },
      { seed, realmName: DEFAULT_REALM_NAME, difficulty: "normal", startingRegionId: "capital" }
    ),
    military: createInitialMilitaryState(initialSnapshot, { difficulty: "normal" }),
    selectedArmyId: PLAYER_ARMY_ID,
    selectedEntityId: PLAYER_ENTITY_ID,
    selectedRegionId: "capital",
    specialDecisionState: createSpecialDecisionState(),
    awaitingCivilizationRestart: false,
    pendingRestart: null,
    endingCandidate: null,
    cStagnantCivilizationStreak: 0,
    lowOrderCivilizationStreak: 0,
    laMemoryCivilizationStreak: 0,
    finished: false,
    finalEnding: null,
    endingStats,
    lastRand: null,
    lastSpec: null,
    lastTone: "quiet",
    specialNotice: null,
    history: [],
    currentCivilization: createCivilizationStats(1, 0, initialSnapshot),
    weather: "等待观测",
    ending: "我们依旧存在。",
    log: [
      {
        type: "progress",
        title: "第 1 号文明苏醒",
        text: "三颗恒星在天幕上留下互相矛盾的轨迹。执政官看着围在篝火旁的各人，那时科学、神学、人口与经济都脆弱不堪：这是一个文明的新生。",
        delta: { sc: 240, be: 360, pop: 7600, eco: DEFAULT_ECO, stability: 52 }
      }
    ]
  };
}

function createCivilizationStats(civilization, startTurn, initialSnapshot = {}) {
  const snap = {
    sc: finiteOr(initialSnapshot.sc, 0),
    be: finiteOr(initialSnapshot.be, 0),
    la: finiteOr(initialSnapshot.la, 0),
    pop: finiteOr(initialSnapshot.pop, 0),
    eco: finiteOr(initialSnapshot.eco, 0),
    stability: finiteOr(initialSnapshot.stability, 0)
  };

  return {
    civilization,
    startTurn,
    turns: 0,
    initialSc: snap.sc,
    initialBe: snap.be,
    initialLa: snap.la,
    initialPop: snap.pop,
    initialEco: snap.eco,
    initialStability: snap.stability,
    peakSc: snap.sc,
    peakBe: snap.be,
    peakLa: snap.la,
    peakPop: snap.pop,
    peakEco: snap.eco,
    peakEerf: finiteOr(initialSnapshot.eerfLevel ?? initialSnapshot.eerf, 0),
    peakStability: snap.stability,
    minStability: snap.stability,
    hadLowOrder: snap.stability < I_LOW_ORDER_THRESHOLD,
    hadLaCap: snap.la >= J_MEMORY_LA_THRESHOLD,
    metricSamples: [createMetricSample(startTurn, civilization, snap, { label: `第 ${civilization} 号文明苏醒` })],
    specialEvents: [],
    collapseCause: null,
    finalSnapshot: null,
    ending: "未判定"
  };
}

function normalizeDifficulty(value) {
  return Object.prototype.hasOwnProperty.call(DIFFICULTIES, value) ? value : "normal";
}

function difficultyConfig(value = state?.difficulty) {
  return DIFFICULTIES[normalizeDifficulty(value)] || DIFFICULTIES.normal;
}

function normalizeAiAggression(value) {
  return Object.prototype.hasOwnProperty.call(AI_AGGRESSIONS, value) ? value : "standard";
}

function normalizeGovernorId(value) {
  return Object.prototype.hasOwnProperty.call(GOVERNORS, value) ? value : DEFAULT_GOVERNOR_ID;
}

function governorBalanceEffects(governorId = state?.governorId) {
  return BALANCE_MODEL?.governorEffects(normalizeGovernorId(governorId)) || {
    populationGrowth: 1,
    beliefGrowth: 1,
    economyGrowth: 1,
    attack: 0,
    defense: 0,
    terrainMastery: 1,
    fullIntel: false
  };
}

function aiAggressionConfig(value = state?.aiAggression) {
  return AI_AGGRESSIONS[normalizeAiAggression(value)] || AI_AGGRESSIONS.standard;
}

function normalizePoliticalStrategy(value, fallback = "balanced") {
  return Object.prototype.hasOwnProperty.call(POLITICAL_STRATEGIES, value) ? value : fallback;
}

function politicalStrategyConfig(value) {
  return POLITICAL_STRATEGIES[normalizePoliticalStrategy(value)] || POLITICAL_STRATEGIES.balanced;
}

function seededEntityStrategy(entityId, seedValue, fallback) {
  if (entityId === PLAYER_ENTITY_ID) return "balanced";
  const choices = Object.keys(POLITICAL_STRATEGIES);
  const salt = Array.from(entityId).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return choices[(normalizeSeed(seedValue) + salt) % choices.length] || fallback;
}

function createPoliticalEntities(source = {}, realmName = DEFAULT_REALM_NAME, seedValue = 1) {
  const sourceEntities = Array.isArray(source)
    ? source
    : source && typeof source === "object"
      ? Object.values(source)
      : [];
  const lookup = new Map(sourceEntities.filter(Boolean).map((entity) => [entity.id, entity]));
  const storedPlayer = lookup.get(PLAYER_ENTITY_ID) || {};
  const storedNeutral = lookup.get(NEUTRAL_ENTITY_ID) || {};
  const storedCoast = lookup.get(NEUTRAL_COAST_ENTITY_ID) || {};
  const storedRival = lookup.get(RIVAL_ENTITY_ID) || {};
  const storedAsh = lookup.get(RIVAL_ASH_ENTITY_ID) || {};
  const playerName = String(realmName || storedPlayer.name || DEFAULT_REALM_NAME).trim() || DEFAULT_REALM_NAME;

  const entityRecord = (stored, fallback) => ({
    ...fallback,
    strategy: normalizePoliticalStrategy(
      stored.strategy,
      seededEntityStrategy(fallback.id, seedValue, fallback.strategy)
    ),
    development: clamp(Math.round(finiteOr(stored.development, fallback.development)), 0, 999),
    technology: clamp(Math.round(finiteOr(stored.technology, fallback.technology)), 0, 100),
    eliminated: Boolean(stored.eliminated),
    eliminatedYear: stored.eliminatedYear == null ? null : Math.max(0, Math.round(finiteOr(stored.eliminatedYear, 0)))
  });

  return {
    [PLAYER_ENTITY_ID]: entityRecord(storedPlayer, {
      id: PLAYER_ENTITY_ID,
      name: playerName,
      owner: MAP_OWNER_PLAYER,
      relation: "player",
      strategy: "balanced",
      development: 18,
      technology: 6
    }),
    [NEUTRAL_ENTITY_ID]: entityRecord(storedNeutral, {
      id: NEUTRAL_ENTITY_ID,
      name: String(storedNeutral.name || "自由城邦同盟"),
      owner: MAP_OWNER_NEUTRAL,
      relation: storedNeutral.relation === "hostile" ? "hostile" : "neutral",
      strategy: "trade",
      development: 16,
      technology: 5
    }),
    [NEUTRAL_COAST_ENTITY_ID]: entityRecord(storedCoast, {
      id: NEUTRAL_COAST_ENTITY_ID,
      name: String(storedCoast.name || "镜海共和国"),
      owner: MAP_OWNER_NEUTRAL,
      relation: storedCoast.relation === "hostile" ? "hostile" : "neutral",
      strategy: "science",
      development: 17,
      technology: 8
    }),
    [RIVAL_ENTITY_ID]: entityRecord(storedRival, {
      id: RIVAL_ENTITY_ID,
      name: String(storedRival.name || "日冕王庭"),
      owner: MAP_OWNER_RIVAL,
      relation: "hostile",
      strategy: "expansion",
      development: 18,
      technology: 7
    }),
    [RIVAL_ASH_ENTITY_ID]: entityRecord(storedAsh, {
      id: RIVAL_ASH_ENTITY_ID,
      name: String(storedAsh.name || "灰烬邦联"),
      owner: MAP_OWNER_RIVAL,
      relation: "hostile",
      strategy: "fortress",
      development: 15,
      technology: 4
    })
  };
}

function initialControllerForRegion(regionId) {
  return INITIAL_REGION_CONTROLLERS[regionId] || NEUTRAL_ENTITY_ID;
}

function initialMapOwner(regionId) {
  const controllerId = initialControllerForRegion(regionId);
  if (controllerId === PLAYER_ENTITY_ID) return MAP_OWNER_PLAYER;
  if ([RIVAL_ENTITY_ID, RIVAL_ASH_ENTITY_ID].includes(controllerId)) return MAP_OWNER_RIVAL;
  return MAP_OWNER_NEUTRAL;
}

function normalizeStartingRegionId(value) {
  return mapRegionById(value)?.id || "capital";
}

function mapGridDistance(leftId, rightId) {
  const left = mapRegionById(leftId);
  const right = mapRegionById(rightId);
  if (!left || !right) return MAP_GRID_SIZE * 2;
  return Math.abs(left.row - right.row) + Math.abs(left.col - right.col);
}

function gridNeighborIds(regionId) {
  const region = mapRegionById(regionId);
  if (!region) return [];
  return MAP_REGIONS
    .filter((candidate) => Math.abs(candidate.row - region.row) + Math.abs(candidate.col - region.col) === 1)
    .map((candidate) => candidate.id);
}

function generateInitialRegionControllers(seedValue, startingRegionId) {
  const rng = new Lcg(normalizeSeed(normalizeSeed(seedValue) + 51193));
  const entityIds = [...POLITICAL_ENTITY_IDS];
  const start = normalizeStartingRegionId(startingRegionId);
  const capitals = [start];
  const available = MAP_REGIONS.map((region) => region.id).filter((regionId) => regionId !== start);

  while (capitals.length < entityIds.length) {
    const ranked = available
      .filter((regionId) => !capitals.includes(regionId))
      .map((regionId) => ({
        regionId,
        score: Math.min(...capitals.map((capitalId) => mapGridDistance(regionId, capitalId))) * 100 + rng.nextInt(45)
      }))
      .sort((left, right) => right.score - left.score);
    capitals.push(ranked[0]?.regionId || available[capitals.length - 1]);
  }

  const assignments = {};
  entityIds.forEach((entityId, index) => {
    assignments[capitals[index]] = entityId;
  });
  const targetCount = Math.floor(MAP_REGIONS.length / entityIds.length);
  let guard = 0;
  while (Object.keys(assignments).length < MAP_REGIONS.length && guard < MAP_REGIONS.length * 12) {
    guard += 1;
    let progressed = false;
    const order = [...entityIds].sort((left, right) => {
      const leftCount = Object.values(assignments).filter((entityId) => entityId === left).length;
      const rightCount = Object.values(assignments).filter((entityId) => entityId === right).length;
      return leftCount - rightCount;
    });
    order.forEach((entityId, index) => {
      const controlled = Object.keys(assignments).filter((regionId) => assignments[regionId] === entityId);
      if (controlled.length >= targetCount) return;
      const frontier = Array.from(new Set(controlled.flatMap(gridNeighborIds)))
        .filter((regionId) => !assignments[regionId])
        .map((regionId) => ({
          regionId,
          support: gridNeighborIds(regionId).filter((neighborId) => assignments[neighborId] === entityId).length,
          jitter: (rng.nextInt(100) + index * 13) % 100
        }))
        .sort((left, right) => right.support - left.support || right.jitter - left.jitter);
      if (!frontier.length) return;
      assignments[frontier[0].regionId] = entityId;
      progressed = true;
    });
    if (progressed) continue;
    const unassigned = MAP_REGIONS.map((region) => region.id).filter((regionId) => !assignments[regionId]);
    const underfilled = entityIds.find((entityId) => {
      return Object.values(assignments).filter((assignedId) => assignedId === entityId).length < targetCount;
    });
    if (!underfilled || !unassigned.length) break;
    assignments[unassigned[rng.nextInt(unassigned.length)]] = underfilled;
  }
  return assignments;
}

function entityIdForOwner(owner) {
  if (owner === MAP_OWNER_PLAYER) return PLAYER_ENTITY_ID;
  if (owner === MAP_OWNER_RIVAL) return RIVAL_ENTITY_ID;
  return NEUTRAL_ENTITY_ID;
}

function generateMapBlueprint(seedValue) {
  const rng = new Lcg(normalizeSeed(normalizeSeed(seedValue) + 73013));
  const vertices = [];
  const start = 2;
  const span = 96;
  const step = span / MAP_GRID_SIZE;
  for (let row = 0; row <= MAP_GRID_SIZE; row += 1) {
    vertices[row] = [];
    for (let col = 0; col <= MAP_GRID_SIZE; col += 1) {
      const edge = row === 0 || col === 0 || row === MAP_GRID_SIZE || col === MAP_GRID_SIZE;
      const jitterX = edge ? 0 : (rng.next() - 0.5) * 5.4;
      const jitterY = edge ? 0 : (rng.next() - 0.5) * 6.2;
      vertices[row][col] = {
        x: roundMapCoordinate(start + col * step + jitterX),
        y: roundMapCoordinate(start + row * step + jitterY)
      };
    }
  }

  const regions = {};
  MAP_REGIONS.forEach((region) => {
    const points = [
      vertices[region.row][region.col],
      vertices[region.row][region.col + 1],
      vertices[region.row + 1][region.col + 1],
      vertices[region.row + 1][region.col]
    ];
    regions[region.id] = {
      points,
      centerX: roundMapCoordinate(points.reduce((sum, point) => sum + point.x, 0) / points.length),
      centerY: roundMapCoordinate(points.reduce((sum, point) => sum + point.y, 0) / points.length)
    };
  });

  const candidates = [];
  MAP_REGIONS.forEach((region) => {
    const right = MAP_REGIONS.find((candidate) => candidate.row === region.row && candidate.col === region.col + 1);
    const down = MAP_REGIONS.find((candidate) => candidate.row === region.row + 1 && candidate.col === region.col);
    if (right) candidates.push({ a: region.id, b: right.id });
    if (down) candidates.push({ a: region.id, b: down.id });
  });
  shuffleWithRng(candidates, rng);

  const parents = new Map(MAP_REGIONS.map((region) => [region.id, region.id]));
  const findRoot = (id) => {
    let root = id;
    while (parents.get(root) !== root) root = parents.get(root);
    return root;
  };
  const roads = [];
  const remaining = [];
  candidates.forEach((candidate) => {
    const leftRoot = findRoot(candidate.a);
    const rightRoot = findRoot(candidate.b);
    if (leftRoot !== rightRoot) {
      parents.set(leftRoot, rightRoot);
      roads.push(candidate);
    } else {
      remaining.push(candidate);
    }
  });
  shuffleWithRng(remaining, rng);
  roads.push(...remaining.slice(0, 7 + rng.nextInt(5)));

  return {
    regions,
    roads: roads.map((road, index) => {
      const left = regions[road.a];
      const right = regions[road.b];
      const dx = right.centerX - left.centerX;
      const dy = right.centerY - left.centerY;
      const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const offset = (rng.next() - 0.5) * 7;
      return {
        id: `road-${index}-${road.a}-${road.b}`,
        a: road.a,
        b: road.b,
        bendX: roundMapCoordinate((left.centerX + right.centerX) / 2 - dy / length * offset),
        bendY: roundMapCoordinate((left.centerY + right.centerY) / 2 + dx / length * offset)
      };
    })
  };
}

function roundMapCoordinate(value) {
  return Math.round(value * 100) / 100;
}

function shuffleWithRng(values, rng) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = rng.nextInt(index + 1);
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function normalizeMapBlueprint(source, seedValue) {
  const generated = generateMapBlueprint(seedValue);
  const sourceLayout = source?.layout && typeof source.layout === "object" ? source.layout : null;
  const hasCompleteLayout = sourceLayout && MAP_REGIONS.every((region) => {
    const record = sourceLayout[region.id];
    return Array.isArray(record?.points) && record.points.length >= 4;
  });
  const roads = Array.isArray(source?.roads)
    ? source.roads.filter((road) => mapRegionById(road?.a) && mapRegionById(road?.b))
    : [];
  return {
    layout: hasCompleteLayout ? sourceLayout : generated.regions,
    roads: roads.length >= MAP_REGIONS.length - 1 ? roads : generated.roads
  };
}

function createInitialMapState(source = {}, options = {}) {
  const safe = source && typeof source === "object" ? source : {};
  const seed = normalizeSeed(options.seed || safe.seed || 1);
  const difficulty = normalizeDifficulty(options.difficulty || safe.difficulty || "normal");
  const config = difficultyConfig(difficulty);
  const realmName = options.realmName || safe.realmName || DEFAULT_REALM_NAME;
  const startingRegionId = normalizeStartingRegionId(options.startingRegionId || safe.startingRegionId || "capital");
  const entities = createPoliticalEntities(safe.entities, realmName, seed);
  const blueprint = normalizeMapBlueprint(safe, seed);
  const initialControllers = generateInitialRegionControllers(seed, startingRegionId);
  const sourceRegions = Array.isArray(safe.regions) ? safe.regions : [];
  const regionLookup = new Map(sourceRegions.map((region) => [region.id, region]));

  return {
    seed,
    difficulty,
    startingRegionId,
    entities,
    layout: blueprint.layout,
    roads: blueprint.roads,
    lastEvent: safe.lastEvent && typeof safe.lastEvent === "object"
      ? {
          title: String(safe.lastEvent.title || "边境静默"),
          text: String(safe.lastEvent.text || MAP_EVENT_NONE),
          type: String(safe.lastEvent.type || "none"),
          regionId: mapRegionById(safe.lastEvent.regionId) ? safe.lastEvent.regionId : null
        }
      : { title: "边境静默", text: MAP_EVENT_NONE, type: "none" },
    regions: MAP_REGIONS.map((region) => {
      const stored = regionLookup.get(region.id) || {};
      const fallbackController = initialControllers[region.id] || initialControllerForRegion(region.id);
      const fallbackOwner = initialMapOwner(region.id);
      const storedController = entities[stored.controllerId] ? stored.controllerId : null;
      const owner = storedController
        ? entities[storedController].owner
        : normalizeMapOwner(stored.owner || fallbackOwner);
      const controllerId = storedController || (
        owner === MAP_OWNER_RUINS
          ? null
          : Object.keys(stored).length
            ? entityIdForOwner(owner)
            : fallbackController
      );
      const ownerScale = owner === MAP_OWNER_RIVAL
        ? config.rivalPower
        : owner === MAP_OWNER_NEUTRAL
          ? config.neutralPower
          : 1;
      const baseFortification = Object.prototype.hasOwnProperty.call(stored, "fortification")
        ? stored.fortification
        : region.strength * ownerScale;
      return {
        id: region.id,
        owner,
        controllerId,
        fortification: clamp(Math.round(finiteOr(baseFortification, region.strength)), 5, 140)
      };
    })
  };
}

function createInitialArmies(current = {}, difficulty = "normal") {
  const config = difficultyConfig(difficulty);
  const sourceArmies = Array.isArray(current.armies) ? current.armies : [];
  const hasStoredRoster = Array.isArray(current.armies);
  const rawPlayerForce = finiteOr(current.force, 6200 + Math.sqrt(Math.max(0, finiteOr(current.pop, 7600))) * 18);
  const defaults = [
    {
      id: PLAYER_ARMY_ID,
      name: "第一军团",
      entityId: PLAYER_ENTITY_ID,
      regionId: "capital",
      force: Math.round(rawPlayerForce * config.playerForce),
      attackBonus: 4,
      defenseBonus: 6
    },
    {
      id: "neutral-iron-host",
      name: "铁山卫队",
      entityId: NEUTRAL_ENTITY_ID,
      regionId: "ironHills",
      force: Math.round(4300 * config.neutralPower),
      attackBonus: 1,
      defenseBonus: 5
    },
    {
      id: "neutral-east-host",
      name: "东部城防军",
      entityId: NEUTRAL_COAST_ENTITY_ID,
      regionId: "easternBasin",
      force: Math.round(5100 * config.neutralPower),
      attackBonus: 2,
      defenseBonus: 7
    },
    {
      id: "rival-north-host",
      name: "北境军团",
      entityId: RIVAL_ENTITY_ID,
      regionId: "northReach",
      force: Math.round(5600 * config.rivalPower),
      attackBonus: 4,
      defenseBonus: 3
    },
    {
      id: "rival-river-host",
      name: "灰河军团",
      entityId: RIVAL_ASH_ENTITY_ID,
      regionId: "ashRiver",
      force: Math.round(4900 * config.rivalPower),
      attackBonus: 3,
      defenseBonus: 4
    }
  ];
  const sourceLookup = new Map(sourceArmies.map((army) => [army.id, army]));

  const defeatedEntityIds = Array.isArray(current.defeatedEntityIds) ? current.defeatedEntityIds : [];
  const defaultIds = new Set(defaults.map((army) => army.id));
  const normalizedDefaults = defaults
    .filter((fallback) => !defeatedEntityIds.includes(fallback.entityId))
    .filter((fallback) => !hasStoredRoster || sourceLookup.has(fallback.id))
    .map((fallback) => normalizeArmyRecord(sourceLookup.get(fallback.id), fallback));
  const customArmies = sourceArmies
    .filter((army) => army && !defaultIds.has(army.id))
    .filter((army) => POLITICAL_ENTITY_IDS.includes(army.entityId) && !defeatedEntityIds.includes(army.entityId))
    .map((army, index) => normalizeArmyRecord(army, {
      id: String(army.id || `field-army-${index}`),
      name: String(army.name || "野战军团"),
      entityId: army.entityId,
      regionId: mapRegionById(army.regionId)?.id || "capital",
      force: finiteOr(army.force, 0),
      attackBonus: finiteOr(army.attackBonus, 0),
      defenseBonus: finiteOr(army.defenseBonus, 0)
    }));
  return [...normalizedDefaults, ...customArmies];
}

function normalizeArmyRecord(stored = {}, fallback) {
  const safe = stored && typeof stored === "object" ? stored : {};
  return {
    id: String(safe.id || fallback.id),
    name: String(safe.name || fallback.name),
    entityId: POLITICAL_ENTITY_IDS.includes(safe.entityId) ? safe.entityId : fallback.entityId,
    regionId: mapRegionById(safe.regionId) ? safe.regionId : fallback.regionId,
    force: clamp(Math.round(finiteOr(safe.force, fallback.force)), 0, MILITARY_FORCE_CAP),
    attackBonus: clamp(Math.round(finiteOr(safe.attackBonus, fallback.attackBonus)), -30, 80),
    defenseBonus: clamp(Math.round(finiteOr(safe.defenseBonus, fallback.defenseBonus)), -30, 80),
    posture: ["attack", "defense", "march"].includes(safe.posture) ? safe.posture : "defense",
    lastMovedTurn: Math.round(finiteOr(safe.lastMovedTurn, -1))
  };
}

function createInitialMilitaryState(current = {}, options = {}) {
  const difficulty = normalizeDifficulty(options.difficulty || current.difficulty || "normal");
  const armies = createInitialArmies(current, difficulty);
  const playerForce = armies
    .filter((army) => army.entityId === PLAYER_ENTITY_ID)
    .reduce((sum, army) => sum + army.force, 0);
  return {
    force: clamp(Math.round(playerForce), 0, MILITARY_FORCE_CAP),
    attackModifier: clamp(Math.round(finiteOr(current.attackModifier, 0)), -40, 80),
    defenseModifier: clamp(Math.round(finiteOr(current.defenseModifier, 0)), -40, 80),
    warWeariness: clamp(Math.round(finiteOr(current.warWeariness, 0)), 0, 100),
    campaigns: Math.max(0, Math.round(finiteOr(current.campaigns, 0))),
    defeatedEntityIds: Array.isArray(current.defeatedEntityIds)
      ? current.defeatedEntityIds.filter((entityId) => POLITICAL_ENTITY_IDS.includes(entityId))
      : [],
    armies,
    lastBattle: current.lastBattle && typeof current.lastBattle === "object"
      ? {
          title: String(current.lastBattle.title || "边境静默"),
          text: String(current.lastBattle.text || MAP_EVENT_NONE),
          type: String(current.lastBattle.type || "none"),
          regionId: mapRegionById(current.lastBattle.regionId) ? current.lastBattle.regionId : null
        }
      : { title: "边境静默", text: MAP_EVENT_NONE, type: "none" }
  };
}

function normalizeMilitaryState(source = {}, current = {}) {
  const safe = source && typeof source === "object" ? source : {};
  const military = createInitialMilitaryState(
    {
      ...current,
      ...safe,
      force: finiteOr(safe.force, current.force),
      armies: safe.armies
    },
    { difficulty: current.difficulty }
  );
  const eliminated = Object.values(current.map?.entities || {})
    .filter((entity) => entity?.eliminated)
    .map((entity) => entity.id);
  military.defeatedEntityIds = Array.from(new Set([...military.defeatedEntityIds, ...eliminated]));
  military.armies = military.armies.filter((army) => !military.defeatedEntityIds.includes(army.entityId));
  military.force = military.armies
    .filter((army) => army.entityId === PLAYER_ENTITY_ID)
    .reduce((sum, army) => sum + army.force, 0);
  return military;
}

function normalizeMapOwner(owner) {
  return [MAP_OWNER_PLAYER, MAP_OWNER_NEUTRAL, MAP_OWNER_RIVAL, MAP_OWNER_RUINS].includes(owner)
    ? owner
    : MAP_OWNER_NEUTRAL;
}

function mapRegionById(regionId) {
  return MAP_REGIONS.find((region) => region.id === regionId) || null;
}

function politicalEntityById(entityId, mapState = state?.map) {
  return mapState?.entities?.[entityId] || null;
}

function politicalEntityByIdForState(source, entityId) {
  return source?.map?.entities?.[entityId] || null;
}

function politicalEntities(mapState = state?.map) {
  return POLITICAL_ENTITY_IDS.map((entityId) => politicalEntityById(entityId, mapState)).filter(Boolean);
}

function selectedPoliticalEntity() {
  return politicalEntityById(state?.selectedEntityId) || politicalEntityById(PLAYER_ENTITY_ID) || politicalEntities()[0] || null;
}

function entityRegions(entityId, mapState = state?.map) {
  return Array.isArray(mapState?.regions)
    ? mapState.regions.filter((region) => region.controllerId === entityId)
    : [];
}

function entityArmies(entityId) {
  return armies().filter((army) => army.entityId === entityId && army.force > 0);
}

function entityMilitaryForce(entityId) {
  return entityArmies(entityId).reduce((sum, army) => sum + finiteOr(army.force, 0), 0);
}

function mapStateRegion(regionId) {
  return state.map?.regions?.find((region) => region.id === regionId) || null;
}

function mapRegionOwner(region, mapState = state?.map) {
  const entity = politicalEntityById(region?.controllerId, mapState);
  return entity ? entity.owner : normalizeMapOwner(region?.owner);
}

function setRegionController(region, entityId) {
  const entity = politicalEntityById(entityId);
  if (!region || !entity) return false;
  region.controllerId = entityId;
  region.owner = entity.owner;
  return true;
}

function eliminateDefeatedEntities() {
  if (!state?.map?.entities || !state?.military) return [];
  const eliminated = [];
  politicalEntities().forEach((entity) => {
    if (entity.eliminated || entityRegions(entity.id).length > 0) return;
    entity.eliminated = true;
    entity.eliminatedYear = state.turn;
    eliminated.push(entity);
    state.military.armies = armies().filter((army) => army.entityId !== entity.id);
    if (!Array.isArray(state.military.defeatedEntityIds)) state.military.defeatedEntityIds = [];
    if (!state.military.defeatedEntityIds.includes(entity.id)) state.military.defeatedEntityIds.push(entity.id);
    if (state.selectedArmyId && !armyById(state.selectedArmyId)) state.selectedArmyId = PLAYER_ARMY_ID;
  });
  setPlayerMilitaryForce(entityMilitaryForce(PLAYER_ENTITY_ID));
  return eliminated;
}

function alignArmiesWithEntityTerritories() {
  if (!state?.map || !state?.military) return;
  state.military.armies = armies().filter((army) => {
    const territories = entityRegions(army.entityId);
    if (!territories.length) return false;
    if (!territories.some((region) => region.id === army.regionId)) {
      const preferred = army.entityId === PLAYER_ENTITY_ID
        ? territories.find((region) => region.id === state.startingRegionId)
        : null;
      army.regionId = (preferred || territories[0]).id;
    }
    return true;
  });
  setPlayerMilitaryForce(entityMilitaryForce(PLAYER_ENTITY_ID));
}

function roadNeighbors(regionId) {
  return activeMapRoads().reduce((neighbors, road) => {
    if (road.a === regionId) neighbors.push(road.b);
    if (road.b === regionId) neighbors.push(road.a);
    return neighbors;
  }, []);
}

function regionsShareRoad(leftRegionId, rightRegionId) {
  return activeMapRoads().some((road) => {
    return (road.a === leftRegionId && road.b === rightRegionId) ||
      (road.b === leftRegionId && road.a === rightRegionId);
  });
}

function hasFullMilitaryIntel() {
  return Boolean(governorBalanceEffects().fullIntel);
}

function visibleMilitaryRegionIds() {
  if (hasFullMilitaryIntel()) return new Set(MAP_REGIONS.map((region) => region.id));
  const visible = new Set();
  entityRegions(PLAYER_ENTITY_ID).forEach((region) => {
    visible.add(region.id);
    roadNeighbors(region.id).forEach((neighborId) => visible.add(neighborId));
  });
  return visible;
}

function canObserveMilitaryAt(regionId) {
  return hasFullMilitaryIntel() || visibleMilitaryRegionIds().has(regionId);
}

function activeMapRoads(mapState = state?.map) {
  return Array.isArray(mapState?.roads) ? mapState.roads : [];
}

function mapLayoutRegion(regionId, mapState = state?.map) {
  return mapState?.layout?.[regionId] || null;
}

function armies() {
  return Array.isArray(state?.military?.armies) ? state.military.armies : [];
}

function armyById(armyId) {
  return armies().find((army) => army.id === armyId) || null;
}

function armyByIdForState(source, armyId) {
  const sourceArmies = Array.isArray(source?.military?.armies) ? source.military.armies : [];
  return sourceArmies.find((army) => army.id === armyId) || null;
}

function primaryPlayerArmy() {
  return armyById(PLAYER_ARMY_ID) || armies().find((army) => army.entityId === PLAYER_ENTITY_ID) || null;
}

function selectedArmy() {
  return armyById(state?.selectedArmyId) || primaryPlayerArmy() || armies()[0] || null;
}

function setPlayerMilitaryForce(value) {
  const nextForce = clamp(Math.round(finiteOr(value, 0)), 0, MILITARY_FORCE_CAP);
  const playerArmies = entityArmies(PLAYER_ENTITY_ID);
  const currentForce = playerArmies.reduce((sum, army) => sum + army.force, 0);
  let delta = nextForce - currentForce;
  if (delta > 0 && playerArmies.length) {
    const receivingArmy = selectedArmy()?.entityId === PLAYER_ENTITY_ID ? selectedArmy() : playerArmies[0];
    receivingArmy.force = clamp(receivingArmy.force + delta, 0, MILITARY_FORCE_CAP);
  } else if (delta < 0) {
    let remainingLoss = Math.abs(delta);
    [...playerArmies].sort((left, right) => right.force - left.force).forEach((army) => {
      if (remainingLoss <= 0) return;
      const loss = Math.min(army.force, remainingLoss);
      army.force -= loss;
      remainingLoss -= loss;
    });
  }
  return syncPlayerMilitaryForce();
}

function syncPlayerMilitaryForce() {
  const total = clamp(Math.round(entityMilitaryForce(PLAYER_ENTITY_ID)), 0, MILITARY_FORCE_CAP);
  state.military.force = total;
  return total;
}

function armyOwner(army) {
  return politicalEntityById(army?.entityId)?.owner || MAP_OWNER_NEUTRAL;
}

function mapOwnerCounts(mapState = state.map) {
  const regions = Array.isArray(mapState?.regions) ? mapState.regions : [];
  return regions.reduce((counts, region) => {
    const owner = mapRegionOwner(region, mapState);
    counts[owner] = (counts[owner] || 0) + 1;
    return counts;
  }, { player: 0, neutral: 0, rival: 0 });
}

function isMapConquered() {
  if (!state.map?.regions?.length) return false;
  const counts = mapOwnerCounts();
  return counts.player >= MAP_REGIONS.length;
}

function isNationExtinct() {
  if (!state.map?.regions?.length) return false;
  const counts = mapOwnerCounts();
  return counts.player <= 0;
}

function createSpecialDecisionState(source = {}) {
  const decisions = {};
  Object.keys(SPECIAL_DECISIONS).forEach((decisionId) => {
    decisions[decisionId] = {
      cooldown: Math.max(0, Math.round(finiteOr(source[decisionId]?.cooldown, 0))),
      used: Math.max(0, Math.round(finiteOr(source[decisionId]?.used, 0)))
    };
  });
  return decisions;
}

function policyDelta(policyId) {
  return { ...(SPECIAL_DECISIONS[policyId]?.effects || {}) };
}

function policyDisabledReason(policyId, current = snapshot()) {
  const decision = SPECIAL_DECISIONS[policyId];
  if (!decision) return "未知政策";
  const record = state.specialDecisionState?.[policyId] || {};
  if (finiteOr(record.cooldown, 0) > 0) return `冷却 ${formatNumber(record.cooldown)} 年`;
  if (policyId === "levyHost") {
    const selectedRegion = mapStateRegion(state.selectedRegionId);
    if (selectedRegion?.controllerId !== PLAYER_ENTITY_ID) return "先在地图上选择一块本国领土";
  }

  const missing = Object.entries(decision.requirements || {}).find(([key, value]) => finiteOr(current[key], 0) < value);
  if (!missing) return "";
  const [key, value] = missing;
  return `${metricLabel(key)} 需 ${formatNumber(value)}`;
}

function metricLabel(key) {
  return {
    sc: "SC",
    be: "BE",
    la: "LA",
    pop: "POP",
    eco: "ECO",
    stability: "秩序",
    force: "军力"
  }[key] || key.toUpperCase();
}

function applyPolicyActionEffect(policyId) {
  const decision = SPECIAL_DECISIONS[policyId];
  if (!decision) return;
  if (!state.specialDecisionState) state.specialDecisionState = createSpecialDecisionState();
  const record = state.specialDecisionState[policyId] || { cooldown: 0, used: 0 };
  state.specialDecisionState[policyId] = {
    cooldown: Math.max(0, Math.round(finiteOr(decision.cooldownYears, 0))),
    used: Math.max(0, Math.round(finiteOr(record.used, 0))) + 1
  };
  applyMilitaryPolicy(decision);
}

function applyMilitaryPolicy(decision) {
  if (!state.military) state.military = createInitialMilitaryState(snapshot(), { difficulty: state.difficulty });
  const military = decision.military || {};
  if (decision === SPECIAL_DECISIONS.levyHost) {
    const selectedRegion = mapStateRegion(state.selectedRegionId);
    const recruitmentRegion = selectedRegion?.controllerId === PLAYER_ENTITY_ID
      ? selectedRegion
      : entityRegions(PLAYER_ENTITY_ID)[0];
    if (recruitmentRegion) {
      const existingArmy = armiesAtRegion(recruitmentRegion.id)
        .find((army) => army.entityId === PLAYER_ENTITY_ID);
      const force = primaryPlayerArmy() ? finiteOr(military.force, 0) : maximumSustainableLevy();
      const recruitedArmy = existingArmy || {
        id: primaryPlayerArmy() ? `player-field-army-${state.turn}-${state.specialDecisionState?.levyHost?.used || 1}` : PLAYER_ARMY_ID,
        name: existingArmy ? existingArmy.name : primaryPlayerArmy() ? "地方军团" : "新生军团",
        entityId: PLAYER_ENTITY_ID,
        regionId: recruitmentRegion.id,
        force: 0,
        attackBonus: 2,
        defenseBonus: 4,
        posture: "defense",
        lastMovedTurn: state.turn - 1
      };
      if (!existingArmy) state.military.armies.push(recruitedArmy);
      recruitedArmy.force = clamp(recruitedArmy.force + force, 0, MILITARY_FORCE_CAP);
      state.selectedArmyId = recruitedArmy.id;
      state.selectedRegionId = recruitmentRegion.id;
      syncPlayerMilitaryForce();
    }
  } else {
    setPlayerMilitaryForce(finiteOr(state.military.force, 0) + finiteOr(military.force, 0));
  }
  state.military.attackModifier = clamp(Math.round(finiteOr(state.military.attackModifier, 0) + finiteOr(military.attack, 0)), -40, 80);
  state.military.defenseModifier = clamp(Math.round(finiteOr(state.military.defenseModifier, 0) + finiteOr(military.defense, 0)), -40, 80);
  const playerArmy = selectedArmy()?.entityId === PLAYER_ENTITY_ID ? selectedArmy() : primaryPlayerArmy();
  if (playerArmy && finiteOr(military.fortification, 0) > 0) {
    const region = mapStateRegion(playerArmy.regionId);
    if (region && mapRegionOwner(region) === MAP_OWNER_PLAYER) {
      region.fortification = clamp(
        Math.round(finiteOr(region.fortification, 0) + finiteOr(military.fortification, 0)),
        5,
        140
      );
    }
  }
  state.military.lastBattle = {
    title: decision.label,
    text: decision.description,
    type: "policy"
  };
  if (state.map) {
    state.map.lastEvent = { ...state.military.lastBattle };
  }
}

function maximumSustainableLevy() {
  const territoryCount = Math.max(1, entityRegions(PLAYER_ENTITY_ID).length);
  return clamp(
    Math.round(state.pop * 0.34 + Math.sqrt(Math.max(0, state.eco)) * 14 + territoryCount * 420),
    4200,
    26000
  );
}

function tickSpecialDecisionCooldowns() {
  if (!state?.specialDecisionState) return;
  Object.keys(state.specialDecisionState).forEach((decisionId) => {
    const record = state.specialDecisionState[decisionId];
    record.cooldown = Math.max(0, Math.round(finiteOr(record.cooldown, 0)) - 1);
  });
}

function updateCivilizationStats(snapshotValue = snapshot(), specialEventTitle = null) {
  if (!state.currentCivilization) {
    state.currentCivilization = createCivilizationStats(state.count, state.turn, snapshotValue);
  }

  const stats = state.currentCivilization;
  stats.turns = Math.max(0, state.turn - stats.startTurn);
  stats.peakSc = Math.max(stats.peakSc, snapshotValue.sc);
  stats.peakBe = Math.max(stats.peakBe, snapshotValue.be);
  stats.peakLa = Math.max(stats.peakLa || 0, snapshotValue.la || 0);
  stats.peakPop = Math.max(stats.peakPop, snapshotValue.pop);
  stats.peakEco = Math.max(stats.peakEco, snapshotValue.eco);
  stats.peakEerf = Math.max(stats.peakEerf || 0, snapshotValue.eerf || state.eerfLevel || 0);
  stats.peakStability = Math.max(stats.peakStability, snapshotValue.stability);
  stats.minStability = Math.min(finiteOr(stats.minStability, snapshotValue.stability), snapshotValue.stability);
  stats.hadLowOrder = Boolean(stats.hadLowOrder || snapshotValue.stability < I_LOW_ORDER_THRESHOLD);
  stats.hadLaCap = Boolean(stats.hadLaCap || snapshotValue.la >= J_MEMORY_LA_THRESHOLD);

  if (specialEventTitle && !stats.specialEvents.includes(specialEventTitle)) {
    stats.specialEvents.unshift(specialEventTitle);
    stats.specialEvents = stats.specialEvents.slice(0, 6);
  }
}

function init() {
  cacheDom();
  syncActionButtonCopy();
  syncUtilityButtonCopy();
  const querySeed = seedFromUrl();
  const restoredState = querySeed ? null : loadState();
  if (querySeed) {
    clearSavedRun();
    clearStoredEnding();
    state = createNewState(querySeed);
    saveState();
    removeSeedFromUrl();
  } else if (restoredState?.finished) {
    clearSavedRun();
    clearStoredEnding();
    state = createNewState();
    saveState();
  } else {
    state = restoredState || createNewState();
    state.loadedFromSave = Boolean(restoredState);
  }
  state.aiAggression = normalizeAiAggression(state.aiAggression);
  state.governorId = normalizeGovernorId(state.governorId);
  state.startingRegionId = normalizeStartingRegionId(state.startingRegionId || state.map?.startingRegionId);
  state.mapUiExpanded = state.mapUiExpanded !== false;
  alignArmiesWithEntityTerritories();
  eliminateDefeatedEntities();
  bindEvents();
  if (maybeFinishGame({ kind: "load", trigger: "载入存档" })) return;
  updateEnding();
  render();
  scheduleAutoRunIfNeeded();
}

function seedFromUrl() {
  try {
    const url = new URL(window.location.href);
    const seed = url.searchParams.get("seed");
    return seed && seed.trim() ? seed.trim() : null;
  } catch {
    return null;
  }
}

function removeSeedFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("seed")) return;
    url.searchParams.delete("seed");
    window.history?.replaceState?.({}, "", url.href);
  } catch {
    // URL cleanup is cosmetic; the seed has already been consumed.
  }
}

function cacheDom() {
  dom.setupPanel = document.querySelector("#setupPanel");
  dom.gamePanel = document.querySelector("#gamePanel");
  dom.realmNameForm = document.querySelector("#realmNameForm");
  dom.setupQuote = document.querySelector("#setupQuote");
  dom.realmNameInput = document.querySelector("#realmNameInput");
  dom.difficultyStep = document.querySelector("#difficultyStep");
  dom.governorStep = document.querySelector("#governorStep");
  dom.territoryStep = document.querySelector("#territoryStep");
  dom.setupRealmPreview = document.querySelector("#setupRealmPreview");
  dom.difficultyButtons = Array.from(document.querySelectorAll("[data-difficulty]"));
  dom.aggressionButtons = Array.from(document.querySelectorAll("[data-aggression]"));
  dom.governorButtons = Array.from(document.querySelectorAll("[data-governor]"));
  dom.mapModeButtons = Array.from(document.querySelectorAll("[data-map-mode]"));
  dom.backToNameButton = document.querySelector("#backToNameButton");
  dom.continueToGovernorButton = document.querySelector("#continueToGovernorButton");
  dom.backToDifficultyButton = document.querySelector("#backToDifficultyButton");
  dom.continueToTerritoryButton = document.querySelector("#continueToTerritoryButton");
  dom.backToGovernorButton = document.querySelector("#backToGovernorButton");
  dom.startCivilizationButton = document.querySelector("#startCivilizationButton");
  dom.startRegionMap = document.querySelector("#startRegionMap");
  dom.startRegionName = document.querySelector("#startRegionName");
  dom.startRegionDescription = document.querySelector("#startRegionDescription");
  dom.realmIdentity = document.querySelector("#realmIdentity");
  dom.activeGovernorPortrait = document.querySelector("#activeGovernorPortrait");
  dom.activeGovernorName = document.querySelector("#activeGovernorName");
  dom.countValue = document.querySelector("#countValue");
  dom.turnValue = document.querySelector("#turnValue");
  dom.randValue = document.querySelector("#randValue");
  dom.scValue = document.querySelector("#scValue");
  dom.beValue = document.querySelector("#beValue");
  dom.laValue = document.querySelector("#laValue");
  dom.popValue = document.querySelector("#popValue");
  dom.ecoValue = document.querySelector("#ecoValue");
  dom.eerfValue = document.querySelector("#eerfValue");
  dom.scMeter = document.querySelector("#scMeter");
  dom.beMeter = document.querySelector("#beMeter");
  dom.laMeter = document.querySelector("#laMeter");
  dom.popMeter = document.querySelector("#popMeter");
  dom.ecoMeter = document.querySelector("#ecoMeter");
  dom.eerfMeter = document.querySelector("#eerfMeter");
  dom.scEra = document.querySelector("#scEra");
  dom.beEra = document.querySelector("#beEra");
  dom.scTrendValue = document.querySelector("#scTrendValue");
  dom.beTrendValue = document.querySelector("#beTrendValue");
  dom.popTrendValue = document.querySelector("#popTrendValue");
  dom.ecoTrendValue = document.querySelector("#ecoTrendValue");
  dom.laTrendValue = document.querySelector("#laTrendValue");
  dom.orderTrendValue = document.querySelector("#orderTrendValue");
  dom.scTrendStage = document.querySelector("#scTrendStage");
  dom.beTrendStage = document.querySelector("#beTrendStage");
  dom.popTrendStage = document.querySelector("#popTrendStage");
  dom.ecoTrendStage = document.querySelector("#ecoTrendStage");
  dom.laTrendStage = document.querySelector("#laTrendStage");
  dom.orderTrendStage = document.querySelector("#orderTrendStage");
  dom.stabilityValue = document.querySelector("#stabilityValue");
  dom.ecoStatus = document.querySelector("#ecoStatus");
  dom.eerfStatus = document.querySelector("#eerfStatus");
  dom.laStatus = document.querySelector("#laStatus");
  dom.weatherLabel = document.querySelector("#weatherLabel");
  dom.endingLabel = document.querySelector("#endingLabel");
  dom.specialBanner = document.querySelector("#specialBanner");
  dom.specialTitle = document.querySelector("#specialTitle");
  dom.specialText = document.querySelector("#specialText");
  dom.specialDelta = document.querySelector("#specialDelta");
  dom.seedInput = document.querySelector("#seedInput");
  dom.mapExpansionToggle = document.querySelector("#mapExpansionToggle");
  dom.mapExpansionSections = Array.from(document.querySelectorAll("[data-map-expansion]"));
  dom.worldMap = document.querySelector("#worldMap");
  dom.mapStatus = document.querySelector("#mapStatus");
  dom.mapFeed = document.querySelector("#mapFeed");
  dom.militaryForceValue = document.querySelector("#militaryForceValue");
  dom.militaryAttackValue = document.querySelector("#militaryAttackValue");
  dom.militaryDefenseValue = document.querySelector("#militaryDefenseValue");
  dom.militaryTechnologyValue = document.querySelector("#militaryTechnologyValue");
  dom.militaryPowerValue = document.querySelector("#militaryPowerValue");
  dom.selectedArmyName = document.querySelector("#selectedArmyName");
  dom.selectedArmyOwner = document.querySelector("#selectedArmyOwner");
  dom.selectedArmyRegion = document.querySelector("#selectedArmyRegion");
  dom.deploymentHint = document.querySelector("#deploymentHint");
  dom.selectedRegionName = document.querySelector("#selectedRegionName");
  dom.selectedRegionTerrain = document.querySelector("#selectedRegionTerrain");
  dom.selectedRegionController = document.querySelector("#selectedRegionController");
  dom.selectedRegionDefense = document.querySelector("#selectedRegionDefense");
  dom.selectedRegionRoads = document.querySelector("#selectedRegionRoads");
  dom.selectedRegionArmies = document.querySelector("#selectedRegionArmies");
  dom.deployArmyButton = document.querySelector("#deployArmyButton");
  dom.entityCards = document.querySelector("#entityCards");
  dom.entityPanelName = document.querySelector("#entityPanelName");
  dom.entityRelationValue = document.querySelector("#entityRelationValue");
  dom.entityTerritoryValue = document.querySelector("#entityTerritoryValue");
  dom.entityForceValue = document.querySelector("#entityForceValue");
  dom.entityDevelopmentValue = document.querySelector("#entityDevelopmentValue");
  dom.entityTechnologyValue = document.querySelector("#entityTechnologyValue");
  dom.entityStrategySelect = document.querySelector("#entityStrategySelect");
  dom.entityStrategyText = document.querySelector("#entityStrategyText");
  dom.frontierValue = document.querySelector("#frontierValue");
  dom.endingWatchList = document.querySelector("#endingWatchList");
  dom.eerfDetailList = document.querySelector("#eerfDetailList");
  dom.endingStatsStatus = document.querySelector("#endingStatsStatus");
  dom.endingStatsList = document.querySelector("#endingStatsList");
  dom.logList = document.querySelector("#logList");
  dom.logFilterButtons = Array.from(document.querySelectorAll("[data-log-filter]"));
  dom.archiveList = document.querySelector("#archiveList");
  dom.clearLogButton = document.querySelector("#clearLogButton");
  dom.newGameButton = document.querySelector("#newGameButton");
  dom.actionButtons = Array.from(document.querySelectorAll("[data-action]"));
}

function syncActionButtonCopy() {
  dom.actionButtons.forEach((button) => {
    const action = ACTIONS[button.dataset.action];
    if (!action) return;

    const title = button.querySelector(".action-copy strong");
    const description = button.querySelector(".action-copy small");
    if (title) title.textContent = action.label;
    if (description) description.textContent = action.text;
    const shortcut = ACTION_SHORTCUT_LABELS[button.dataset.action];
    const accessibleName = shortcut ? `${action.label}，快捷键 ${shortcut}` : action.label;
    button.dataset.accessibleName = accessibleName;
    button.title = accessibleName;
    button.setAttribute("aria-label", accessibleName);
    syncShortcutBadge(button, shortcut, "shortcut-badge");
  });
}

function syncUtilityButtonCopy() {
  UTILITY_SHORTCUTS.forEach((shortcut) => {
    const button = document.querySelector(`#${shortcut.buttonId}`);
    if (!button) return;

    const baseLabel = button.dataset.baseLabel || button.textContent.trim();
    button.dataset.baseLabel = baseLabel;
    button.textContent = "";

    const label = document.createElement("span");
    label.textContent = baseLabel;
    button.append(label);
    syncShortcutBadge(button, shortcut.label, "inline-shortcut");

    const accessibleName = `${baseLabel}，快捷键 ${shortcut.label}`;
    button.title = accessibleName;
    button.setAttribute("aria-label", accessibleName);
    button.setAttribute("aria-keyshortcuts", shortcut.label);
  });
}

function syncShortcutBadge(button, label, className) {
  const existing = Array.from(button.children).find((child) => child.classList.contains(className));
  if (!label) {
    existing?.remove();
    button.removeAttribute("aria-keyshortcuts");
    return;
  }

  const badge = existing || document.createElement("span");
  badge.className = className;
  badge.setAttribute("aria-hidden", "true");
  badge.textContent = label;
  if (!existing) button.append(badge);
  button.setAttribute("aria-keyshortcuts", label);
}

function bindEvents() {
  dom.realmNameForm?.addEventListener("submit", confirmRealmName);
  dom.difficultyButtons.forEach((button) => {
    button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
  });
  dom.aggressionButtons.forEach((button) => {
    button.addEventListener("click", () => selectAiAggression(button.dataset.aggression));
  });
  dom.governorButtons.forEach((button) => {
    button.addEventListener("click", () => selectGovernor(button.dataset.governor));
  });
  dom.mapModeButtons.forEach((button) => {
    button.addEventListener("click", () => selectMapMode(button.dataset.mapMode));
  });
  dom.backToNameButton?.addEventListener("click", returnToRealmName);
  dom.continueToGovernorButton?.addEventListener("click", continueToGovernor);
  dom.backToDifficultyButton?.addEventListener("click", returnToDifficulty);
  dom.continueToTerritoryButton?.addEventListener("click", continueToTerritory);
  dom.backToGovernorButton?.addEventListener("click", returnToGovernor);
  dom.startCivilizationButton?.addEventListener("click", completeWorldSetup);
  dom.startRegionMap?.addEventListener("click", handleStartRegionInteraction);
  dom.startRegionMap?.addEventListener("keydown", handleStartRegionKeyboardInteraction);
  dom.worldMap?.addEventListener("click", handleMapInteraction);
  dom.worldMap?.addEventListener("keydown", handleMapKeyboardInteraction);
  dom.entityCards?.addEventListener("click", handleEntityCardClick);
  dom.entityStrategySelect?.addEventListener("change", changeSelectedEntityStrategy);
  dom.deployArmyButton?.addEventListener("click", deployArmyToSelectedRegion);
  dom.mapExpansionToggle?.addEventListener("click", toggleMapExpansion);

  dom.actionButtons.forEach((button) => {
    button.addEventListener("click", () => advanceRound(button.dataset.action));
  });

  dom.newGameButton?.addEventListener("click", randomizeOrStartNewWorld);

  dom.clearLogButton.addEventListener("click", clearChronicle);
  dom.logFilterButtons.forEach((button) => {
    button.addEventListener("click", () => setLogFilter(button.dataset.logFilter || "all"));
  });

  window.addEventListener("keydown", handleShortcut);
}

function scheduleAutoRunIfNeeded() {
  if (!state || state.finished || state.awaitingCivilizationRestart || !state.autoRunUntilCollapse) {
    cancelAutoRun();
    return;
  }

  if (autoRunHandle) return;
  autoRunHandle = window.setTimeout(() => {
    autoRunHandle = 0;
    if (!state || state.finished || state.awaitingCivilizationRestart || !state.autoRunUntilCollapse) return;
    advanceRound(DIVIDE_AUTO_ACTION);
  }, DIVIDE_AUTO_DELAY_MS);
}

function cancelAutoRun() {
  if (!autoRunHandle) return;
  window.clearTimeout(autoRunHandle);
  autoRunHandle = 0;
}

function handleShortcut(event) {
  if (shouldIgnoreShortcut(event)) return;

  const key = event.key.toLowerCase();
  if (handleUtilityShortcut(event, key)) return;

  const shortcut = ACTION_SHORTCUTS.find((item) => {
    return item.key === key && Boolean(item.shiftKey) === event.shiftKey;
  });
  if (!shortcut) return;

  const button = dom.actionButtons.find((candidate) => candidate.dataset.action === shortcut.actionId);
  if (!button || button.disabled) return;

  event.preventDefault();
  flashShortcutButton(button);
  advanceRound(shortcut.actionId);
}

function handleUtilityShortcut(event, key) {
  const shortcut = UTILITY_SHORTCUTS.find((item) => {
    return item.key === key && Boolean(item.shiftKey) === event.shiftKey;
  });
  if (!shortcut) return false;

  const button = document.querySelector(`#${shortcut.buttonId}`);
  if (!button || button.disabled) return false;

  event.preventDefault();
  flashShortcutButton(button);
  shortcut.run();
  return true;
}

function startNewGame() {
  if (!confirmNewWorld()) return;
  startNewGameWithSeed(Date.now());
}

function randomizeOrStartNewWorld() {
  if (state?.setupComplete) {
    startNewGame();
    return;
  }

  const draftName = String(dom.realmNameInput?.value || state?.realmName || "").trim().slice(0, 24);
  cancelAutoRun();
  clearStoredEnding();
  state = createNewState(Date.now());
  state.realmName = draftName;
  saveState();
  render();
}

function startNewGameWithSeed(seedValue) {
  cancelAutoRun();
  clearStoredEnding();
  state = createNewState(seedValue);
  if (dom.seedInput) dom.seedInput.value = "";
  saveState();
  render();
}

function confirmRealmName(event) {
  event?.preventDefault();
  const realmName = String(dom.realmNameInput?.value || "").trim().slice(0, 24);
  if (!realmName) {
    dom.realmNameInput?.focus();
    return;
  }

  const requestedSeed = dom.seedInput?.value.trim() || state.seed;
  const nextState = createNewState(requestedSeed);
  nextState.realmName = realmName;
  nextState.setupStage = "difficulty";
  state = nextState;
  if (state.map?.entities?.[PLAYER_ENTITY_ID]) {
    state.map.entities[PLAYER_ENTITY_ID].name = realmName;
  }
  saveState();
  renderSetup();
}

function selectDifficulty(value) {
  state.difficulty = normalizeDifficulty(value);
  saveState();
  renderSetup();
}

function selectAiAggression(value) {
  state.aiAggression = normalizeAiAggression(value);
  saveState();
  renderSetup();
}

function continueToGovernor() {
  state.setupStage = "governor";
  saveState();
  renderSetup();
}

function selectGovernor(value) {
  state.governorId = normalizeGovernorId(value);
  saveState();
  renderSetup();
}

function returnToDifficulty() {
  state.setupStage = "difficulty";
  saveState();
  renderSetup();
}

function continueToTerritory() {
  state.setupStage = "territory";
  state.startingRegionId = normalizeStartingRegionId(state.startingRegionId);
  state.map = createInitialMapState({}, {
    seed: state.seed,
    realmName: state.realmName,
    difficulty: state.difficulty,
    startingRegionId: state.startingRegionId
  });
  saveState();
  renderSetup();
}

function returnToGovernor() {
  state.setupStage = "governor";
  saveState();
  renderSetup();
}

function selectMapMode(value) {
  state.mapUiExpanded = value !== "collapsed";
  saveState();
  renderSetup();
}

function handleStartRegionInteraction(event) {
  const region = event.target.closest("[data-start-region]");
  if (!region) return;
  selectStartingRegion(region.dataset.startRegion);
}

function handleStartRegionKeyboardInteraction(event) {
  if (!["Enter", " "].includes(event.key)) return;
  const region = event.target.closest?.("[data-start-region]");
  if (!region) return;
  event.preventDefault();
  selectStartingRegion(region.dataset.startRegion);
}

function selectStartingRegion(regionId) {
  state.startingRegionId = normalizeStartingRegionId(regionId);
  state.selectedRegionId = state.startingRegionId;
  state.map = createInitialMapState({}, {
    seed: state.seed,
    realmName: state.realmName,
    difficulty: state.difficulty,
    startingRegionId: state.startingRegionId
  });
  saveState();
  renderSetup();
}

function returnToRealmName() {
  state.setupStage = "name";
  saveState();
  renderSetup();
  dom.realmNameInput?.focus();
}

function completeWorldSetup() {
  const realmName = String(state.realmName || dom.realmNameInput?.value || "").trim().slice(0, 24);
  if (!realmName) {
    returnToRealmName();
    return;
  }

  state.realmName = realmName;
  state.difficulty = normalizeDifficulty(state.difficulty);
  state.aiAggression = normalizeAiAggression(state.aiAggression);
  state.governorId = normalizeGovernorId(state.governorId);
  state.startingRegionId = normalizeStartingRegionId(state.startingRegionId);
  state.mapUiExpanded = state.mapUiExpanded !== false;
  state.setupComplete = true;
  state.setupStage = "complete";
  state.map = createInitialMapState(
    {
      realmName: state.realmName,
      difficulty: state.difficulty,
      seed: state.seed,
      startingRegionId: state.startingRegionId
    },
    {
      seed: state.seed,
      realmName: state.realmName,
      difficulty: state.difficulty,
      startingRegionId: state.startingRegionId
    }
  );
  state.military = createInitialMilitaryState(snapshot(), { difficulty: state.difficulty });
  state.selectedArmyId = PLAYER_ARMY_ID;
  state.selectedEntityId = PLAYER_ENTITY_ID;
  state.selectedRegionId = state.startingRegionId;
  alignArmiesWithEntityTerritories();
  state.weather = `${state.realmName}开始文明演化`;
  saveState();
  updateEnding();
  render();
}

function confirmNewWorld() {
  if (!hasActiveRun()) return true;
  return window.confirm("当前文明进度会被新世界覆盖，终局统计仍会保留。继续？");
}

function hasActiveRun() {
  return Boolean(state && !state.finished && (state.turn > 0 || state.history.length || state.awaitingCivilizationRestart || state.endingCandidate?.id));
}

function toggleMapExpansion() {
  if (!state?.setupComplete || state.finished || state.awaitingCivilizationRestart) return;
  state.mapUiExpanded = state.mapUiExpanded === false;
  if (state.mapUiExpanded) {
    state.selectedRegionId = mapStateRegion(state.selectedRegionId)?.id || primaryPlayerArmy()?.regionId || state.startingRegionId;
  }
  updateEnding();
  saveState();
  render();
}

function renderMapExpansionMode() {
  const expanded = state?.mapUiExpanded !== false;
  dom.mapExpansionSections?.forEach((section) => {
    section.hidden = !expanded;
  });
  if (dom.mapExpansionToggle) {
    dom.mapExpansionToggle.setAttribute("aria-pressed", expanded ? "true" : "false");
    dom.mapExpansionToggle.textContent = expanded ? "战略拓展：展开" : "战略拓展：折叠";
    dom.mapExpansionToggle.title = expanded ? "收起地图、军事与相关决议" : "展开战略地图与军事系统";
  }
}

function clearChronicle() {
  state.log = [];
  saveState();
  renderLog();
}

function setLogFilter(filter) {
  currentLogFilter = ["all", "disaster", "special", "progress"].includes(filter) ? filter : "all";
  dom.logFilterButtons.forEach((button) => {
    const active = button.dataset.logFilter === currentLogFilter;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  renderLog();
}

function defaultEndingStats() {
  return {
    total: 0,
    endings: Object.fromEntries(Object.keys(window.THREE_SUN_ENDINGS || {}).map((id) => [id, 0])),
    lastEnding: null,
    updatedAt: null
  };
}

function normalizeEndingStats(source) {
  const defaults = defaultEndingStats();
  const stats = source && typeof source === "object" ? source : {};
  const endings = stats.endings && typeof stats.endings === "object" ? stats.endings : {};
  const normalized = {
    ...defaults,
    total: Math.max(0, Math.round(finiteOr(stats.total, defaults.total))),
    endings: { ...defaults.endings },
    lastEnding: typeof stats.lastEnding === "string" ? stats.lastEnding : null,
    updatedAt: typeof stats.updatedAt === "string" ? stats.updatedAt : null
  };

  Object.keys(defaults.endings).forEach((endingId) => {
    normalized.endings[endingId] = Math.max(0, Math.round(finiteOr(endings[endingId], 0)));
  });
  normalized.total = Math.max(
    normalized.total,
    Object.values(normalized.endings).reduce((sum, count) => sum + count, 0)
  );
  return normalized;
}

function loadEndingStats() {
  try {
    const raw = localStorage.getItem(ENDING_STATS_STORE_KEY);
    return normalizeEndingStats(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultEndingStats();
  }
}

function saveEndingStats(stats = state.endingStats) {
  try {
    localStorage.setItem(ENDING_STATS_STORE_KEY, JSON.stringify(normalizeEndingStats(stats)));
  } catch {
    // Persistent statistics are optional; a browser can still run the game without storage.
  }
}

function recordEndingCompletion(endingId) {
  const stats = normalizeEndingStats(state.endingStats || loadEndingStats());
  if (!Object.prototype.hasOwnProperty.call(stats.endings, endingId)) {
    stats.endings[endingId] = 0;
  }
  stats.endings[endingId] += 1;
  stats.total += 1;
  stats.lastEnding = endingId;
  stats.updatedAt = new Date().toISOString();
  state.endingStats = stats;
  saveEndingStats(stats);
  return stats;
}

function endingStatsSummary(stats = state?.endingStats) {
  const normalized = normalizeEndingStats(stats || loadEndingStats());
  const unique = Object.values(normalized.endings).filter((count) => count > 0).length;
  return {
    ...normalized,
    unique,
    totalEndings: Object.keys(normalized.endings).length
  };
}

function shouldIgnoreShortcut(event) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return true;

  const target = event.target;
  if (!target || target === document.body) return false;
  const tagName = target.tagName;
  return target.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function flashShortcutButton(button) {
  button.classList.remove("shortcut-flash");
  void button.offsetWidth;
  button.classList.add("shortcut-flash");
  window.setTimeout(() => button.classList.remove("shortcut-flash"), 180);
}

function advanceRound(actionId) {
  if (state.finished) {
    cancelAutoRun();
    goToEndingPage(state.finalEnding?.id || "A");
    return;
  }

  if (actionId === "restartCivilization") {
    cancelAutoRun();
    restartCivilizationFromPending();
    saveState();
    render();
    return;
  }

  if (actionId === "settleEnding") {
    settleCurrentEnding();
    return;
  }

  if (state.awaitingCivilizationRestart) return;

  const action = ACTIONS[actionId];
  if (!action || action.restartOnly || action.settleOnly) return;
  const crisisAtRoundStart = isEconomicCrisis();

  const rng = new Lcg(state.rngState);
  const rand = rng.nextInt(10000);
  const spec = rng.nextInt(SPEC_MAX) + 1;
  state.rngState = rng.state;
  state.turn += 1;
  tickSpecialDecisionCooldowns();
  state.lastRand = rand;
  state.lastSpec = spec;
  state.specialNotice = null;

  const before = snapshot();
  const drift = computeDrift(rand, before);
  const event = eventFor(rand, before);

  if (event.destroy) {
    const completedEerf = completeEerfActionBeforeDisaster(action, crisisAtRoundStart);
    const collapseSnapshot = completedEerf?.snapshot || before;
    const disasterEvent = !completedEerf
      ? event
      : {
          ...event,
          text: `极端环境抵抗设施赶在灾变抵达前完成最后一次封门。${event.text}`
        };
    if (!collapseCivilization(disasterEvent, collapseSnapshot, rand, {
      minimumRestartEerfLevel: completedEerf?.minimumRestartEerfLevel || 0
    })) {
      state.rngState = rng.state;
      saveState();
      render();
    }
    return;
  }

  applyDelta(drift, { freezeKnowledge: crisisAtRoundStart, protectPopulationFloor: true });
  if (maybeFinishGame({ kind: "drift", trigger: event.title, rand })) return;
  applyDelta(event.delta, { freezeKnowledge: crisisAtRoundStart, protectPopulationFloor: true });
  if (maybeFinishGame({ kind: "event", trigger: event.title, rand })) return;

  const specialEvent = specialEventFor(spec, rng);
  state.rngState = rng.state;
  if (specialEvent) {
    const specialTitle = specialEventTitleWithSpec(specialEvent, spec);
    const specialDelta = applySpecialEvent(specialEvent, {
      freezeKnowledge: crisisAtRoundStart,
      protectPopulationFloor: !specialEvent.piercesPopulationProtection
    });
    state.specialNotice = {
      title: specialTitle,
      text: specialEvent.text,
      delta: specialDelta,
      spec
    };
    updateCivilizationStats(snapshot());
    if (maybeFinishGame({ kind: "special", trigger: specialTitle, rand })) return;
    if (specialEvent.piercesPopulationProtection && state.populationLockTurns > 0) {
      state.lockedPopulation = state.pop;
    }
    if (state.pop <= 0 && specialEvent.piercesPopulationProtection) {
      if (!collapseCivilization(
        {
          title: specialTitle,
          text: `${specialEvent.text} EERF 无法替地表人口承受这次屠杀。`,
          type: "disaster"
        },
        snapshot(),
        rand
      )) {
        saveState();
        render();
      }
      return;
    }
  }

  const populationLockedBeforeAction = enforcePopulationLock();
  if (state.pop <= 0 && !action.canRunWithZeroPopulation) {
    if (!collapseCivilization(
      {
        title: "人口断代",
        text: "从何时开始，文明掐死了自己的最后一个婴儿？万籁俱寂，一切重新开始。",
        type: "disaster"
      },
      before,
      rand
    )) {
      saveState();
      render();
    }
    return;
  }

  const actionDelta = typeof action.delta === "function" ? action.delta(state) : action.delta;
  const actionResult = prepareActionDelta(action, actionDelta, crisisAtRoundStart);
  applyDelta(actionResult.delta, { freezeKnowledge: crisisAtRoundStart });
  if (!actionResult.locked && typeof action.effect === "function") {
    action.effect();
  }
  if (maybeFinishGame({ kind: "action", trigger: action.label, rand })) return;
  const pressureDelta = applyDelta(computeSystemPressure(snapshot()), { freezeKnowledge: crisisAtRoundStart });
  const populationWasLocked = enforcePopulationLock() || populationLockedBeforeAction;
  if (maybeFinishGame({ kind: "pressure", trigger: "系统压力", rand })) return;
  if (state.pop <= 0) {
    if (!collapseCivilization(
      {
        title: "人口断代",
        text: "最后的配给没有等来接收者，文明被迫再次归零。",
        type: "disaster"
      },
      before,
      rand
    )) {
      saveState();
      render();
    }
    return;
  }
  const militaryReport = resolveMilitaryYear(action, rand);
  if (maybeFinishGame({ kind: "military", trigger: militaryReport.title, rand })) return;
  updateEnding();

  const countdownDisaster = tickCivilizationTimers();
  if (countdownDisaster) {
    if (!collapseCivilization(countdownDisaster, before, rand)) {
      saveState();
      render();
    }
    return;
  }

  updateEnding();
  const after = snapshot();
  updateCivilizationStats(after);
  const trendEvents = updateKnowledgeTrends({
    event,
    specialEvent,
    action,
    actionResult,
    pressureDelta,
    rand
  });
  const totalDelta = diff(before, after);
  updateMetricTrends(totalDelta);
  recordMetricSample();
  state.weather = [event.title, action.label].filter(Boolean).join("；");
  const type = event.type === "special" || action.type === "special" || actionResult.locked
    ? "special"
    : "progress";
  state.lastTone = type;
  addLog({
    type,
    title: `第 ${state.turn} 年｜Rand ${formatRand(rand)}｜${state.weather}`,
    text: [
      event.text,
      actionResult.text,
      militaryReport.text,
      describeSystemPressure(pressureDelta),
      describeChronicleState(before, after, event, action),
      populationWasLocked ? "只生一个好，政府来养老。本年所有人口变化均被回滚。" : ""
    ]
      .filter(Boolean)
      .join(" "),
    delta: totalDelta
  });
  broadcastTrendEvents(trendEvents);

  saveState();
  render();
  scheduleAutoRunIfNeeded();
}

function computeDrift(rand, current) {
  const knowledgeTrend = computeKnowledgeTrendDrift(rand);
  const popNoise = (Math.floor(rand / 100) % 41) - 19;
  const orderNoise = (Math.floor(rand / 1000) % 9) - 4;
  const lowOrderPenalty = current.stability < 30 ? 900 : 0;
  const highOrderBonus = current.stability > 72 ? 650 : 0;
  const lowEconomyBuffer = current.eco > 0 && current.eco < 42000
    ? (42000 - current.eco) * 0.05
    : 0;

  return {
    sc: knowledgeTrend.sc,
    be: knowledgeTrend.be,
    la: Math.round(
      (current.pop > 12000 ? Math.sqrt(current.pop - 12000) * 0.09 : 0) +
        knowledgeHarmony(current.sc, current.be) * 5 +
        (current.stability >= 58 ? 3 : 0) -
        (current.eco <= 0 ? 18 : 0)
    ),
    pop: Math.round(current.pop * (0.004 + current.stability / 18000) + popNoise * 70 - lowOrderPenalty + highOrderBonus),
    eco: Math.round(Math.sqrt(Math.max(0, current.eco)) * 7 + current.stability * 8 - current.pop * 0.003 - (state.eerfLevel || 0) * 620 + lowEconomyBuffer),
    stability: orderNoise
  };
}

function computeKnowledgeTrendDrift(rand) {
  const scJitter = ((rand % 9) - 4) * 2;
  const beJitter = ((Math.floor(rand / 10) % 9) - 4) * 2;
  return {
    sc: Math.round(clamp(finiteOr(state.scTrend, 0) + scJitter, KNOWLEDGE_TREND_MIN, KNOWLEDGE_TREND_MAX)),
    be: Math.round(clamp(finiteOr(state.beTrend, 0) + beJitter, KNOWLEDGE_TREND_MIN, KNOWLEDGE_TREND_MAX))
  };
}

function updateKnowledgeTrends(context = {}) {
  const beforeTrends = {
    sc: finiteOr(state.scTrend, 0),
    be: finiteOr(state.beTrend, 0)
  };
  const current = snapshot();
  const nextTrends = {
    sc: evolveKnowledgeTrend("sc", beforeTrends.sc, current, context),
    be: evolveKnowledgeTrend("be", beforeTrends.be, current, context)
  };

  state.scTrend = nextTrends.sc;
  state.beTrend = nextTrends.be;
  return knowledgeTrendChangeEvents(beforeTrends, nextTrends);
}

function evolveKnowledgeTrend(key, previousTrend, current, context) {
  const target = knowledgeTrendTarget(key, current);
  const eventImpulse = knowledgeTrendImpulse(context.event?.delta, key, 0.06, 18) +
    knowledgeTrendImpulse(context.specialEvent?.delta, key, 0.05, 32) +
    knowledgeTrendImpulse(context.pressureDelta, key, 0.08, 12);
  const actionImpulseRaw = context.actionResult?.locked
    ? 0
    : actionTrendShift(context.action, key) + knowledgeTrendImpulse(context.actionResult?.delta, key, 0.04, 16);
  const actionImpulse = actionImpulseRaw;
  const noise = knowledgeTrendNoise(context.rand || state.lastRand || 0, key);
  const crisisDrag = current.eco <= 0 ? -28 : 0;
  const next = previousTrend * 0.68 + target * 0.22 + eventImpulse + actionImpulse + noise + crisisDrag;
  return Math.round(clamp(next, KNOWLEDGE_TREND_MIN, KNOWLEDGE_TREND_MAX));
}

function knowledgeTrendTarget(key, current) {
  const scRatio = current.sc / CAP;
  const beRatio = current.be / CAP;
  const harmony = knowledgeHarmony(current.sc, current.be);
  const rivalry = 1 - harmony;
  const economyIndex = current.eco <= 0 ? 0 : clamp(Math.log10(current.eco + 10) / 6, 0, 1);
  const populationIndex = clamp(Math.sqrt(Math.max(0, current.pop)) / 430, 0, 1.35);
  const orderRatio = clamp(current.stability, 0, 100) / 100;
  const crisisPenalty = current.eco <= 0 ? 86 : 0;

  if (key === "sc") {
    const target = clamp(
      8 +
        Math.sqrt(scRatio) * 54 +
        economyIndex * 34 +
        populationIndex * 18 +
        (orderRatio - 0.44) * 38 +
        harmony * 16 -
        beRatio * 52 -
        rivalry * 12 -
        crisisPenalty,
      -125,
      150
    );
    return target;
  }

  const anxietyLift = current.eco > 0 && current.eco < current.pop * 0.28 ? 18 : 0;
  const target = clamp(
    10 +
      Math.sqrt(beRatio) * 50 +
      populationIndex * 22 +
      orderRatio * 40 +
      harmony * 14 +
      anxietyLift -
      scRatio * 58 -
      rivalry * 10 -
      crisisPenalty * 0.8,
    -125,
    150
  );
  return target;
}

function fallbackKnowledgeTrend(key, current) {
  return clamp(Math.round(knowledgeTrendTarget(key, current) * 0.35), -24, 42);
}

function knowledgeTrendImpulse(delta = {}, key, scale, limit) {
  if (!delta || typeof delta[key] !== "number") return 0;
  return clamp(delta[key] * scale, -limit, limit);
}

function actionTrendShift(action, key) {
  if (action === ACTIONS.science) return key === "sc" ? 18 : -8;
  if (action === ACTIONS.belief) return key === "be" ? 20 : -7;
  if (action === ACTIONS.balance) return 12;
  if (action === ACTIONS.order) return key === "sc" ? 7 : 13;
  if (action === ACTIONS.suppressBelief) return key === "sc" ? 22 : -30;
  if (action === ACTIONS.suppressScience) return key === "be" ? 24 : -32;
  if (action === ACTIONS.hibernate) return 10;
  if (action === ACTIONS.arts) return key === "sc" ? 4 : 6;
  if (action === ACTIONS.economy) return key === "sc" ? 7 : 4;
  if (action === ACTIONS.population) return key === "sc" ? 3 : 6;
  if (action === ACTIONS.militaryCampaign) return key === "sc" ? 2 : -2;
  if (action === ACTIONS.levyHost) return key === "sc" ? -3 : 1;
  if (action === ACTIONS.secureFrontier) return key === "sc" ? 2 : 4;
  if (action === ACTIONS.crownAuthority) return key === "sc" ? 3 : 5;
  if (action === ACTIONS.buildEerf) return key === "sc" ? -12 : -10;
  if (action === ACTIONS.upgradeEerf) return key === "sc" ? -10 : -8;
  if (action === ACTIONS.recovery) return key === "sc" ? -14 : -9;
  return 0;
}

function knowledgeTrendNoise(rand, key) {
  const offset = key === "sc" ? 37 : 83;
  return (((Math.floor((rand + offset) / 13) % 5) - 2) * 2);
}

function knowledgeTrendChangeEvents(beforeTrends, nextTrends) {
  return [
    knowledgeTrendChangeEvent("sc", beforeTrends.sc, nextTrends.sc),
    knowledgeTrendChangeEvent("be", beforeTrends.be, nextTrends.be)
  ].filter(Boolean);
}

function knowledgeTrendChangeEvent(key, beforeTrend, nextTrend) {
  const beforeStage = knowledgeTrendStageFor(beforeTrend);
  const nextStage = knowledgeTrendStageFor(nextTrend);
  if (beforeStage.id === nextStage.id) return null;

  const direction = nextStage.index > beforeStage.index ? "upgrade" : "downgrade";
  const directionLabel = direction === "upgrade" ? "升级至" : "降级至";
  const label = key === "sc" ? "科学" : "神学";
  return {
    type: "special",
    title: `${label}${directionLabel}${nextStage.label}`,
    text: knowledgeTrendEventText(key, direction, nextStage),
    delta: {}
  };
}

function broadcastTrendEvents(trendEvents) {
  if (!Array.isArray(trendEvents) || !trendEvents.length) return;

  const title = trendEvents
    .map((event) => event.title.replace(/^第 \d+ 年｜/, ""))
    .join("；");
  const text = trendEvents
    .map((event) => `${event.title.replace(/^第 \d+ 年｜/, "")}：${event.text}`)
    .join(" ");

  if (!state.specialNotice) {
    state.specialNotice = {
      title: `第 ${state.turn} 年｜趋势播报｜${title}`,
      text,
      delta: {}
    };
    return;
  }

  state.specialNotice = {
    ...state.specialNotice,
    text: [state.specialNotice.text, `趋势播报：${text}`].filter(Boolean).join(" "),
    delta: state.specialNotice.delta || {}
  };
}

function knowledgeTrendStageFor(value) {
  const score = finiteOr(value, 0);
  let selected = KNOWLEDGE_TREND_STAGES[0];
  KNOWLEDGE_TREND_STAGES.forEach((stage, index) => {
    if (score >= stage.min) selected = { ...stage, index };
  });
  return selected;
}

function knowledgeTrendEventText(key, direction, stage) {
  const copy = {
    sc: {
      upgrade: {
        budding: "\n物理学的大厦已经基本落成，只剩下两朵乌云遮蔽着。——开尔文勋爵，1899年\n",
        formed: "\n万物皆数。——毕达哥拉斯，公元前530年\n",
        expanding: "\n我发现了！——阿基米德，公元前212年\n",
        surging: "\n现在，我将演示世界运行的规律。——艾萨克·牛顿，1687年\n"
      },
      downgrade: {
        expanding: "\n因为我是个白痴。——罗伯特·奥本海默，1954年\n",
        formed: "\n我没有时间了。——埃瓦里斯特·伽罗瓦，1832年\n",
        budding: "\n或许，你们比我更加恐惧！——焦尔达诺·布鲁诺，1600年\n",
        stalled: "\n你们可以一眨眼就把他的头砍下来，但那样的头脑一百年再也长不出一个来了！——约瑟夫-路易·拉格朗日，1794年\n",
        decline: "\n不要弄坏我的圆！——阿基米德，公元前212年\n",
        collapse: "盛宴已毕。——杨振宁，1980年\n"
      }
    },
    be: {
      upgrade: {
        budding: "\n起初，神创造天地。——《创世记》1:1",
        formed: "\n凡事都要规规矩矩地按着次序行。——《哥林多前书》14:40",
        expanding: "\n这福音要传遍天下。——《马太福音》24:14",
        surging: "\n万膝必向我跪拜，万口必向我承认。——《罗马书》14:11"
      },
      downgrade: {
        expanding: "日光之下，并无新事。——《传道书》1:9",
        formed: "\n没有异象，民就放肆。——《箴言》29:18",
        budding: "\n他们的心远离我。——《以赛亚书》29:13",
        stalled: "\n你们心持两意要到几时呢？——《列王纪上》18:21",
        decline: "\n我的神，我的神！为什么离弃我？——《马太福音》27:46",
        collapse: "\n虚空的虚空，凡事都是虚空。——《传道书》1:2"
      }
    }
  };

  return copy[key]?.[direction]?.[stage.id] || `${key === "sc" ? "科学" : "神学"}趋势变为${stage.label}。`;
}

function computeSystemPressure(current) {
  const scRatio = current.sc / CAP;
  const beRatio = current.be / CAP;
  const scienceEraLevel = eraIndexFor(current.sc, SCIENCE_ERAS);
  const beliefEraLevel = eraIndexFor(current.be, BELIEF_ERAS);
  const harmony = knowledgeHarmony(current.sc, current.be);
  const rivalry = 1 - harmony;
  const sciencePressure = Math.max(0, scienceEraLevel - 2) * (1 - harmony * 0.88);
  const beliefPressure = Math.max(0, beliefEraLevel - 2) * (1 - harmony * 0.88);
  const harmonyLift = harmony > 0.72 ? Math.round((harmony - 0.72) * 46) : 0;
  const orderRatio = clamp(current.stability, 0, 100) / 100;
  const orderScienceLift = Math.max(0, Math.round((orderRatio - 0.44) * 30));
  const beliefSuppression = Math.round(beliefPressure * (2.4 + beRatio * 9) * (1 - orderRatio * 0.28));
  const scPressure = clamp(
    harmonyLift + orderScienceLift - beliefSuppression,
    -95,
    34
  );
  const scienceSuppression = Math.round(sciencePressure * (3 + scRatio * 14) + scRatio * orderRatio * 12);
  const bePressure = clamp(
    harmonyLift - scienceSuppression,
    -95,
    18
  );

  const carryingCapacity = civilizationCarryingCapacity(current);
  const populationRatio = carryingCapacity > 0 ? current.pop / carryingCapacity : 1;
  const economyFactor = current.eco <= 0
    ? 0.72
    : 0.82 + clamp(Math.log10(current.eco + 10) / 6, 0, 1) * 0.24;
  const knowledgePopulationLift = 1 + scRatio * 0.18 + beRatio * 0.16 + harmony * 0.08;
  const orderPopulationLift = 0.9 + clamp(current.stability, 0, 100) / 500;
  const logisticRate = 0.012 * economyFactor * knowledgePopulationLift * orderPopulationLift;
  const logisticPopulation = current.pop * logisticRate * (1 - populationRatio);
  const povertyPenalty = current.eco < current.pop * 0.22
    ? current.pop * (0.0028 + rivalry * 0.0024)
    : 0;
  const popPressure = clamp(
    Math.round(logisticPopulation - povertyPenalty),
    -45000,
    9000
  );

  const ecoPressure = computeSolowEconomyPressure(current, carryingCapacity, harmony, rivalry);
  const orderPressure = computeOrderPressure(current, carryingCapacity, harmony, rivalry);

  return {
    sc: scPressure,
    be: bePressure,
    pop: popPressure,
    eco: ecoPressure,
    stability: orderPressure
  };
}

function resolveMilitaryYear(action, rand) {
  ensureMilitaryMapState();
  resolvePoliticalDevelopmentYear(rand);
  recoverMilitaryForce();
  decayMilitaryModifiers();

  if (state.mapUiExpanded === false) {
    return resolveAbstractStrategicYear(rand);
  }

  const playerCounts = mapOwnerCounts();
  if (playerCounts.player <= 0) {
    return updateMapEvent("国家灭亡", "中央政府已经失去全部区域，王旗落地。", "defeat");
  }

  if (action === ACTIONS.militaryCampaign) {
    state.military.campaigns += 1;
    return attemptPlayerOffensive(rand, 28);
  }

  const attackInterval = Math.max(
    3,
    Math.round(difficultyConfig().enemyAttackInterval * aiAggressionConfig().intervalScale)
  );
  const civilizationAge = Math.max(0, state.turn - finiteOr(state.currentCivilization?.startTurn, 0));
  if (civilizationAge >= 12 && (Math.floor(rand / 10) + state.turn) % attackInterval === 0 && hasDefensiveFrontier()) {
    return attemptRivalOffensive(rand);
  }

  const quiet = updateMapEvent("边境静默", MAP_EVENT_NONE, "none");
  return quiet;
}

function resolveAbstractStrategicYear(rand) {
  const interval = Math.max(6, Math.round(12 * aiAggressionConfig().intervalScale));
  if ((state.turn + Math.floor(rand / 17)) % interval !== 0) {
    return updateMapEvent("后台形势", "战略拓展已折叠，各国维持军备与边境巡逻。", "none");
  }

  const frontiers = activeMapRoads().flatMap((road) => {
    const left = mapStateRegion(road.a);
    const right = mapStateRegion(road.b);
    if (!left || !right || left.controllerId === right.controllerId) return [];
    return [{ source: left, target: right }, { source: right, target: left }];
  }).filter(({ source, target }) => {
    const attacker = politicalEntityById(source.controllerId);
    const defender = politicalEntityById(target.controllerId);
    return attacker && defender && !attacker.eliminated && !defender.eliminated && entityRegions(defender.id).length > 4;
  });
  if (!frontiers.length) return updateMapEvent("后台形势", "边界暂时稳定，没有政治实体能够改变疆域。", "none");

  const plan = frontiers[(rand + state.turn * 29) % frontiers.length];
  const attacker = politicalEntityById(plan.source.controllerId);
  const defender = politicalEntityById(plan.target.controllerId);
  const attackStrength = abstractEntityStrength(attacker, true) + ((rand % 17) - 8);
  const defenseStrength = abstractEntityStrength(defender, false) + plan.target.fortification * 0.18;
  if (attackStrength <= defenseStrength) {
    return updateMapEvent("后台形势", `${attacker.name}在${mapRegionById(plan.target.id)?.name}边境试探后撤回。`, "none");
  }

  setRegionController(plan.target, attacker.id);
  plan.target.fortification = clamp(Math.round(plan.target.fortification * 0.9), 5, 140);
  const advancingArmy = entityArmies(attacker.id).find((army) => army.regionId === plan.source.id) || entityArmies(attacker.id)[0];
  if (advancingArmy) advancingArmy.regionId = plan.target.id;
  return updateMapEvent(
    "后台疆域变动",
    `${attacker.name}接管${mapRegionById(plan.target.id)?.name}，${defender.name}仍保有核心疆域。`,
    "abstract"
  );
}

function abstractEntityStrength(entity, attacking) {
  if (!entity) return 0;
  const strategy = politicalStrategyConfig(entity.strategy);
  const force = entityMilitaryForce(entity.id) / 520;
  const development = finiteOr(entity.development, 0) * 0.16;
  const technology = entity.id === PLAYER_ENTITY_ID
    ? state.sc / CAP * 34
    : finiteOr(entity.technology, 0) * 0.34;
  return force + development + technology + (attacking ? strategy.attack : strategy.defense);
}

function ensureMilitaryMapState() {
  if (!state.map?.regions?.length) {
    state.map = createInitialMapState(state.map, {
      seed: state.seed,
      realmName: state.realmName,
      difficulty: state.difficulty
    });
  }
  if (!state.military || !Array.isArray(state.military.armies)) {
    state.military = normalizeMilitaryState(state.military, state);
  }
  if (!armyById(state.selectedArmyId)) state.selectedArmyId = PLAYER_ARMY_ID;
}

function resolvePoliticalDevelopmentYear(rand) {
  const current = snapshot();
  politicalEntities().forEach((entity, index) => {
    const territoryCount = entityRegions(entity.id).length;
    if (entity.eliminated || territoryCount <= 0) return;

    if (entity.id === PLAYER_ENTITY_ID) {
      const developmentTarget = clamp(Math.round(
        10 +
          Math.log10(Math.max(10, current.eco + 10)) * 3.6 +
          Math.sqrt(Math.max(0, current.pop)) / 20 +
          territoryCount * 2.2
      ), 0, 180);
      entity.development = clamp(Math.round(entity.development * 0.72 + developmentTarget * 0.28), 0, 180);
      entity.technology = clamp(Math.round(current.sc / CAP * 100), 0, 100);
      return;
    }

    if ((state.turn + index * 3 + rand) % 11 === 0) {
      entity.strategy = chooseAiPoliticalStrategy(entity, rand, index);
    }
    const strategy = politicalStrategyConfig(entity.strategy);
    const variation = ((rand + index * 37 + state.turn * 11) % 5) * 0.08;
    const developmentGain = strategy.development * (0.72 + territoryCount * 0.18 + variation);
    const technologyGain = strategy.technology * (
      0.28 + territoryCount * 0.07 + Math.min(1.4, entity.development / 85)
    );
    entity.development = clamp(Math.round((entity.development + developmentGain) * 10) / 10, 0, 180);
    entity.technology = clamp(Math.round((entity.technology + technologyGain) * 10) / 10, 0, 100);

    if (entity.strategy === "fortress" && (rand + index + state.turn) % 3 === 0) {
      entityRegions(entity.id).forEach((region) => {
        region.fortification = clamp(Math.round(region.fortification + 2), 5, 140);
      });
    }
  });
}

function chooseAiPoliticalStrategy(entity, rand, index) {
  const territoryCount = entityRegions(entity.id).length;
  if (territoryCount <= 1) return "fortress";
  if (entity.owner === MAP_OWNER_NEUTRAL && entity.relation !== "hostile") {
    const peaceful = ["trade", "science", "faith", "balanced"];
    return peaceful[(rand + index + state.count) % peaceful.length];
  }
  if (["aggressive", "total"].includes(state.aiAggression) || territoryCount >= 5) return "expansion";
  if (entity.technology < 32) return "science";
  const wartime = ["balanced", "fortress", "expansion", "science"];
  return wartime[(rand + index * 5 + state.turn) % wartime.length];
}

function recoverMilitaryForce() {
  const current = snapshot();
  const counts = mapOwnerCounts();
  const baseRecruitment = Math.round(current.pop * 0.0018 + Math.sqrt(Math.max(0, current.eco)) * 0.9 + counts.player * 120);
  const orderFactor = 0.7 + current.stability / 180;
  const playerStrategy = politicalStrategyConfig(politicalEntityById(PLAYER_ENTITY_ID)?.strategy);
  const strategyRecruitment = playerStrategy === POLITICAL_STRATEGIES.expansion
    ? 1.18
    : playerStrategy === POLITICAL_STRATEGIES.fortress
      ? 1.08
      : 1;
  const attrition = Math.round(finiteOr(state.military.force, 0) * (0.018 + state.military.warWeariness / 2200));
  if (primaryPlayerArmy()) {
    setPlayerMilitaryForce(
      Math.round(finiteOr(state.military.force, 0) + baseRecruitment * orderFactor * strategyRecruitment - attrition),
    );
  } else {
    state.military.force = 0;
  }
  state.military.warWeariness = clamp(Math.round(finiteOr(state.military.warWeariness, 0) * 0.88), 0, 100);

  armies().forEach((army) => {
    if (army.entityId === PLAYER_ENTITY_ID || army.force <= 0) return;
    const owner = armyOwner(army);
    const entity = politicalEntityById(army.entityId);
    if (!entity || entity.eliminated) return;
    const strategy = politicalStrategyConfig(entity.strategy);
    const recoveryScale = owner === MAP_OWNER_RIVAL
      ? difficultyConfig().rivalPower
      : difficultyConfig().neutralPower;
    const strategyScale = entity.strategy === "expansion" ? 1.32 : entity.strategy === "fortress" ? 1.12 : 1;
    const recruitment = (
      70 +
        entityRegions(entity.id).length * 42 +
        entity.development * 1.65 +
        entity.technology * 1.15
    ) * recoveryScale * strategyScale;
    const upkeep = army.force * (entity.strategy === "trade" ? 0.004 : 0.006);
    army.force = clamp(Math.round(army.force + recruitment - upkeep), 0, MILITARY_FORCE_CAP);
  });

  politicalEntities().forEach((entity, index) => {
    if (entity.id === PLAYER_ENTITY_ID || entity.eliminated || entityArmies(entity.id).length > 0) return;
    const territories = entityRegions(entity.id);
    if (!territories.length || (state.turn + index * 3) % 4 !== 0) return;
    const identity = defaultArmyIdentity(entity.id);
    const scale = entity.owner === MAP_OWNER_RIVAL ? difficultyConfig().rivalPower : difficultyConfig().neutralPower;
    state.military.armies.push({
      ...identity,
      entityId: entity.id,
      regionId: territories[(state.turn + index) % territories.length].id,
      force: clamp(Math.round((2200 + territories.length * 460 + entity.development * 24) * scale), 2200, 18000),
      attackBonus: entity.owner === MAP_OWNER_RIVAL ? 4 : 2,
      defenseBonus: entity.owner === MAP_OWNER_RIVAL ? 3 : 5,
      posture: "defense",
      lastMovedTurn: state.turn - 1
    });
  });
}

function defaultArmyIdentity(entityId) {
  return {
    [NEUTRAL_ENTITY_ID]: { id: "neutral-iron-host", name: "铁山卫队" },
    [NEUTRAL_COAST_ENTITY_ID]: { id: "neutral-east-host", name: "东部城防军" },
    [RIVAL_ENTITY_ID]: { id: "rival-north-host", name: "北境军团" },
    [RIVAL_ASH_ENTITY_ID]: { id: "rival-river-host", name: "灰河军团" }
  }[entityId] || { id: `${entityId}-host`, name: "重建军团" };
}

function decayMilitaryModifiers() {
  state.military.attackModifier = Math.round(finiteOr(state.military.attackModifier, 0) * 0.9);
  state.military.defenseModifier = Math.round(finiteOr(state.military.defenseModifier, 0) * 0.92);
}

function militaryStats(current = snapshot(), region = null, armyOverride = null) {
  ensureMilitaryMapState();
  const army = armyOverride || primaryPlayerArmy();
  const governor = governorBalanceEffects();
  const entity = politicalEntityById(PLAYER_ENTITY_ID);
  const strategy = politicalStrategyConfig(entity?.strategy);
  const counts = mapOwnerCounts();
  const force = armyOverride ? finiteOr(armyOverride.force, 0) : finiteOr(state.military.force, 0);
  const economyIndex = current.eco <= 0 ? 0 : clamp(Math.log10(current.eco + 10) / 6, 0, 1);
  const beliefIndex = clamp(current.be / CAP, 0, 1);
  const orderIndex = clamp(current.stability, 0, 100) / 100;
  const territorySupport = counts.player * 1.35;
  const technologyBonus = militaryTechnologyBonus(army);
  const attack = Math.round(
    force / 430 +
      technologyBonus +
      economyIndex * 10 +
      orderIndex * 7 +
      territorySupport +
      strategy.attack +
      finiteOr(governor.attack, 0) +
      finiteOr(state.military.attackModifier, 0) +
      finiteOr(army?.attackBonus, 0) -
      finiteOr(state.military.warWeariness, 0) * 0.1
  );
  const defense = Math.round(
    force / 470 +
      beliefIndex * 8 +
      technologyBonus * 0.46 +
      orderIndex * 16 +
      economyIndex * 7 +
      counts.player * 1.8 +
      (state.eerfLevel || 0) * 1.5 +
      strategy.defense +
      finiteOr(governor.defense, 0) +
      finiteOr(state.military.defenseModifier, 0) +
      finiteOr(army?.defenseBonus, 0) -
      finiteOr(state.military.warWeariness, 0) * 0.08
  );
  return {
    force: Math.round(force),
    attack: Math.max(0, attack),
    defense: Math.max(0, defense)
  };
}

function militaryTechnologyBonus(army) {
  if (!army) return 0;
  if (army.entityId === PLAYER_ENTITY_ID) {
    return Math.round(Math.pow(clamp(state.sc / CAP, 0, 1), 0.82) * 34);
  }
  const technology = finiteOr(politicalEntityById(army.entityId)?.technology, 0);
  return Math.round(clamp(technology, 0, 100) * 0.34);
}

function armyCombatStats(army, region = mapStateRegion(army?.regionId)) {
  if (!army) return { force: 0, attack: 0, defense: 0 };
  if (army.entityId === PLAYER_ENTITY_ID) return militaryStats(snapshot(), region, army);

  const owner = armyOwner(army);
  const entity = politicalEntityById(army.entityId);
  const strategy = politicalStrategyConfig(entity?.strategy);
  const config = difficultyConfig();
  const difficultyLift = owner === MAP_OWNER_RIVAL
    ? Math.max(0, config.rivalPower - 0.75) * 12
    : Math.max(0, config.neutralPower - 0.7) * 9;
  const yearPressure = Math.min(18, Math.floor(state.turn / 12));
  const fortification = finiteOr(region?.fortification, 0);
  const technologyBonus = militaryTechnologyBonus(army);
  return {
    force: Math.round(army.force),
    attack: Math.max(0, Math.round(
      army.force / 470 +
        finiteOr(army.attackBonus, 0) +
        difficultyLift +
        yearPressure +
        technologyBonus +
        strategy.attack +
        aiAggressionConfig().attackBonus
    )),
    defense: Math.max(0, Math.round(
      army.force / 500 +
        finiteOr(army.defenseBonus, 0) +
        difficultyLift +
        fortification * 0.24 +
        technologyBonus * 0.48 +
        strategy.defense
    ))
  };
}

function armiesAtRegion(regionId) {
  return armies().filter((army) => army.regionId === regionId && army.force > 0);
}

function defendingArmyForRegion(region) {
  if (!region) return null;
  return armiesAtRegion(region.id).find((army) => army.entityId === region.controllerId) || null;
}

function regionDefenseScore(region, rand = 0) {
  const defender = defendingArmyForRegion(region);
  const owner = mapRegionOwner(region);
  const entity = politicalEntityById(region?.controllerId);
  const strategy = politicalStrategyConfig(entity?.strategy);
  const config = difficultyConfig();
  const ownerScale = owner === MAP_OWNER_RIVAL ? config.rivalPower : config.neutralPower;
  const garrison = 14 +
    finiteOr(region?.fortification, 0) * 0.4 * ownerScale +
    strategy.defense * 0.55 +
    finiteOr(entity?.technology, 0) * 0.07;
  const armyDefense = defender ? armyCombatStats(defender, region).defense : 0;
  const jitter = (Math.floor(rand / 13) % 9) - 4;
  return Math.max(5, Math.round(garrison + armyDefense + jitter));
}

function hasAttackTarget() {
  if (selectAttackTarget()) return true;
  const playerArmy = selectedArmy()?.entityId === PLAYER_ENTITY_ID ? selectedArmy() : primaryPlayerArmy();
  if (!playerArmy) return false;
  const queue = [playerArmy.regionId];
  const visited = new Set(queue);
  while (queue.length) {
    const regionId = queue.shift();
    if (attackTargetsForArmy({ ...playerArmy, regionId }).length) return true;
    roadNeighbors(regionId).forEach((neighborId) => {
      const region = mapStateRegion(neighborId);
      if (!region || region.controllerId !== playerArmy.entityId || visited.has(neighborId)) return;
      visited.add(neighborId);
      queue.push(neighborId);
    });
  }
  return false;
}

function hasDefensiveFrontier() {
  return Boolean(selectPlayerFrontierRegion());
}

function selectAttackTarget() {
  ensureMilitaryMapState();
  const playerArmy = selectedArmy()?.entityId === PLAYER_ENTITY_ID ? selectedArmy() : primaryPlayerArmy();
  if (!playerArmy) return null;
  const candidates = attackTargetsForArmy(playerArmy)
    .map((regionId) => mapStateRegion(regionId))
    .map((region) => ({ region, score: regionDefenseScore(region, state.lastRand || 0) }))
    .sort((left, right) => left.score - right.score);
  return candidates[0]?.region || null;
}

function attackTargetsForArmy(army) {
  if (!army) return [];
  return roadNeighbors(army.regionId).filter((regionId) => {
    const region = mapStateRegion(regionId);
    return region && region.controllerId !== army.entityId;
  });
}

function selectPlayerFrontierRegion() {
  return selectEnemyOffensivePlan()?.target || null;
}

function selectEnemyOffensivePlan() {
  ensureMilitaryMapState();
  const plans = [];
  armies().forEach((army) => {
    const entity = politicalEntityById(army.entityId);
    if (!entity || entity.owner === MAP_OWNER_PLAYER || entity.relation !== "hostile" || army.force <= 0) return;
    roadNeighbors(army.regionId).forEach((regionId) => {
      const target = mapStateRegion(regionId);
      const targetOwner = mapRegionOwner(target);
      if (!target || target.controllerId === army.entityId) return;
      if (entity.owner === MAP_OWNER_NEUTRAL && targetOwner !== MAP_OWNER_PLAYER) return;
      if (targetOwner === MAP_OWNER_RIVAL && entity.owner === MAP_OWNER_RIVAL) return;
      const defense = targetOwner === MAP_OWNER_PLAYER
        ? playerRegionDefenseScore(target)
        : regionDefenseScore(target, state.lastRand || 0);
      const strategy = politicalStrategyConfig(entity.strategy);
      const playerBias = targetOwner === MAP_OWNER_PLAYER ? aiAggressionConfig().playerTargetBias : 0;
      plans.push({ army, target, score: defense - playerBias - Math.max(0, strategy.attack) * 0.28 });
    });
  });
  plans.sort((left, right) => left.score - right.score);
  return plans[0] || null;
}

function playerRegionDefenseScore(target) {
  const stationedArmy = armiesAtRegion(target.id).find((army) => army.entityId === PLAYER_ENTITY_ID);
  const fortification = finiteOr(target.fortification, 0);
  if (stationedArmy) return militaryStats(snapshot(), target).defense + fortification * 0.3;
  return Math.round(
    12 +
      state.stability * 0.16 +
      fortification * 0.24 +
      finiteOr(state.military.defenseModifier, 0) * 0.25 +
      finiteOr(governorBalanceEffects().defense, 0) +
      (state.be / CAP) * 5
  );
}

function attemptPlayerOffensive(rand, campaignBonus = 0) {
  const army = selectedArmy()?.entityId === PLAYER_ENTITY_ID ? selectedArmy() : primaryPlayerArmy();
  if (!army) return updateMapEvent("无法远征", "当前没有可供部署的本国军队。", "failed-attack");
  if (army.lastMovedTurn >= state.turn) return updateMapEvent("无法远征", "这支军队本年已经部署。", "none");
  army.lastMovedTurn = state.turn;
  let report = null;
  let captured = 0;
  for (let step = 0; step < 3 && army.force > 0; step += 1) {
    let candidates = attackTargetsForArmy(army)
      .map((regionId) => mapStateRegion(regionId))
      .filter(Boolean);
    if (!candidates.length && marchArmyToNearestFrontier(army)) {
      candidates = attackTargetsForArmy(army)
        .map((regionId) => mapStateRegion(regionId))
        .filter(Boolean);
    }
    if (!candidates.length) break;
    const target = candidates[(rand + step * 97 + state.turn * 13) % candidates.length];
    report = resolvePlayerDeploymentBattle(army, target, rand + step * 211, campaignBonus);
    if (!report.attackerWon) break;
    captured += 1;
  }
  if (!report) return updateMapEvent("边境静默", "没有可进攻的接壤区域。", "none");
  if (captured > 1) {
    report.text += ` 远征军本次连续控制 ${formatNumber(captured)} 块领土。`;
    state.map.lastEvent = { ...report };
    state.military.lastBattle = { ...report };
  }
  return report;
}

function marchArmyToNearestFrontier(army) {
  if (!army) return false;
  const queue = [army.regionId];
  const visited = new Set(queue);
  while (queue.length) {
    const regionId = queue.shift();
    const hostileNeighbors = roadNeighbors(regionId).filter((neighborId) => {
      const neighbor = mapStateRegion(neighborId);
      return neighbor && neighbor.controllerId !== army.entityId;
    });
    if (hostileNeighbors.length) {
      army.regionId = regionId;
      return true;
    }
    roadNeighbors(regionId).forEach((neighborId) => {
      const neighbor = mapStateRegion(neighborId);
      if (!neighbor || neighbor.controllerId !== army.entityId || visited.has(neighborId)) return;
      visited.add(neighborId);
      queue.push(neighborId);
    });
  }
  return false;
}

function attemptRivalOffensive(rand) {
  const plan = selectEnemyOffensivePlan();
  if (!plan) return updateMapEvent("边境静默", "敌国没有找到可突破的道路。", "none");

  const { army, target } = plan;
  return resolveRegionBattle(army, target, rand, aiAggressionConfig().attackBonus);
}

function nextStrategicRand(maximum = 10000) {
  const rng = new Lcg(state.rngState);
  const value = rng.nextInt(maximum);
  state.rngState = rng.state;
  return value;
}

function handleMapInteraction(event) {
  const armyButton = event.target.closest("[data-army]");
  if (armyButton) {
    state.selectedArmyId = armyButton.dataset.army;
    state.selectedRegionId = armyById(state.selectedArmyId)?.regionId || state.selectedRegionId;
    saveState();
    renderMap();
    renderActionButtons();
    return;
  }

  const regionButton = event.target.closest("[data-region]");
  if (!regionButton) return;
  selectMapRegion(regionButton.dataset.region);
}

function handleMapKeyboardInteraction(event) {
  if (!["Enter", " "].includes(event.key)) return;
  const regionButton = event.target.closest?.("[data-region]");
  if (!regionButton) return;
  event.preventDefault();
  selectMapRegion(regionButton.dataset.region);
}

function selectMapRegion(regionId) {
  if (!mapStateRegion(regionId)) return false;
  state.selectedRegionId = regionId;
  saveState();
  renderMap();
  renderActionButtons();
  return true;
}

function deployArmyToSelectedRegion() {
  return deploySelectedArmy(state.selectedRegionId);
}

function handleEntityCardClick(event) {
  const entityButton = event.target.closest("[data-entity]");
  if (!entityButton || !politicalEntityById(entityButton.dataset.entity)) return;
  state.selectedEntityId = entityButton.dataset.entity;
  saveState();
  renderPoliticalEntityPanel();
}

function changeSelectedEntityStrategy(event) {
  const entity = selectedPoliticalEntity();
  if (!entity || entity.id !== PLAYER_ENTITY_ID || entity.eliminated) return;
  entity.strategy = normalizePoliticalStrategy(event.target.value);
  state.map.lastEvent = {
    title: "国家战略调整",
    text: `${entity.name}开始执行“${politicalStrategyConfig(entity.strategy).label}”。`,
    type: "policy"
  };
  saveState();
  renderMap();
}

function deploySelectedArmy(targetRegionId) {
  if (!state.setupComplete || state.finished || state.awaitingCivilizationRestart || state.mapUiExpanded === false) return false;
  ensureMilitaryMapState();
  const army = selectedArmy();
  const target = mapStateRegion(targetRegionId);
  if (!army || !target) return false;

  if (army.entityId !== PLAYER_ENTITY_ID) {
    updateMapEvent("仅可观察", "中立与敌方军队目前只能查看，不能直接指挥。", "none");
    renderMap();
    return false;
  }
  if (army.force <= 0) {
    updateMapEvent("无法部署", "军团已经失去作战能力。", "failed-attack");
    renderMap();
    return false;
  }
  if (army.lastMovedTurn >= state.turn) {
    updateMapEvent("部署完成", "这支军队本年已经行动。", "none");
    renderMap();
    return false;
  }

  if (target.id === army.regionId) {
    army.posture = "defense";
    army.lastMovedTurn = state.turn;
    target.fortification = clamp(Math.round(target.fortification + 3), 5, 140);
    updateMapEvent("转入防御", `${army.name}在${mapRegionById(target.id)?.name}进入防御姿态。`, "defense");
    saveState();
    renderMap();
    return true;
  }

  if (!regionsShareRoad(army.regionId, target.id)) {
    updateMapEvent("道路不通", "军队只能沿道路向相邻地区部署。", "none");
    renderMap();
    return false;
  }

  army.lastMovedTurn = state.turn;
  if (mapRegionOwner(target) === MAP_OWNER_PLAYER) {
    army.regionId = target.id;
    army.posture = "defense";
    updateMapEvent("防御部署", `${army.name}沿道路进驻${mapRegionById(target.id)?.name}。`, "defense");
  } else {
    if (mapRegionOwner(target) === MAP_OWNER_NEUTRAL) makeEntityHostile(target.controllerId);
    resolvePlayerDeploymentBattle(army, target, nextStrategicRand(), 0);
  }

  maybeFinishGame({ kind: "military-deployment", trigger: state.map.lastEvent?.title, rand: state.lastRand });
  updateEnding();
  saveState();
  render();
  return true;
}

function makeEntityHostile(entityId) {
  const entity = politicalEntityById(entityId);
  if (entity && entity.owner !== MAP_OWNER_PLAYER) entity.relation = "hostile";
}

function resolvePlayerDeploymentBattle(army, target, rand, campaignBonus = 0) {
  const previousOwner = mapRegionOwner(target);
  const previousController = target.controllerId;
  if (previousOwner === MAP_OWNER_NEUTRAL) makeEntityHostile(previousController);
  return resolveRegionBattle(army, target, rand, campaignBonus);
}

function resolveRegionBattle(attacker, target, rand, attackBonus = 0) {
  const definition = mapRegionById(target.id);
  const defender = defendingArmyForRegion(target);
  const attackerEntity = politicalEntityById(attacker.entityId);
  const defenderEntity = politicalEntityById(target.controllerId);
  const sourceRegionId = attacker.regionId;
  const attackerStats = armyCombatStats(attacker, target);
  const defenderStats = defender
    ? armyCombatStats(defender, target)
    : { force: 0, attack: 0, defense: regionDefenseScore(target, rand) };
  const attackTerrain = terrainCombatProfile(target, attacker);
  const defenseTerrain = terrainCombatProfile(target, defender);
  const garrisonForce = Math.round(350 + finiteOr(target.fortification, definition?.strength || 40) * 28);
  const defenderEngagedForce = finiteOr(defender?.force, 0) + garrisonForce;
  const technologyGap = scienceEraIndexForEntity(attacker.entityId) - scienceEraIndexForEntity(target.controllerId);
  const combatDifference =
    attackerStats.attack +
    attackBonus +
    attackTerrain.attack -
    defenderStats.defense -
    defenseTerrain.defense;
  const result = BALANCE_MODEL.resolveBattleCasualties({
    attackerForce: attacker.force,
    defenderForce: defenderEngagedForce,
    combatDifference,
    technologyGap,
    seed: rand
  });

  attacker.force = clamp(result.attackerSurvivors, 0, MILITARY_FORCE_CAP);
  if (defender) {
    const armyShare = defenderEngagedForce > 0 ? defender.force / defenderEngagedForce : 0;
    const armyCasualties = Math.round(result.defenderCasualties * armyShare);
    defender.force = clamp(defender.force - armyCasualties, 0, MILITARY_FORCE_CAP);
  }
  attacker.posture = "attack";
  const previousController = target.controllerId;
  const previousOwner = mapRegionOwner(target);
  let retreatRegion = null;
  if (result.attackerWon) {
    setRegionController(target, attacker.entityId);
    attacker.regionId = target.id;
    retreatRegion = retreatArmyToAdjacent(defender, target.id, previousController);
  } else {
    retreatRegion = retreatArmyToAdjacent(attacker, target.id, attacker.entityId, sourceRegionId);
  }
  const heaviestLoss = Math.max(result.attackerCasualtyRate, result.defenderCasualtyRate);
  target.fortification = clamp(Math.round(target.fortification * (0.94 - heaviestLoss * 0.24)), 5, 140);

  if (attacker.entityId === PLAYER_ENTITY_ID || previousController === PLAYER_ENTITY_ID) {
    state.military.warWeariness = clamp(
      state.military.warWeariness + Math.round(3 + heaviestLoss * 9),
      0,
      100
    );
    if (!result.attackerWon && attacker.entityId === PLAYER_ENTITY_ID) state.stability = clamp(state.stability - 4, 0, 100);
    if (result.attackerWon && previousController === PLAYER_ENTITY_ID) state.stability = clamp(state.stability - (definition?.core ? 12 : 5), 0, 100);
  }

  removeDestroyedArmies();
  const eliminated = eliminateDefeatedEntities();
  const winner = result.attackerWon ? attackerEntity : defenderEntity;
  const battleLabel = result.scale === "bloodbath" ? "血战" : result.scale === "conflict" ? "冲突" : "战役";
  const title = `${definition?.name || target.id}${battleLabel}`;
  const retreatText = retreatRegion
    ? `败军撤往${mapRegionById(retreatRegion.id)?.name || retreatRegion.id}。`
    : "败军无路可退，残部就地溃散。";
  const text = `${attackerEntity?.name || "进攻方"}和${defenderEntity?.name || "守军"}的军队在${definition?.name || target.id}相遇。最终${winner?.name || "守军"}取得了胜利，${retreatText}` +
    ` 进攻方阵亡 ${formatNumber(result.attackerCasualties)}（${formatPercent(result.attackerCasualtyRate)}），守军阵亡 ${formatNumber(result.defenderCasualties)}（${formatPercent(result.defenderCasualtyRate)}）。${entityEliminationText(eliminated)}`;
  const eventType = result.attackerWon
    ? attacker.entityId === PLAYER_ENTITY_ID
      ? previousOwner === MAP_OWNER_NEUTRAL ? "expansion" : "conquest"
      : previousController === PLAYER_ENTITY_ID ? "lost" : "conquest"
    : attacker.entityId === PLAYER_ENTITY_ID ? "failed-attack" : "defense";
  const report = updateMapEvent(title, text, eventType, target.id);
  report.attackerWon = result.attackerWon;
  report.attackerSurvivors = result.attackerSurvivors;
  report.defenderSurvivors = result.defenderSurvivors;
  announceMilitaryEvent(report);
  return report;
}

function scienceEraIndexForEntity(entityId) {
  if (entityId === PLAYER_ENTITY_ID) return eraIndexFor(state.sc, SCIENCE_ERAS);
  const technology = clamp(finiteOr(politicalEntityById(entityId)?.technology, 0), 0, 100);
  return eraIndexFor(technology / 100 * CAP, SCIENCE_ERAS);
}

function retreatArmyToAdjacent(army, contestedRegionId, controllerId, preferredRegionId = null) {
  if (!army || army.force <= 0) return null;
  const candidates = roadNeighbors(contestedRegionId)
    .map((regionId) => mapStateRegion(regionId))
    .filter((region) => region?.controllerId === controllerId);
  const destination = candidates.find((region) => region.id === preferredRegionId) || candidates[0] || null;
  if (!destination) {
    army.force = 0;
    return null;
  }
  army.regionId = destination.id;
  army.posture = "defense";
  return destination;
}

function removeDestroyedArmies() {
  state.military.armies = armies().filter((army) => army.force > 0);
  syncPlayerMilitaryForce();
  if (!armyById(state.selectedArmyId)) {
    state.selectedArmyId = primaryPlayerArmy()?.id || armies()[0]?.id || null;
  }
}

function announceMilitaryEvent(event) {
  if (!event || state.specialNotice || (event.regionId && !canObserveMilitaryAt(event.regionId))) return;
  state.specialNotice = {
    title: event.title,
    text: event.text,
    delta: {}
  };
}

function entityEliminationText(eliminated) {
  if (!eliminated?.length) return "";
  return ` ${eliminated.map((entity) => `${entity.name}灭亡，其军事单位全部解散`).join("；")}。`;
}

function updateMapEvent(title, text, type, regionId = null) {
  const event = { title, text, type, regionId };
  if (!state.map) state.map = createInitialMapState({}, {
    seed: state.seed,
    realmName: state.realmName,
    difficulty: state.difficulty
  });
  if (!state.military) state.military = createInitialMilitaryState(snapshot(), { difficulty: state.difficulty });
  state.map.lastEvent = event;
  state.military.lastBattle = event;
  return event;
}

function collapseMapState(cause) {
  const seed = normalizeSeed(state?.seed || state?.map?.seed || 1);
  const blueprint = normalizeMapBlueprint(state?.map, seed);
  const entities = createPoliticalEntities(state?.map?.entities, state?.realmName || DEFAULT_REALM_NAME, seed);
  Object.values(entities).forEach((entity) => {
    entity.eliminated = true;
    entity.eliminatedYear = state.turn;
  });
  return {
    seed,
    difficulty: normalizeDifficulty(state?.difficulty),
    entities,
    layout: blueprint.layout,
    roads: blueprint.roads,
    lastEvent: {
      title: "文明毁灭",
      text: `${cause} 之后，旧地图失效。`,
      type: "collapse"
    },
    regions: MAP_REGIONS.map((region) => ({
      id: region.id,
      owner: MAP_OWNER_RUINS,
      controllerId: null,
      fortification: region.strength
    }))
  };
}

function computeOrderPressure(current, carryingCapacity, harmony, rivalry) {
  const scRatio = current.sc / CAP;
  const beRatio = current.be / CAP;
  const laRatio = finiteOr(current.la, 0) / LA_CAP;
  const overloadPenalty = Math.max(0, current.pop - carryingCapacity) / 42000;
  const povertyPenalty = current.eco < current.pop * 0.22 ? 5 : 0;
  const territory = territoryDevelopmentEffects();
  const doctrineOrderTarget = 42 + beRatio * 58 + harmony * 12 + laRatio * 7 - scRatio * 14 - rivalry * 6 - overloadPenalty - povertyPenalty - territory.orderDrag;
  return clamp(Math.round((doctrineOrderTarget - current.stability) / 10), -8, 9);
}

function computeSolowEconomyPressure(current, carryingCapacity, harmony, rivalry) {
  const scRatio = current.sc / CAP;
  const beRatio = current.be / CAP;
  const laRatio = finiteOr(current.la, 0) / LA_CAP;
  const labor = Math.max(1, current.pop);
  const capital = Math.max(1, current.eco) + 24000;
  const laborIndex = labor / 7600;
  const capitalIndex = capital / (DEFAULT_ECO + 24000);
  const scienceTfp = 1 + scRatio * 1.35 + Math.sqrt(scRatio) * 0.16;
  const orderTfp = 0.94 + clamp(current.stability, 0, 100) / 500 + harmony * 0.08;
  const doctrineFriction = clamp(
    1 - beRatio * 0.26 - Math.max(0, beRatio - scRatio) * 0.09 + harmony * 0.04,
    0.62,
    1.04
  );
  // Game-tuned Solow-Cobb-Douglas: ECO is capital, POP is labor, SC is productivity, BE is doctrine drag.
  const culturalCoordination = 1 + laRatio * 0.04;
  const totalFactorProductivity = scienceTfp * orderTfp * doctrineFriction * culturalCoordination;
  const territory = territoryDevelopmentEffects();
  const grossOutput = 15500 *
    totalFactorProductivity *
    Math.pow(capitalIndex, 0.34) *
    Math.pow(laborIndex, 0.62) *
    territory.outputMultiplier;
  const savingsRate = clamp(
    0.34 + scRatio * 0.08 - beRatio * 0.09 + clamp(current.stability, 0, 100) / 1000 + harmony * 0.04,
    0.24,
    0.52
  );
  const productiveInvestment = grossOutput * savingsRate;
  const depreciation = current.eco * 0.023;
  const laborMaintenance = current.pop * (0.033 + beRatio * 0.004);
  const knowledgeAdministration = (current.sc + current.be) * 0.12;
  const eerfUpkeep = (state.eerfLevel || 0) * 2800;
  const rivalryCost = rivalry * (1450 + (current.sc + current.be) * 0.055);
  const overloadCost = current.pop > carryingCapacity
    ? (current.pop - carryingCapacity) * 0.048
    : 0;
  const lowCapitalRebuild = current.eco > 0 && current.eco < 60000
    ? (60000 - current.eco) * 0.055
    : 0;
  const treasuryDrag = current.eco > 280000
    ? Math.pow((current.eco - 280000) / 100000, 1.22) * 12000
    : 0;

  return clamp(
    Math.round(
      productiveInvestment +
        lowCapitalRebuild -
        depreciation -
        laborMaintenance -
        knowledgeAdministration -
        eerfUpkeep -
        rivalryCost -
        overloadCost -
        territory.administrationCost -
        treasuryDrag
    ),
    -90000,
    110000
  );
}

function describeSystemPressure(delta) {
  const populationStress = delta.pop < -1000 ? "人口承载压力正在回收扩张。" : "";
  const economyStress = delta.eco < -3000 ? "经济维护成本吞噬了部分产出。" : "";
  const orderBonus = delta.sc > 0 ? "秩序让学院、工坊与档案系统更快运转。" : "";
  const doctrineOrder = delta.stability > 0 ? "神学共同体正在把松散人群重新编入秩序。" : "";
  const knowledgeStress = delta.sc < 0 || delta.be < 0 ? "知识结构的互斥开始显现。" : "";
  return [populationStress, economyStress, orderBonus, doctrineOrder, knowledgeStress].filter(Boolean).join(" ");
}

function describeChronicleState(before, after, event, action) {
  const notes = [];
  const beforeScienceEra = scienceEra(before.sc);
  const afterScienceEra = scienceEra(after.sc);
  const beforeBeliefEra = beliefEra(before.be);
  const afterBeliefEra = beliefEra(after.be);
  const harmony = knowledgeHarmony(after.sc, after.be);

  if (beforeScienceEra !== afterScienceEra) {
    notes.push(`科学史进入${afterScienceEra}。`);
  }
  if (beforeBeliefEra !== afterBeliefEra) {
    notes.push(`神学史进入${afterBeliefEra}。`);
  }

  if (after.eco <= after.pop * 0.18 && after.pop > 0) {
    notes.push("粮仓和账本之间的距离正在变得危险。");
  } else if (after.eco >= 180000) {
    notes.push("财政盈余让统治者第一次相信明年可以被规划。");
  }

  if (after.stability <= 24) {
    notes.push("地方城邦开始以自己的钟声代替中央命令。");
  } else if (after.stability >= 82) {
    notes.push("秩序严密到连谣言都要排队通过街口。");
  }

  if (harmony >= 0.86 && after.sc + after.be >= 6000) {
    notes.push("学院与神殿仍在争吵，但他们已经在使用同一份日历。");
  } else if (after.sc > after.be * 1.65 && after.sc >= 5000) {
    notes.push("望远镜的影子盖过祭坛，城市开始用证据审判传统。");
  } else if (after.be > after.sc * 1.65 && after.be >= 5000) {
    notes.push("钟声盖过仪器噪音，疑问被重新命名为诱惑。");
  }

  if ((state.eerfLevel || 0) >= 4) {
    notes.push("地下火种工程已经成为另一种国家。");
  }

  if (event?.title && action?.label && notes.length < 2 && (state.turn + event.title.length + action.label.length) % 5 === 0) {
    notes.push("这一年没有答案，只有更精确的问题。");
  }

  return notes.slice(0, 2).join(" ");
}

function civilizationCarryingCapacity(current) {
  const scRatio = current.sc / CAP;
  const beRatio = current.be / CAP;
  const economySupport = Math.sqrt(Math.max(0, current.eco)) * 145;
  const eerfShelter = (state.eerfLevel || 0) * 6500;
  const territory = territoryDevelopmentEffects();
  return Math.round(
    9000 +
      current.sc * 4.6 +
      current.be * 2.35 +
      economySupport +
      eerfShelter +
      (scRatio + beRatio) * 18000 +
      territory.carryingCapacity
  );
}

function territoryDevelopmentEffects(mapState = state?.map) {
  const territoryCount = entityRegions(PLAYER_ENTITY_ID, mapState).length || 5;
  return BALANCE_MODEL?.territoryDevelopmentEffects(territoryCount) || {
    carryingCapacity: 0,
    outputMultiplier: 1,
    administrationCost: 0,
    orderDrag: 0
  };
}

function knowledgeHarmony(sc, be) {
  const logGap = Math.abs(Math.log((sc + 600) / (be + 600)));
  return clamp(1 - logGap / Math.log(2.25), 0, 1);
}

function eventFor(rand, current) {
  const doom = doomEvent(rand, current);
  if (doom) return doom;

  if (current.sc >= 7500 && rand % 313 === 0) {
    return {
      type: "special",
      title: "微粒封锁假说",
      text: "最先进的实验同时失败，前沿学者们耳语道，物理学不存在了。",
      delta: { sc: -50, be: 50, pop: -1200, eco: -18000, stability: -9 }
    };
  }

  if (current.be >= 7500 && rand % 271 === 0) {
    return {
      type: "special",
      title: "不信者税",
      text: "不信者自当征收重税，神殿的账本上写满了他们的名字；天意如此。",
      delta: { sc: -50, be: 50, pop: -1600, eco: -22000, stability: -7 }
    };
  }

  if (current.sc >= 6000 && current.be >= 6000 && rand % 89 === 0) {
    return {
      type: "special",
      title: "双相启示",
      text: "公式与祷文不过是一体两面，经文和论文亦不过是双生的姊妹。这天，学者和祭司第一次在同一份日历上签名。",
      delta: { sc: 50, be: 50, pop: 4200, eco: 18000, stability: 10 }
    };
  }

  const contextual = contextualEventFor(rand, current);
  if (contextual && rand % 4 !== 1) return contextual;

  return baseEvent(rand);
}

function contextualEventFor(rand, current) {
  const candidates = [];
  const scEraLevel = eraIndexFor(current.sc, SCIENCE_ERAS);
  const beEraLevel = eraIndexFor(current.be, BELIEF_ERAS);
  const harmony = knowledgeHarmony(current.sc, current.be);
  const scDominant = current.sc > current.be * 1.35;
  const beDominant = current.be > current.sc * 1.35;

  if (scEraLevel >= 5) {
    candidates.push(
      {
        title: "蒸汽管线",
        text: "工坊把热量从地底引向街区，机器第一次像城市的血管一样搏动。",
        delta: { sc: 50, be: -12, pop: 900, eco: 16000, stability: -1 }
      },
      {
        title: "轨道学校",
        text: "孩子们在黑板上计算三颗恒星的影子，旧神话被改写成作业。",
        delta: { sc: 50, be: -18, pop: 300, eco: -6000, stability: 2 }
      }
    );
  }

  if (scEraLevel >= 8) {
    candidates.push(
      {
        title: "反应堆试车",
        text: "地下反应堆点亮了一整片城市，也让每一位官员学会恐惧仪表盘。",
        delta: { sc: 50, be: -20, pop: -700, eco: 26000, stability: -4 }
      },
      {
        title: "计算中心",
        text: "纸带、继电器和早期算法接管粮仓调度，迷信第一次输给了排队论。",
        delta: { sc: 50, be: -16, pop: 1200, eco: 22000, stability: 3 }
      }
    );
  }

  if (beEraLevel >= 5) {
    candidates.push(
      {
        title: "巡礼季",
        text: "数万人沿着恒星升落的方向步行，市集、神殿和粮仓一同膨胀。",
        delta: { sc: -18, be: 50, pop: 2600, eco: 9000, stability: 5 }
      },
      {
        title: "誓约法庭",
        text: "祭司把争端写进誓约，人们服从判决，但学院开始小声抗议。",
        delta: { sc: -22, be: 50, pop: 500, eco: -3000, stability: 9 }
      }
    );
  }

  if (beEraLevel >= 8) {
    candidates.push(
      {
        title: "圣城税册",
        text: "捐献、赎罪券和粮票被装订在同一本账册里，秩序变得昂贵而稳定。",
        delta: { sc: -28, be: 50, pop: 1100, eco: 18000, stability: 7 }
      },
      {
        title: "钟楼合唱",
        text: "每座钟楼在同一刻发声，恐慌被压低，怀疑也被压低。",
        delta: { sc: -24, be: 50, pop: 1800, eco: -5000, stability: 11 }
      }
    );
  }

  if (harmony >= 0.82 && current.sc + current.be >= 7000) {
    candidates.push(
      {
        title: "学院神殿联合会",
        text: "学者和祭司共享同一份历法，争论没有停止，但预算终于能通过。",
        delta: { sc: 50, be: 50, pop: 2400, eco: 21000, stability: 8 }
      },
      {
        title: "双语档案",
        text: "同一场灾难被写成论文，也被写成祷文，后人第一次读懂两种恐惧。",
        delta: { sc: 44, be: 44, pop: 800, eco: 7000, stability: 6 }
      }
    );
  }

  if (scDominant && current.sc >= 5000) {
    candidates.push(
      {
        title: "拆庙取铜",
        text: "观测器需要更多金属，旧神像被熔进望远镜底座。",
        delta: { sc: 50, be: -42, pop: -500, eco: 13000, stability: -7 }
      },
      {
        title: "无神论讲坛",
        text: "教授们公开嘲笑神迹，学生们鼓掌，街角的老人们沉默。",
        delta: { sc: 50, be: -38, pop: -300, eco: -4000, stability: -6 }
      }
    );
  }

  if (beDominant && current.be >= 5000) {
    candidates.push(
      {
        title: "禁书清点",
        text: "审查官把一批星图锁进地下室，钥匙交给唱诗班保管。",
        delta: { sc: -44, be: 50, pop: 200, eco: -6000, stability: 5 }
      },
      {
        title: "苦修大队",
        text: "年轻人离开工坊进入修院，城市安静下来，机器也安静下来。",
        delta: { sc: -36, be: 50, pop: -900, eco: -9000, stability: 8 }
      }
    );
  }

  if (current.pop >= 60000) {
    candidates.push(
      {
        title: "环城温室",
        text: "温室沿着城墙向外扩张，更多人口被养活，也有更多人口需要被养活。",
        delta: { sc: 28, be: 14, pop: 5200, eco: -14000, stability: -3 }
      },
      {
        title: "排水暴动",
        text: "拥挤的地下街区为了水渠爆发冲突，行政官用粮票买来一夜安静。",
        delta: { sc: 8, be: 24, pop: -2600, eco: -18000, stability: -10 }
      }
    );
  }

  if (current.eco <= 35000) {
    candidates.push(
      {
        title: "债券风波",
        text: "城邦把未来三十年的税写成纸片出售，纸片比粮食更快贬值。",
        delta: { sc: -12, be: 18, pop: -900, eco: -14000, stability: -8 }
      },
      {
        title: "黑市粮仓",
        text: "地下粮仓拒绝开门，价格比恒星轨道更难预测。",
        delta: { sc: -6, be: 20, pop: -1800, eco: -9000, stability: -9 }
      }
    );
  }

  if (current.stability <= 30) {
    candidates.push(
      {
        title: "城邦互疑",
        text: "每座城都怀疑下一座城偷走了恒纪元，贸易线被临时关停。",
        delta: { sc: -18, be: 12, pop: -1200, eco: -20000, stability: -6 }
      },
      {
        title: "街垒夜谈",
        text: "人们在街垒后讨论明天由谁统治，没人讨论明天由谁播种。",
        delta: { sc: 10, be: 10, pop: -900, eco: -11000, stability: -5 }
      }
    );
  }

  if ((state.eerfLevel || 0) >= 2) {
    candidates.push(
      {
        title: "火种演习",
        text: "EERF 进行整夜演习，地表城市骂它浪费，地下工程师假装没听见。",
        delta: { sc: 28, be: 12, pop: -500, eco: -12000, stability: 4 }
      },
      {
        title: "地下档案校订",
        text: "上一代人的错误被重新编号，下一代人的课本因此变厚。",
        delta: { sc: 42, be: 30, pop: 200, eco: -8000, stability: 3 }
      }
    );
  }

  if (!candidates.length) return null;

  return {
    type: "progress",
    ...candidates[Math.floor(rand / 7) % candidates.length]
  };
}

function doomEvent(rand, current) {
  const multiplier = finiteOr(difficultyConfig().disasterMultiplier, 1);
  const base = baseDoomEvent(rand, current);
  const gate = Math.abs(rand * 37 + state.turn * 101 + state.seed) % 10000;
  if (base) {
    if (multiplier < 1 && gate >= Math.round(multiplier * 10000)) return null;
    return base;
  }
  if (multiplier <= 1) return null;
  const extraChance = Math.round((multiplier - 1) * 320);
  if (gate >= extraChance) return null;
  const representativeRolls = [50, 2990, 7400, 6150, 1855, 4528, 8848];
  return baseDoomEvent(representativeRolls[(rand + state.turn) % representativeRolls.length], current);
}

function baseDoomEvent(rand, current) {
  if (rand < 130) {
    return {
      destroy: true,
      type: "disaster",
      title: "三日凌空",
      text: "三颗恒星同时占据天空，海洋沸腾，山脉像纸页一样卷曲。"
    };
  }

  if (rand >= 2968 && rand <= 3024) {
    return {
      destroy: true,
      type: "disaster",
      title: "引力长鞭",
      text: "恒星轨道突然抽紧，整颗行星被甩入一段无法计算的黑暗。"
    };
  }

  if (rand >= 7375 && rand <= 7429) {
    return {
      destroy: true,
      type: "disaster",
      title: "三日连珠",
      text: "大地被三颗太阳的潮汐力撕开，地下河与城市一起坠入裂谷。"
    };
  }

  if (rand >= 6140 && rand <= 6165) {
    return {
      destroy: true,
      type: "disaster",
      title: "烈焰长夜",
      text: "天空在同一天内经历正午与深夜，热浪和冰霜轮流碾过地表。"
    };
  }

  if (rand >= 1848 && rand <= 1862) {
    return {
      destroy: true,
      type: "disaster",
      title: "板块运动",
      text: "远古海床重新隆起，城市像沉船一样被埋进盐壳和石灰岩。"
    };
  }

  if (rand >= 4520 && rand <= 4536) {
    return {
      destroy: true,
      type: "disaster",
      title: "黑星凌日",
      text: "一颗恒星在另一颗恒星前方变暗，潮汐和辐射同时失序，历法彻底失效。"
    };
  }

  if (rand >= 8840 && rand <= 8857) {
    return {
      destroy: true,
      type: "disaster",
      title: "三颗飞星",
      text: "长夜提前降临，冰层越过赤道，火种和粮仓在同一周内熄灭。"
    };
  }

  if (rand > 0 && rand % 769 === 0) {
    return {
      destroy: true,
      type: "disaster",
      title: "碎片雨",
      text: "来自旧轨道的碎片贯穿大气层，城市和神殿一起消失在白光里。"
    };
  }

  if (current.pop > 105000 && rand % 607 === 0) {
    return {
      destroy: true,
      type: "disaster",
      title: "地下城窒息",
      text: "人口超过洞穴和粮仓的承载极限，最后的避难所从内部崩塌。"
    };
  }

  return null;
}

function specialEventFor(spec, rng) {
  const current = snapshot();

  if (spec === 1) {
    const loss = 50000 + rng.nextInt(100001);
    return {
      type: "special",
      title: "ReUnion - 叛军起义",
      text: `王侯将相，宁有种乎？ \n——陈胜、吴广，公元前209年。\n叛军夺取粮仓与观测站，人口损失 ${formatNumber(loss)}。`,
      delta: { sc: -30 * SPECIAL_KNOWLEDGE_SCALE, be: -10 * SPECIAL_KNOWLEDGE_SCALE, pop: -loss }
    };
  }

  if (spec === 42) {
    return {
      type: "special",
      title: "Answers to All - 终极答案",
      text: "我们不禁驻足思考。生命、宇宙和万物的终极答案，究竟是什么？\nSC 暴涨，旧神学体系崩塌，EERF 被一次性推至满级。人口被锁定 5 次行动。\n",
      delta: { sc: 2000, be: -4000 },
      effect() {
        state.populationLockTurns = 5;
        state.doomCountdown = 0;
        state.lockedPopulation = state.pop;
        state.eerfLevel = EERF_MAX_LEVEL;
      }
    };
  }

  if (spec === 1861) {
    const divisor = rng.nextInt(2) === 0 ? 2 : 3;
    return {
      type: "special",
      title: "Civil War - 三体内战",
      text: `消灭三体暴政，世界属于人类。\n人口被除以 ${divisor}，经济损失 100,000。\n`,
      delta: {
        pop: Math.round(current.pop / divisor) - current.pop,
        eco: -100000
      }
    };
  }

  if (spec === 2020) {
    const survivorBase = current.pop * 0.6;
    const newPopulation = Math.round(survivorBase);
    return {
      type: "special",
      title: "Plague Inc. - 瘟疫公司",
      text: "灰烬，灰烬，我们都将倒下。\n——中世纪英国民谣。\n先按 4/5 人口减半、1/5 人口保留得到幸存基数。\n",
      delta: { pop: newPopulation - current.pop }
    };
  }

  if (spec === 2006) {
    return {
      type: "special",
      title: "Genesis Birth - 创世出生",
      text: "冬至过了那整三天，耶稣降生在驻马店。\n",
      delta: { sc: 10 * SPECIAL_KNOWLEDGE_SCALE, be: 5 * SPECIAL_KNOWLEDGE_SCALE, pop: 20000, eco: 5000 }
    };
  }

  if (spec === 38) {
    const slowsGrowth = rng.nextInt(2) === 0;
    const factor = slowsGrowth ? 2 / 3 : 5 / 4;
    return {
      type: "special",
      title: "Gender Equality - 两性平等",
      text: slowsGrowth
        ? "女孩们只想玩乐。\n——辛迪·劳帕，1983年。\n人口增长策略转向审慎，本代文明内人口增速变为原来的 2/3。\n"
        : "妇女能顶半边天。新的家庭制度释放劳动与生育潜能，本代文明内人口增速变为原来的 5/4。\n",
      delta: {},
      effect() {
        state.populationGrowthMultiplier = roundStat(state.populationGrowthMultiplier * factor);
      }
    };
  }

  if (spec === 1922) {
    return {
      type: "special",
      title: "Union We Stand - 团结永存",
      text: "所有派系暂时站在同一条防线上，本代文明内发展与打压效率 ×2。\n",
      delta: {},
      effect() {
        state.controlEfficiencyMultiplier = roundStat(state.controlEfficiencyMultiplier * 2);
      }
    };
  }

  if (spec === 1991) {
    return {
      type: "special",
      title: "Divide and Fall - 分崩离析",
      text: "共同体碎裂。本代文明内，玩家行动无法再控制任何发展。文明将自行推进，直到本轮毁灭，或自动结算。\n",
      delta: {},
      effect() {
        state.controlLocked = true;
        state.autoRunUntilCollapse = true;
      }
    };
  }

  if (spec === 1937) {
    return {
      type: "special",
      title: "Remember the Pain - 勿忘国耻",
      text: "铸兹宝鼎，祀我国殇。\n人口损失 300,000，且EERF保护作用无效。\n",
      delta: { pop: -300000 },
      piercesPopulationProtection: true
    };
  }

  if (spec === 1945) {
    return {
      type: "special",
      title: "Revenge Our Loss - 招核男儿",
      text: "亲王亲王御马前，何物随风斩娇颜？\n",
      delta: { sc: 20 * SPECIAL_KNOWLEDGE_SCALE, pop: -800000 }
    };
  }

  if (spec === 1800) {
    const threshold = 300 * SPECIAL_KNOWLEDGE_SCALE;
    const goal = 420 * SPECIAL_KNOWLEDGE_SCALE;
    const target = current.sc <= threshold ? goal : current.sc;
    return {
      type: "special",
      title: "Industrial Revolution - 工业革命",
      text: current.sc <= threshold
        ? `工厂、滚轮和蒸汽噪声同时启动，科学被推至 ${formatNumber(goal)}。\n`
        : "工业革命擦过地平线，但当前科学基础已不需要这次补课。\n",
      delta: { sc: target - current.sc }
    };
  }

  if (spec === 476) {
    const threshold = 300 * SPECIAL_KNOWLEDGE_SCALE;
    const goal = 700 * SPECIAL_KNOWLEDGE_SCALE;
    const target = current.be <= threshold ? goal : current.be;
    return {
      type: "special",
      title: "Middle Aged Times - 中古世纪",
      text: current.be <= threshold
        ? `旧秩序用城墙、钟声和滚轮重组信仰，BE 被推至 ${formatNumber(goal)}。\n`
        : "中古世纪的影子出现了，但神学基础已经更高。\n",
      delta: { be: target - current.be }
    };
  }

  if (spec === 1776) {
    return {
      type: "special",
      title: "Independence and Freedom - 独立自由",
      text: "独立宣言扩散进学院和神殿，本代文明内 SC/BE 正向增速 ×1.15。\n",
      delta: {},
      effect() {
        state.knowledgeGrowthMultiplier = roundStat(state.knowledgeGrowthMultiplier * 1.15);
      }
    };
  }

  if (spec === 1453) {
    return {
      type: "special",
      title: "Anarchy - 时代终结",
      text: "难道就没有一个基督徒来砍下我的头吗？！\n——君士坦丁十一世，1453年5月29日。\n经济衰退至原有的五分之一，人口流失一成。\n",
      delta: {
        eco: Math.round(current.eco / 5) - current.eco,
        pop: Math.round(current.pop * 0.9) - current.pop
      }
    };
  }

  if (spec === 3332) {
    return {
      type: "special",
      title: "No Meaning - 虚无主义",
      text: "跳舞吧，狂欢吧。一切都没有意义。\n经济损失 30,000，神学增长 600。\n",
      delta: { be: 30 * SPECIAL_KNOWLEDGE_SCALE, eco: -30000 }
    };
  }

  if (spec === 3141) {
    return {
      type: "special",
      title: "Great Ratio - π",
      text: "山巅一寺一壶酒。\n",
      delta: { sc: 31.4159 * SPECIAL_MATH_SCIENCE_SCALE, eco: 31000 }
    };
  }

  if (spec === 2718) {
    return {
      type: "special",
      title: "Nature Goddess - 自然对数",
      text: "自然对数被奉为女神，人们在她的祭坛上计算——嗯，几乎是一切。\n",
      delta: { sc: 27.1828 * SPECIAL_MATH_SCIENCE_SCALE, eco: 27000 }
    };
  }

  if (spec === 3688) {
    return {
      type: "special",
      title: "No Refund - 概不退款",
      text: "朋友，随我来，加入这场伟大的合唱。\n",
      delta: { eco: -30000 }
    };
  }

  if (spec === 404) {
    return {
      type: "special",
      title: "God Not Found - 查无此神",
      text: "我们把天空翻了个遍，没有发现上帝和天使。\n——尤里·加加林，1961年。\n",
      delta: { be: -50 * SPECIAL_KNOWLEDGE_SCALE }
    };
  }

  if (spec === 1611) {
    return {
      type: "special",
      title: "The Tempest - 暴风雨",
      text: "啊，这美丽的新世界，竟有这样的人。\n——《暴风雨》，莎士比亚，1611年。\n",
      delta: { la: 2200, sc: 10 * SPECIAL_KNOWLEDGE_SCALE, be: 6 * SPECIAL_KNOWLEDGE_SCALE, eco: -12000 }
    };
  }

  if (spec === 213) {
    return {
      type: "special",
      title: "Ashes of Alexandria - 亚历山大灰烬",
      text: "图书馆的火光照亮海港，也照亮空白的目录。LA 大幅下降。\n",
      delta: { la: -2600, sc: -18 * SPECIAL_KNOWLEDGE_SCALE, be: 8 * SPECIAL_KNOWLEDGE_SCALE, eco: -18000, stability: -5 }
    };
  }

  return null;
}

function specialEventTitleWithSpec(event, spec) {
  if (!event) return "";
  return Number.isFinite(Number(spec))
    ? `${event.title}｜SPEC ${formatSpec(spec)}`
    : event.title;
}

function baseEvent(rand) {
  const events = [
    {
      title: "乱纪元延长",
      text: "昼夜和季节失去意义，人们靠猜测安排播种和迁徙。",
      delta: { sc: 12, be: 45, pop: -2800, eco: -9000, stability: -8 }
    },
    {
      title: "稳定恒纪元",
      text: "浸泡在恒纪元的光辉里，文明的秩序和产出都获得了提升。",
      delta: { sc: 40, be: 14, pop: 3600, eco: 7000, stability: 7 }
    },
    {
      title: "地层翻页",
      text: "新的矿脉从断崖里露出，代价是一片旧城被埋进岩层。",
      delta: { sc: 50, be: -8, pop: -900, eco: 12000, stability: -2 }
    },
    {
      title: "神权辩论",
      text: "祭司们用一场漫长争论解释灾变，群众获得方向，学院失去经费。",
      delta: { sc: -30, be: 50, pop: 500, eco: -5000, stability: 4 }
    },
    {
      title: "观测失误",
      text: "一次错误预报让迁徙队走向错误山谷，星象学派趁机扩张。",
      delta: { sc: -45, be: 35, pop: -1300, eco: -7000, stability: -5 }
    },
    {
      title: "丰收季",
      text: "温暖、雨水和安静的夜晚罕见地同时出现，粮仓被装满。",
      delta: { sc: 20, be: 28, pop: 4600, eco: 10000, stability: 5 }
    },
    {
      title: "热疫",
      text: "高温唤醒古老病灶，医师与祈祷者都被推到人群前方。",
      delta: { sc: 45, be: 45, pop: -3600, eco: -12000, stability: -6 }
    },
    {
      title: "工匠学院",
      text: "师者，所以传道授业解惑也。",
      delta: { sc: 50, be: -10, pop: 900, eco: 8000, stability: 1 }
    },
    {
      title: "圣典整理",
      text: "要依靠主得救。",
      delta: { sc: -8, be: 50, pop: 700, eco: 3000, stability: 6 }
    },
    {
      title: "星象安静",
      text: "这一年没有宏大的灾变，普通人的手艺和耐心反而推进了文明。",
      delta: { sc: 36, be: 36, pop: 1500, eco: 5000, stability: 3 }
    },
    {
      title: "冷寂季",
      text: "长夜覆盖地表，人口退入洞穴，火和故事成为同一种资源。",
      delta: { sc: -12, be: 46, pop: -2200, eco: -8000, stability: -3 }
    },
    {
      title: "轨道共振",
      text: "天体运行短暂呈现规律，历法、神谕和工程计划同时变得可信。",
      delta: { sc: 50, be: 32, pop: 1200, eco: 9000, stability: 7 }
    },
    {
      title: "盐湖退潮",
      text: "盐湖露出一圈旧码头，商人带回矿盐，祭司带回远古咒语。",
      delta: { sc: 26, be: 18, pop: 900, eco: 14000, stability: 2 }
    },
    {
      title: "迁徙争执",
      text: "观测队要求向北，长老会要求向东，最后车队在原地消耗了整整一季。",
      delta: { sc: 16, be: 22, pop: -1200, eco: -10000, stability: -6 }
    },
    {
      title: "井水变甜",
      text: "地下水脉短暂恢复，谣言说这是神迹，工程师说这是地层压力。",
      delta: { sc: 20, be: 34, pop: 3100, eco: 6000, stability: 5 }
    },
    {
      title: "抄写院失火",
      text: "一场小火烧掉了半座抄写院，幸存的书页反而被抄得更快。",
      delta: { sc: -18, be: 50, la: -520, pop: -300, eco: -7000, stability: -2 }
    },
    {
      title: "青铜钟裂",
      text: "城中央的青铜钟在寒夜中裂开，人们第一次听见自己心跳的声音。",
      delta: { sc: 12, be: 40, pop: -700, eco: -5000, stability: -3 }
    },
    {
      title: "测绘队归来",
      text: "失踪三年的测绘队带回新地图，也带回一串没人敢看的死亡名单。",
      delta: { sc: 50, be: 8, pop: -900, eco: 11000, stability: -1 }
    },
    {
      title: "粮仓审计",
      text: "账本被重新计算，少了一些神迹，多了一些库存。",
      delta: { sc: 32, be: -10, pop: 600, eco: 17000, stability: 4 }
    },
    {
      title: "祭日市场",
      text: "祭日吸引了远方部落，祈祷、交易和盗窃在同一条街上发生。",
      delta: { sc: 6, be: 38, pop: 1800, eco: 13000, stability: -1 }
    },
    {
      title: "恒星色变",
      text: "一颗太阳呈现异常红光，学院增设观测班，民间增设忏悔日。",
      delta: { sc: 48, be: 42, pop: -500, eco: -9000, stability: -5 }
    },
    {
      title: "旧王陵开启",
      text: "王陵里没有永生秘密，只有金器、霉菌和一份相当准确的历法。",
      delta: { sc: 40, be: 24, pop: -600, eco: 19000, stability: 1 }
    },
    {
      title: "煤烟争议",
      text: "工坊烟囱遮住了祷告时的星光，城里第一次为天空的所有权争吵。",
      delta: { sc: 50, be: -24, pop: -400, eco: 18000, stability: -7 }
    },
    {
      title: "修道院药圃",
      text: "修道院把草药配方交给医师，医师承认这次确实有效。",
      delta: { sc: 34, be: 36, pop: 2600, eco: 5000, stability: 4 }
    },
    {
      title: "税吏失踪",
      text: "负责征粮的税吏在夜里消失，第二天所有人都声称没有看见。",
      delta: { sc: -4, be: 10, pop: 400, eco: -16000, stability: -8 }
    },
    {
      title: "木星般的影子",
      text: "天空出现一片缓慢移动的巨大阴影，孩子们把它画进课本边角。",
      delta: { sc: 46, be: 30, pop: -300, eco: -6000, stability: -2 }
    },
    {
      title: "港口复工",
      text: "干涸河床重新容纳浅船，商路像旧伤口一样被重新撕开。",
      delta: { sc: 24, be: 8, pop: 1500, eco: 22000, stability: 3 }
    },
    {
      title: "孤儿院扩建",
      text: "灾年留下的孩子被集中抚养，他们很快学会同时背诵公式和祷文。",
      delta: { sc: 22, be: 28, pop: 2400, eco: -11000, stability: 6 }
    },
    {
      title: "钟表匠罢工",
      text: "钟表匠拒绝继续修理互相矛盾的时间，城里的预约系统崩溃了。",
      delta: { sc: -10, be: 20, pop: -400, eco: -13000, stability: -5 }
    },
    {
      title: "夜校开课",
      text: "白天种地的人夜里学习几何，白天祷告的人夜里学习账簿。",
      delta: { sc: 50, be: 22, la: 340, pop: 900, eco: -4000, stability: 2 }
    },
    {
      title: "赦免令",
      text: "逃亡者被允许返回城市，条件是交出武器、粮票和一半故事。",
      delta: { sc: 6, be: 34, pop: 3000, eco: 4000, stability: 8 }
    },
    {
      title: "矿井歌声",
      text: "矿工在深处发现稳定岩层，歌声沿着竖井传到地表。",
      delta: { sc: 38, be: 16, pop: 700, eco: 21000, stability: 2 }
    },
    {
      title: "干热风",
      text: "风像从炉膛里吹来，地表作物卷曲，地下课堂却坐满了人。",
      delta: { sc: 30, be: 28, pop: -2400, eco: -15000, stability: -6 }
    },
    {
      title: "铸币改革",
      text: "新币上没有国王头像，只刻着三颗太阳和一行小到看不清的税率。",
      delta: { sc: 18, be: -4, pop: 500, eco: 24000, stability: 3 }
    },
    {
      title: "城墙加高",
      text: "城墙又高了一层，外面的人看不见粮仓，里面的人看不见地平线。",
      delta: { sc: 10, be: 26, pop: 600, eco: -12000, stability: 9 }
    },
    {
      title: "诗歌竞赛",
      text: "市民把灾年、粮价和三颗太阳写进韵脚，广场第一次因为记忆而拥挤。",
      delta: { sc: 8, be: 18, la: 760, pop: 500, eco: -6500, stability: 3 }
    },
    {
      title: "壁画出土",
      text: "旧文明的壁画从盐壳下露出，孩子们照着那些线条重新想象祖先。",
      delta: { sc: 28, be: 22, la: 920, pop: 300, eco: -9000, stability: 2 }
    },
    {
      title: "剧场禁令",
      text: "城邦禁止剧场上演灾变寓言，演员散入酒馆，把沉默变成更锋利的故事。",
      delta: { sc: -6, be: 20, la: -850, pop: -200, eco: -4500, stability: 6 }
    },
    {
      title: "档案霉变",
      text: "潮气钻进地下档案室，一整架族谱在早晨变成无法展开的灰。",
      delta: { sc: -14, be: 8, la: -980, pop: -120, eco: -7200, stability: -2 }
    }
  ];

  return {
    type: "progress",
    ...events[rand % events.length]
  };
}

function applySpecialEvent(event, options = {}) {
  const effectiveDelta = applyDelta(event.delta || {}, options);
  if (typeof event.effect === "function") {
    event.effect();
  }
  return effectiveDelta;
}

function isEconomicCrisis() {
  return state.eco <= 0;
}

function applyEconomicCrisisRules(delta = {}, options = {}) {
  const effectiveDelta = { ...delta };
  if (!isEconomicCrisis() && !options.freezeKnowledge) return effectiveDelta;

  if (effectiveDelta.sc > 0) effectiveDelta.sc = 0;
  if (effectiveDelta.be > 0) effectiveDelta.be = 0;
  return effectiveDelta;
}

function prepareActionDelta(action, rawDelta, crisisAtRoundStart = false) {
  const crisisNow = isEconomicCrisis();
  if ((crisisAtRoundStart || crisisNow) && !action.crisisOnly) {
    return {
      locked: true,
      delta: {},
      text: "经济危机锁死了这项行动。正向发展冻结，只能先重启财政。"
    };
  }

  if (!crisisAtRoundStart && !crisisNow && action.crisisOnly) {
    return {
      locked: true,
      delta: {},
      text: "经济尚未归零，重启财政未被触发。"
    };
  }

  if (state.controlLocked && !action.crisisOnly) {
    return {
      locked: true,
      delta: {},
      text: `${action.label} 被各自为政的城邦吞没，文明不再响应玩家控制。`
    };
  }

  if (action === ACTIONS.buildEerf && state.eerfLevel > 0) {
    return {
      locked: true,
      delta: {},
      text: "EERF 已经存在，只能继续升级。"
    };
  }

  if (action === ACTIONS.upgradeEerf && state.eerfLevel <= 0) {
    return {
      locked: true,
      delta: {},
      text: "尚未建造 EERF，无法升级不存在的地下设施。"
    };
  }

  if (action === ACTIONS.upgradeEerf && state.eerfLevel >= EERF_MAX_LEVEL) {
    return {
      locked: true,
      delta: {},
      text: "EERF 已达到当前技术能支持的最高等级。"
    };
  }

  if (action === ACTIONS.upgradeEerf) {
    const nextLevel = Math.min(EERF_MAX_LEVEL, (state.eerfLevel || 0) + 1);
    const requirement = eerfScienceRequirementForLevel(nextLevel);
    if (state.sc < requirement) {
      return {
        locked: true,
        delta: {},
        text: `升级至 EERF ${nextLevel} 级需要 SC ${formatNumber(requirement)}。`
      };
    }
  }

  const delta = { ...rawDelta };
  if (delta.eco < 0 && state.eco + delta.eco < 0) {
    return {
      locked: true,
      delta: {},
      text: `${action.label} 需要 ${formatNumber(Math.abs(delta.eco))} ECO，当前经济无法支付。`
    };
  }

  const controlEfficiency = state.controlEfficiencyMultiplier || 1;
  const knowledgeGrowth = state.knowledgeGrowthMultiplier || 1;
  const populationGrowth = state.populationGrowthMultiplier || 1;

  ["sc", "be"].forEach((key) => {
    if (typeof delta[key] !== "number") return;
    if (delta[key] > 0) delta[key] *= knowledgeGrowth;
    delta[key] *= controlEfficiency;
  });

  if (typeof delta.pop === "number") {
    if (delta.pop > 0) delta.pop *= populationGrowth;
    delta.pop *= controlEfficiency;
  }

  if (actionPopulationWouldBreakFloor(action, delta.pop)) {
    return {
      locked: true,
      delta: {},
      text: `${action.label} 会让人口跌破最低可持续线 ${formatNumber(minimumSustainablePopulation())} POP。`
    };
  }

  return {
    locked: false,
    delta,
    text: action.chronicleText || action.text
  };
}

function completeEerfActionBeforeDisaster(action, crisisAtRoundStart = false) {
  if (!isEerfConstructionAction(action)) return null;

  const previousLevel = state.eerfLevel || 0;
  const rawDelta = typeof action.delta === "function" ? action.delta(state) : action.delta;
  const actionResult = prepareActionDelta(action, rawDelta, crisisAtRoundStart);
  if (actionResult.locked) return null;

  applyDelta(actionResult.delta, { freezeKnowledge: crisisAtRoundStart });
  if (typeof action.effect === "function") {
    action.effect();
  }
  const completedLevel = state.eerfLevel || 0;
  return {
    snapshot: snapshot(),
    minimumRestartEerfLevel: completedLevel > previousLevel
      ? Math.max(1, completedLevel - 1)
      : 0
  };
}

function isEerfConstructionAction(action) {
  return action === ACTIONS.buildEerf || action === ACTIONS.upgradeEerf;
}

function projectedActionPopulationDelta(rawDelta = {}) {
  if (typeof rawDelta.pop !== "number") return 0;

  let popDelta = rawDelta.pop;
  if (popDelta > 0) popDelta *= state.populationGrowthMultiplier || 1;
  popDelta *= state.controlEfficiencyMultiplier || 1;
  return popDelta;
}

function actionPopulationWouldBreakFloor(action, popDelta) {
  if (!action || action.canRunWithZeroPopulation || typeof popDelta !== "number" || popDelta >= 0) {
    return false;
  }

  return state.pop + popDelta < minimumSustainablePopulation();
}

function enforcePopulationLock() {
  if (state.populationLockTurns <= 0 || !Number.isFinite(state.lockedPopulation)) {
    return false;
  }

  state.pop = Math.max(0, Math.round(state.lockedPopulation));
  return true;
}

function tickCivilizationTimers() {
  if (state.populationLockTurns > 0) {
    state.populationLockTurns -= 1;
    if (state.populationLockTurns === 0) {
      state.lockedPopulation = null;
    }
  }

  if (state.doomCountdown > 0) {
    state.doomCountdown -= 1;
    if (state.doomCountdown === 0) {
      return {
        title: "终极答案倒计时归零",
        text: "第 42 号答案完成最后一次回响，文明在确定性里停止。"
      };
    }
  }

  return null;
}

function resetCivilizationModifiers() {
  state.populationGrowthMultiplier = 1;
  state.knowledgeGrowthMultiplier = 1;
  state.controlEfficiencyMultiplier = 1;
  state.controlLocked = false;
  state.autoRunUntilCollapse = false;
  state.populationLockTurns = 0;
  state.doomCountdown = 0;
  state.lockedPopulation = null;
  cancelAutoRun();
}

function createTerritoryInheritanceSnapshot() {
  if (!state?.map) return null;
  return {
    seed: state.map.seed || state.seed,
    difficulty: state.map.difficulty || state.difficulty,
    startingRegionId: state.map.startingRegionId || state.startingRegionId,
    entities: Object.fromEntries(politicalEntities().map((entity) => [entity.id, { ...entity }])),
    layout: Object.fromEntries(Object.entries(state.map.layout || {}).map(([regionId, layout]) => [regionId, {
      ...layout,
      points: Array.isArray(layout.points) ? layout.points.map((point) => ({ ...point })) : []
    }])),
    roads: activeMapRoads().map((road) => ({ ...road })),
    regions: state.map.regions.map((region) => ({
      id: region.id,
      owner: region.owner,
      controllerId: region.controllerId
    })),
    lastEvent: state.map.lastEvent ? { ...state.map.lastEvent } : null
  };
}

function collapseCivilization(event, before, rand, options = {}) {
  state.autoRunUntilCollapse = false;
  cancelAutoRun();

  if (maybeFinishGame({ kind: "collapse", trigger: event.title, rand, snapshot: before })) {
    return true;
  }

  const oldCount = state.count;
  const restartPopulation = computeRestartPopulation(before);
  const restartKnowledge = computeRestartKnowledge(before);
  const oldEerfLevel = state.eerfLevel || 0;
  const inheritedMapState = createTerritoryInheritanceSnapshot();
  const restartTrends = computeRestartKnowledgeTrends(oldEerfLevel, before);
  updateCivilizationStats(before);
  const archived = {
    ...state.currentCivilization,
    turns: Math.max(1, state.turn - state.currentCivilization.startTurn),
    collapseCause: event.title,
    finalSnapshot: { ...before },
    ending: "毁灭后待判定"
  };
  archived.metricSamples = archivedMetricSamplesWithCollapse(archived, before, event.title, oldEerfLevel);
  state.history.unshift(archived);
  state.history = state.history.slice(0, 12);

  if (maybeFinishStagnantCivilizationCEnding(archived, before, rand)) {
    return true;
  }
  if (maybeFinishCivilizationStreakEnding(archived, before, rand)) {
    return true;
  }

  const restartEerfLevel = Math.max(
    Math.max(0, oldEerfLevel - 1),
    clamp(Math.round(finiteOr(options.minimumRestartEerfLevel, 0)), 0, EERF_MAX_LEVEL)
  );

  state.pendingRestart = {
    oldCount,
    nextCount: oldCount + 1,
    sc: restartKnowledge.sc,
    be: restartKnowledge.be,
    la: 0,
    scTrend: restartTrends.scTrend,
    beTrend: restartTrends.beTrend,
    pop: restartPopulation,
    eco: restartPopulation > BASE_RESTART_POP ? Math.round(restartPopulation * 2.2) : 0,
    stability: Math.max(18, Math.floor(before.stability * 0.42)),
    eerfLevel: restartEerfLevel,
    collapseCause: event.title,
    mapState: inheritedMapState
  };
  state.awaitingCivilizationRestart = true;
  state.sc = 0;
  state.be = 0;
  state.la = 0;
  state.scTrend = 0;
  state.beTrend = 0;
  state.pop = 0;
  state.eco = 0;
  state.stability = Math.max(0, Math.floor(before.stability * 0.2));
  state.map = collapseMapState(event.title);
  state.military = createInitialMilitaryState(
    {
      force: 0,
      pop: 0,
      difficulty: state.difficulty,
      defeatedEntityIds: POLITICAL_ENTITY_IDS.filter((entityId) => entityId !== RIVAL_ENTITY_ID)
    },
    { difficulty: state.difficulty }
  );
  updateMetricTrends(diff(before, snapshot()));
  recordMetricSample({ collapse: event.title });
  state.weather = event.title;
  state.ending = `第 ${oldCount} 号文明毁灭，等待重启文明`;
  state.lastTone = "disaster";
  state.specialNotice = {
    title: `${event.title}｜文明毁灭`,
    text: `${event.text} 第 ${oldCount} 号文明进化至${scienceEra(before.sc)}。EERF 将保存人口 ${formatNumber(restartPopulation)}、少量知识与少量趋势。`,
    delta: diff(before, snapshot())
  };
  updateEnding();

  addLog({
    type: "disaster",
    title: `第 ${state.turn} 年｜Rand ${formatRand(rand)}｜${event.title}`,
    text: `${event.text} 第 ${oldCount} 号文明在${event.title}中毁灭了，该文明进化至${scienceEra(before.sc)}。文明的种子仍在，它将重新启动，再次开启在三体世界中命运莫测的进化。`,
    delta: diff(before, snapshot())
  });

  return false;
}

function restartCivilizationFromPending() {
  if (!state.awaitingCivilizationRestart || !state.pendingRestart) return false;

  const before = snapshot();
  const restart = state.pendingRestart;
  state.sc = restart.sc;
  state.be = restart.be;
  state.la = finiteOr(restart.la, 0);
  state.scTrend = finiteOr(restart.scTrend, 0);
  state.beTrend = finiteOr(restart.beTrend, 0);
  state.pop = restart.pop;
  state.eco = restart.eco;
  state.stability = restart.stability;
  state.eerfLevel = restart.eerfLevel;
  state.restartPopulationSeed = restart.pop;
  resetCivilizationModifiers();
  state.count = restart.nextCount;
  state.map = createInitialMapState(restart.mapState || {}, {
    seed: state.seed,
    realmName: state.realmName,
    difficulty: state.difficulty,
    startingRegionId: state.startingRegionId
  });
  state.military = createInitialMilitaryState(snapshot(), { difficulty: state.difficulty });
  state.selectedArmyId = PLAYER_ARMY_ID;
  state.selectedEntityId = PLAYER_ENTITY_ID;
  alignArmiesWithEntityTerritories();
  eliminateDefeatedEntities();
  state.selectedRegionId = primaryPlayerArmy()?.regionId || entityRegions(PLAYER_ENTITY_ID)[0]?.id || state.startingRegionId;
  state.currentCivilization = createCivilizationStats(state.count, state.turn, snapshot());
  state.awaitingCivilizationRestart = false;
  state.pendingRestart = null;
  state.endingCandidate = null;
  state.weather = `第 ${state.count} 号文明苏醒`;
  state.ending = "我们依然存在。";
  state.lastTone = "special";
  updateMetricTrends(diff(before, snapshot()));
  recordMetricSample({ label: `第 ${state.count} 号文明苏醒` });
  state.specialNotice = {
    title: "重启文明",
    text: `第 ${state.count} 号文明从 EERF 火种中启动。`,
    delta: diff(before, snapshot())
  };

  addLog({
    type: "special",
    title: `第 ${state.turn} 年｜重启文明`,
    text: `第 ${state.count} 号文明从 EERF 和废墟档案里醒来。`,
    delta: diff(before, snapshot())
  });

  return true;
}

function computeRestartPopulation(snapshotValue) {
  const level = state.eerfLevel || 0;
  if (level <= 0) return BASE_RESTART_POP;

  const preserveRates = [0, 0.045, 0.085, 0.13, 0.19, 0.28];
  const base = BASE_RESTART_POP + level * 1450;
  const preserved = Math.round(snapshotValue.pop * preserveRates[level]);
  return clamp(base + preserved, BASE_RESTART_POP, 95000);
}

function archivedMetricSamplesWithCollapse(archived, before, collapseCause, oldEerfLevel) {
  const samples = Array.isArray(archived.metricSamples) ? archived.metricSamples.slice(-CIVILIZATION_SAMPLE_LIMIT) : [];
  const collapseSample = createMetricSample(state.turn, state.count, {
    sc: 0,
    be: 0,
    la: 0,
    pop: 0,
    eco: 0,
    stability: Math.max(0, Math.floor(finiteOr(before.stability, 0) * 0.2)),
    eerf: oldEerfLevel
  }, { collapse: collapseCause });
  const last = samples[samples.length - 1];
  if (!last || last.turn !== collapseSample.turn || !last.collapse) {
    samples.push(collapseSample);
  }
  return samples.slice(-CIVILIZATION_SAMPLE_LIMIT);
}

function computeRestartKnowledge(snapshotValue) {
  const level = state.eerfLevel || 0;
  if (level <= 0) return { sc: 0, be: 0 };

  const laRatio = eerfCultureRatio(snapshotValue);
  const scienceRate = interpolate(SCIENCE_RESTART_RATES[level] || 0, LA_EERF_MAX_KNOWLEDGE_RATE, laRatio);
  const beliefRate = scienceRate * BELIEF_RESTART_RATE_MULTIPLIER;
  const scienceCap = Math.floor(interpolate(SCIENCE_RESTART_CAPS[level] || 0, CAP * LA_EERF_MAX_KNOWLEDGE_RATE, laRatio));
  const beliefCap = Math.floor(interpolate(BELIEF_RESTART_CAPS[level] || 0, CAP * LA_EERF_MAX_KNOWLEDGE_RATE * BELIEF_RESTART_RATE_MULTIPLIER, laRatio));
  return {
    sc: clamp(Math.floor(level * 35 + snapshotValue.sc * scienceRate), 0, scienceCap),
    be: clamp(Math.floor(level * 35 + snapshotValue.be * beliefRate), 0, beliefCap)
  };
}

function computeRestartKnowledgeTrends(level = state.eerfLevel || 0, snapshotValue = snapshot()) {
  if (level <= 0) return { scTrend: 0, beTrend: 0 };

  const laRatio = eerfCultureRatio(snapshotValue);
  const rate = interpolate(KNOWLEDGE_TREND_RESTART_RATES[level] || 0, LA_EERF_MAX_TREND_RATE, laRatio);
  const cap = Math.floor(interpolate(KNOWLEDGE_TREND_RESTART_CAPS[level] || 0, KNOWLEDGE_TREND_MAX * LA_EERF_MAX_TREND_RATE, laRatio));
  return {
    scTrend: clamp(Math.floor(level * 2 + Math.max(0, finiteOr(state.scTrend, 0)) * rate), 0, cap),
    beTrend: clamp(Math.floor(level * 2 + Math.max(0, finiteOr(state.beTrend, 0)) * rate), 0, cap)
  };
}

function eerfCultureRatio(snapshotValue = snapshot()) {
  return clamp(finiteOr(snapshotValue.la, state.la || 0) / LA_CAP, 0, 1);
}

function interpolate(from, to, ratio) {
  return from + (to - from) * clamp(ratio, 0, 1);
}

function eerfScienceRequirementForLevel(level) {
  if (level <= 1) return 0;
  return EERF_SCIENCE_REQUIREMENTS[level] ?? Infinity;
}

function applyDelta(delta, options = {}) {
  const effectiveDelta = applyEconomicCrisisRules(delta, options);
  const governor = governorBalanceEffects();
  if (effectiveDelta.be > 0) effectiveDelta.be *= governor.beliefGrowth || 1;
  if (effectiveDelta.pop > 0) effectiveDelta.pop *= governor.populationGrowth || 1;
  if (effectiveDelta.eco > 0) effectiveDelta.eco *= governor.economyGrowth || 1;
  if (options.protectPopulationFloor) {
    effectiveDelta.pop = protectedPopulationDelta(Number(effectiveDelta.pop || 0));
  }
  state.sc = clamp(roundStat(state.sc + Number(effectiveDelta.sc || 0)), 0, CAP);
  state.be = clamp(roundStat(state.be + Number(effectiveDelta.be || 0)), 0, CAP);
  state.la = clamp(Math.floor(finiteOr(state.la, 0) + Number(effectiveDelta.la || 0)), 0, LA_CAP);
  state.pop = Math.max(0, Math.round(state.pop + (effectiveDelta.pop || 0)));
  state.eco = Math.max(0, Math.round(state.eco + (effectiveDelta.eco || 0)));
  state.stability = clamp(state.stability + Math.round(effectiveDelta.stability || 0), 0, 100);
  markCivilizationMilestones(snapshot());
  return effectiveDelta;
}

function markCivilizationMilestones(snapshotValue = snapshot()) {
  if (!state.currentCivilization) return;
  state.currentCivilization.minStability = Math.min(
    finiteOr(state.currentCivilization.minStability, snapshotValue.stability),
    snapshotValue.stability
  );
  if (snapshotValue.stability < I_LOW_ORDER_THRESHOLD) {
    state.currentCivilization.hadLowOrder = true;
  }
  if (snapshotValue.la >= J_MEMORY_LA_THRESHOLD) {
    state.currentCivilization.hadLaCap = true;
  }
}

function protectedPopulationDelta(popDelta) {
  if (!Number.isFinite(popDelta) || popDelta >= 0) return popDelta || 0;

  const floor = minimumSustainablePopulation(snapshot());
  if (state.pop <= floor) return 0;

  return Math.max(popDelta, floor - state.pop);
}

function minimumSustainablePopulation(current = snapshot()) {
  const knowledgeBuffer = clamp((finiteOr(current.sc, 0) + finiteOr(current.be, 0)) / (CAP * 2), 0, 1) * 260;
  const economyBuffer = clamp(Math.log10(Math.max(1, finiteOr(current.eco, 0)) + 10) / 6, 0, 1) * 220;
  const orderBuffer = clamp(finiteOr(current.stability, 0), 0, 100) >= 70
    ? 180
    : clamp(finiteOr(current.stability, 0), 0, 100) >= 40
      ? 90
      : 0;
  return Math.round(MIN_SUSTAINABLE_POP + knowledgeBuffer + economyBuffer + orderBuffer);
}

function updateEnding() {
  if (state.finished && state.finalEnding?.id) {
    state.ending = `${state.finalEnding.id}结局已经抵达`;
  } else if (state.awaitingCivilizationRestart) {
    const oldCount = state.pendingRestart?.oldCount || state.count;
    const settlement = settlementStatusText();
    state.ending = settlement
      ? `第 ${oldCount} 号文明毁灭，等待重启文明；${settlement}`
      : `第 ${oldCount} 号文明毁灭，等待重启文明`;
  } else if (state.endingCandidate?.id) {
    state.ending = settlementStatusText();
  } else if (state.doomCountdown > 0) {
    state.ending = `终极答案倒计时：还剩 ${state.doomCountdown} 次行动`;
  } else if (currentInclusiveLaMemoryStreak() > 0) {
    state.ending = `永志不忘观测：连续 ${currentInclusiveLaMemoryStreak()}/${J_MEMORY_CIVILIZATION_STREAK} 代文明曾使 LA 达到记忆饱和`;
  } else if (currentInclusiveLowOrderStreak() > 0) {
    state.ending = `罗马再临观测：连续 ${currentInclusiveLowOrderStreak()}/${I_LOW_ORDER_CIVILIZATION_STREAK} 代文明以无政府收束`;
  } else if (state.mapUiExpanded !== false && isMapConquered() && militaryStats().force >= ENDING_THRESHOLDS.conquestForce) {
    state.ending = "全图征服已经完成，万王之王等待加冕。";
  } else if (state.mapUiExpanded !== false && isMapConquered()) {
    state.ending = `全图征服已经完成，军力达到 ${formatNumber(ENDING_THRESHOLDS.conquestForce)} 后方可加冕。`;
  } else if (state.mapUiExpanded !== false && mapOwnerCounts().player <= 1) {
    state.ending = "国土濒临灭亡，末代皇帝的阴影逼近。";
  } else if (isEconomicCrisis()) {
    state.ending = "经济危机：科学与神学的正向发展冻结";
  } else if (state.sc >= CAP && state.be < CAP) {
    state.ending = "我们即将建成地上天国。";
  } else if (state.be >= CAP && state.sc < CAP) {
    state.ending = "我们即将皈依上上善道。";
  } else if (state.sc >= ENDING_THRESHOLDS.exodusKnowledge && state.be < ENDING_THRESHOLDS.companionKnowledge) {
    state.ending = "我们即将拥有整片星空。";
  } else if (state.be >= ENDING_THRESHOLDS.exodusKnowledge && state.sc < ENDING_THRESHOLDS.companionKnowledge) {
    state.ending = "我们即将拥有完美信仰。";
  } else if (state.sc >= ENDING_THRESHOLDS.balancedKnowledge && state.be >= ENDING_THRESHOLDS.balancedKnowledge) {
    state.ending = "我们即将建成通天高塔。";
  } else if (state.sc >= ENDING_THRESHOLDS.middleScience && state.be <= ENDING_THRESHOLDS.lowKnowledge) {
    state.ending = "我们即将奴役有灵众生。";
  } else {
    state.ending = "文明的旅程尚未停息。";
  }
}

function settlementStatusText() {
  if (!state.endingCandidate?.id) return "";

  return `${state.endingCandidate.id}结局可结算。可继续发展，或点击脱离苦海`;
}

function maybeFinishGame(context = {}) {
  const current = context.snapshot || snapshot();
  if (!canHoldEndingCandidate(context)) {
    state.endingCandidate = null;
    return false;
  }

  const endingId = resolveEnding(context, current);
  updateEndingCandidate(endingId, context, current);

  const automaticEndingId = resolveAutomaticEnding(context, current);
  if (!automaticEndingId) return false;
  finishGame(automaticEndingId, {
    ...context,
    trigger: automaticEndingTrigger(automaticEndingId, context),
    snapshot: current
  });
  return true;
}

function canHoldEndingCandidate(context = {}) {
  return context.kind !== "collapse" && !state.awaitingCivilizationRestart;
}

function resolveEnding(context = {}, current = snapshot()) {
  const harmony = knowledgeHarmony(current.sc, current.be);
  const thresholds = ENDING_THRESHOLDS;

  if (state.mapUiExpanded !== false && isNationExtinct()) {
    return "L";
  }

  if (state.mapUiExpanded !== false && isMapConquered() && militaryStats(current).force >= thresholds.conquestForce) {
    return "K";
  }

  if (
    current.sc >= thresholds.exodusKnowledge &&
    current.be < thresholds.companionKnowledge &&
    current.pop >= thresholds.exodusPopulation &&
    current.eco >= thresholds.exodusEconomy
  ) {
    return "D";
  }

  if (
    current.be >= thresholds.exodusKnowledge &&
    current.sc < thresholds.companionKnowledge &&
    current.pop >= thresholds.exodusPopulation &&
    current.stability >= 58
  ) {
    return "E";
  }

  if (
    current.sc >= thresholds.balancedKnowledge &&
    current.be >= thresholds.balancedKnowledge &&
    harmony >= 0.84
  ) {
    return "F";
  }

  if (
    current.sc >= thresholds.middleScience &&
    current.sc < thresholds.exodusKnowledge &&
    current.be <= thresholds.lowKnowledge &&
    current.stability >= thresholds.orderHigh &&
    current.pop >= thresholds.authoritarianPopulation
  ) {
    return "H";
  }

  if (isApproachingHiddenCEnding()) {
    return null;
  }

  if (context.kind === "collapse" && (state.count >= thresholds.collapseCycle || state.history.length >= thresholds.collapseCycle - 1)) {
    return "G";
  }

  if (state.history.length >= thresholds.collapseCycle) {
    return "G";
  }

  return null;
}

function isApproachingHiddenCEnding() {
  const guard = Math.min(C_STAGNANT_CIVILIZATION_STREAK - 1, ENDING_THRESHOLDS.collapseCycle - 1);
  return (state.cStagnantCivilizationStreak || 0) >= guard;
}

function updateEndingCandidate(endingId, context = {}, current = snapshot()) {
  if (!endingId) {
    state.endingCandidate = null;
    return;
  }

  const ending = endingCopyFor(endingId);
  state.endingCandidate = {
    id: endingId,
    name: ending.name,
    turn: state.turn,
    rand: Number.isFinite(Number(context.rand)) ? context.rand : state.lastRand,
    trigger: context.trigger || state.weather,
    snapshot: { ...current }
  };
}

function maybeFinishStagnantCivilizationCEnding(archived, current = snapshot(), rand = state.lastRand) {
  if (!updateStagnantCivilizationCEndingStreak(archived)) return false;

  finishGame("C", {
    kind: "stagnant-civilizations",
    trigger: `连续 ${C_STAGNANT_CIVILIZATION_STREAK} 代文明毁灭时科学峰值未突破青铜停滞阈值 ${formatNumber(C_BRONZE_ERA_SCIENCE_CAP)}`,
    rand,
    snapshot: current
  });
  return true;
}

function updateStagnantCivilizationCEndingStreak(archived) {
  if (state.finished || state.endingCandidate?.id) {
    state.cStagnantCivilizationStreak = 0;
    return false;
  }

  if (!isStagnantCivilization(archived)) {
    state.cStagnantCivilizationStreak = 0;
    return false;
  }

  state.cStagnantCivilizationStreak = Math.min(
    C_STAGNANT_CIVILIZATION_STREAK,
    Math.max(0, Math.round(state.cStagnantCivilizationStreak || 0)) + 1
  );
  return state.cStagnantCivilizationStreak >= C_STAGNANT_CIVILIZATION_STREAK;
}

function isStagnantCivilization(archived) {
  if (!archived || archived.turns < 1) return false;

  const peakSc = finiteOr(archived.peakSc, 0);
  return peakSc < C_BRONZE_ERA_SCIENCE_CAP;
}

function currentCivilizationReachedLaCap() {
  return Boolean(state.currentCivilization?.hadLaCap || state.la >= J_MEMORY_LA_THRESHOLD);
}

function currentCivilizationEnteredAnarchy() {
  return state.stability < I_LOW_ORDER_THRESHOLD;
}

function currentInclusiveLaMemoryStreak() {
  const completed = Math.max(0, Math.round(finiteOr(state.laMemoryCivilizationStreak, 0)));
  return clamp(completed + (currentCivilizationReachedLaCap() ? 1 : 0), 0, J_MEMORY_CIVILIZATION_STREAK);
}

function currentInclusiveLowOrderStreak() {
  const completed = Math.max(0, Math.round(finiteOr(state.lowOrderCivilizationStreak, 0)));
  return clamp(completed + (currentCivilizationEnteredAnarchy() ? 1 : 0), 0, I_LOW_ORDER_CIVILIZATION_STREAK);
}

function maybeFinishCivilizationStreakEnding(archived, current = snapshot(), rand = state.lastRand) {
  const endingId = updateCivilizationStreakEndings(archived);
  if (!endingId) return false;

  finishGame(endingId, {
    kind: "civilization-streak",
    trigger: civilizationStreakEndingTrigger(endingId),
    rand,
    snapshot: current
  });
  return true;
}

function updateCivilizationStreakEndings(archived) {
  const reachedMemoryCap = didCivilizationReachLaCap(archived);
  const enteredAnarchy = didCivilizationEnterAnarchy(archived);

  state.laMemoryCivilizationStreak = reachedMemoryCap
    ? Math.min(J_MEMORY_CIVILIZATION_STREAK, Math.max(0, Math.round(state.laMemoryCivilizationStreak || 0)) + 1)
    : 0;
  state.lowOrderCivilizationStreak = enteredAnarchy
    ? Math.min(I_LOW_ORDER_CIVILIZATION_STREAK, Math.max(0, Math.round(state.lowOrderCivilizationStreak || 0)) + 1)
    : 0;

  if (state.laMemoryCivilizationStreak >= J_MEMORY_CIVILIZATION_STREAK) return "J";
  if (state.lowOrderCivilizationStreak >= I_LOW_ORDER_CIVILIZATION_STREAK) return "I";
  return null;
}

function didCivilizationReachLaCap(archived) {
  return Boolean(archived?.hadLaCap || finiteOr(archived?.peakLa, 0) >= J_MEMORY_LA_THRESHOLD);
}

function didCivilizationEnterAnarchy(archived) {
  const finalOrder = finiteOr(archived?.finalSnapshot?.stability, finiteOr(archived?.peakStability, 100));
  return finalOrder < I_LOW_ORDER_THRESHOLD;
}

function civilizationStreakEndingTrigger(endingId) {
  if (endingId === "I") {
    return `连续 ${I_LOW_ORDER_CIVILIZATION_STREAK} 代文明以无政府秩序收束（低于 ${I_LOW_ORDER_THRESHOLD}）`;
  }
  if (endingId === "J") {
    return `连续 ${J_MEMORY_CIVILIZATION_STREAK} 代文明曾使 LA 达到 ${formatNumber(J_MEMORY_LA_THRESHOLD)}`;
  }
  return state.weather;
}

function resolveAutomaticEnding(context = {}, current = snapshot()) {
  if (state.mapUiExpanded !== false && isNationExtinct()) return "L";
  if (currentInclusiveLaMemoryStreak() >= J_MEMORY_CIVILIZATION_STREAK) return "J";
  if (currentInclusiveLowOrderStreak() >= I_LOW_ORDER_CIVILIZATION_STREAK) return "I";
  const scienceAtCap = current.sc >= CAP;
  const beliefAtCap = current.be >= CAP;
  if (scienceAtCap && !beliefAtCap) return "A";
  if (beliefAtCap && !scienceAtCap) return "B";

  return null;
}

function automaticEndingTrigger(endingId, context = {}) {
  if (endingId === "A") return "科学抵达上限";
  if (endingId === "B") return "神学抵达上限";
  return context.trigger || state.weather;
}

function settleCurrentEnding() {
  if (state.awaitingCivilizationRestart) return false;
  if (!state.endingCandidate?.id) return false;

  finishGame(state.endingCandidate.id, {
    kind: "settlement",
    trigger: `手动结算：${state.endingCandidate.trigger || state.endingCandidate.name}`,
    rand: state.endingCandidate.rand,
    snapshot: state.endingCandidate.snapshot || snapshot()
  });
  return true;
}

function finishGame(endingId, context = {}) {
  if (state.finished) return;
  state.autoRunUntilCollapse = false;
  cancelAutoRun();

  const ending = endingCopyFor(endingId);
  const finalSnapshot = context.snapshot || snapshot();
  const endingStats = recordEndingCompletion(endingId);
  state.finished = true;
  state.finalEnding = {
    id: endingId,
    name: ending.name,
    realmName: state.realmName || DEFAULT_REALM_NAME,
    governorId: normalizeGovernorId(state.governorId),
    governorLabel: GOVERNORS[normalizeGovernorId(state.governorId)].label,
    difficulty: normalizeDifficulty(state.difficulty),
    aiAggression: normalizeAiAggression(state.aiAggression),
    mapUiExpanded: state.mapUiExpanded !== false,
    seed: state.seed,
    civilization: state.count,
    turn: state.turn,
    rand: Number.isFinite(Number(context.rand)) ? context.rand : state.lastRand,
    trigger: context.trigger || state.weather,
    snapshot: { ...finalSnapshot },
    peakSnapshot: runPeakSnapshot(finalSnapshot),
    metricArchive: buildMetricArchive(finalSnapshot),
    mapArchive: buildMapArchive(),
    military: { ...militaryStats(finalSnapshot) },
    endingStats,
    createdAt: new Date().toISOString()
  };
  state.weather = context.trigger || state.weather;
  state.ending = `${ending.name}已经抵达`;
  addLog({
    type: "special",
    title: `${ending.name}｜终局达成`,
    text: `第 ${state.count} 号文明在 ${state.finalEnding.trigger || "未知触发"} 后抵达终局。游戏结束。终局统计已更新。`,
    delta: diff(finalSnapshot, finalSnapshot)
  });
  saveFinalEnding();
  clearSavedRun();
  goToEndingPage(endingId);
}

function runPeakSnapshot(finalSnapshot = snapshot()) {
  const peak = {
    sc: finiteOr(finalSnapshot.sc, 0),
    be: finiteOr(finalSnapshot.be, 0),
    la: finiteOr(finalSnapshot.la, 0),
    pop: finiteOr(finalSnapshot.pop, 0),
    eco: finiteOr(finalSnapshot.eco, 0),
    eerf: finiteOr(finalSnapshot.eerf, state.eerfLevel || 0),
    stability: finiteOr(finalSnapshot.stability, state.stability)
  };

  const records = [
    ...(Array.isArray(state.history) ? state.history : []),
    state.currentCivilization
  ].filter(Boolean);

  records.forEach((entry) => {
    peak.sc = Math.max(peak.sc, finiteOr(entry.peakSc, peak.sc));
    peak.be = Math.max(peak.be, finiteOr(entry.peakBe, peak.be));
    peak.la = Math.max(peak.la, finiteOr(entry.peakLa, peak.la));
    peak.pop = Math.max(peak.pop, finiteOr(entry.peakPop, peak.pop));
    peak.eco = Math.max(peak.eco, finiteOr(entry.peakEco, peak.eco));
    peak.eerf = Math.max(peak.eerf, finiteOr(entry.peakEerf, peak.eerf));
    peak.stability = Math.max(peak.stability, finiteOr(entry.peakStability, peak.stability));
  });

  return peak;
}

function buildMetricArchive(finalSnapshot = snapshot()) {
  const currentStats = {
    ...(state.currentCivilization || createCivilizationStats(state.count, state.turn, finalSnapshot)),
    finalSnapshot: { ...finalSnapshot },
    metricSamples: Array.isArray(state.currentCivilization?.metricSamples)
      ? state.currentCivilization.metricSamples.slice(-CIVILIZATION_SAMPLE_LIMIT)
      : normalizedMetricSamples()
  };
  const records = [
    ...(Array.isArray(state.history) ? state.history : []),
    currentStats
  ].filter(Boolean);

  return records.slice(0, FINAL_METRIC_ARCHIVE_LIMIT).map((entry) => ({
    civilization: Math.max(1, Math.round(finiteOr(entry.civilization, 1))),
    turns: Math.max(0, Math.round(finiteOr(entry.turns, 0))),
    collapseCause: String(entry.collapseCause || ""),
    ending: String(entry.ending || ""),
    samples: Array.isArray(entry.metricSamples)
      ? entry.metricSamples.slice(-CIVILIZATION_SAMPLE_LIMIT).map((sample) => normalizeMetricSample(sample))
      : []
  }));
}

function buildMapArchive() {
  ensureMilitaryMapState();
  return {
    status: mapStrategicStatus(),
    counts: mapOwnerCounts(),
    seed: state.map.seed || state.seed,
    realmName: state.realmName || DEFAULT_REALM_NAME,
    difficulty: normalizeDifficulty(state.difficulty),
    aiAggression: normalizeAiAggression(state.aiAggression),
    lastEvent: state.map?.lastEvent || null,
    layout: state.map?.layout || {},
    roads: activeMapRoads().map((road) => ({ ...road })),
    entities: politicalEntities().map((entity) => ({
      ...entity,
      territories: entityRegions(entity.id).length,
      force: entityMilitaryForce(entity.id)
    })),
    regions: state.map.regions.map((region) => {
      const definition = mapRegionById(region.id);
      return {
        id: region.id,
        name: definition?.name || region.id,
        owner: mapRegionOwner(region),
        controllerId: region.controllerId,
        controllerName: politicalEntityById(region.controllerId)?.name || "未知政权",
        fortification: clamp(Math.round(finiteOr(region.fortification, definition?.strength || 50)), 5, 140)
      };
    }),
    armies: armies().map((army) => ({ ...army }))
  };
}

function endingCopyFor(endingId) {
  return window.THREE_SUN_ENDINGS?.[endingId] || {
    name: `${endingId}结局`,
    paragraphs: ["终局资料缺失。"],
    quote: ""
  };
}

function saveFinalEnding() {
  try {
    localStorage.setItem(ENDING_STORE_KEY, JSON.stringify(state.finalEnding));
  } catch {
    // The ending page can still render from the query string.
  }
}

function clearStoredEnding() {
  try {
    localStorage.removeItem(ENDING_STORE_KEY);
  } catch {
    // Storage may be unavailable in private contexts.
  }
}

function clearSavedRun() {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    // Storage may be unavailable in private contexts.
  }
}

function goToEndingPage(endingId) {
  const url = new URL(ENDING_PAGE, window.location.href);
  url.searchParams.set("ending", endingId);
  window.location.href = url.href;
}

function addLog(entry) {
  state.log.unshift(entry);
  state.log = state.log.slice(0, 80);
}

function snapshot() {
  return {
    sc: state.sc,
    be: state.be,
    la: state.la || 0,
    pop: state.pop,
    eco: state.eco,
    eerf: state.eerfLevel || 0,
    stability: state.stability
  };
}

function snapshotForObject(source) {
  return {
    sc: finiteOr(source.sc, 0),
    be: finiteOr(source.be, 0),
    la: finiteOr(source.la, 0),
    pop: finiteOr(source.pop, 0),
    eco: finiteOr(source.eco, 0),
    eerf: finiteOr(source.eerf ?? source.eerfLevel, 0),
    stability: finiteOr(source.stability, 0)
  };
}

function diff(before, after) {
  return {
    sc: after.sc - before.sc,
    be: after.be - before.be,
    la: after.la - before.la,
    pop: after.pop - before.pop,
    eco: after.eco - before.eco,
    eerf: after.eerf - before.eerf,
    stability: after.stability - before.stability
  };
}

function createMetricSample(turn, civilization, snapshotValue, options = {}) {
  return {
    turn: Math.max(0, Math.round(finiteOr(turn, 0))),
    civilization: Math.max(1, Math.round(finiteOr(civilization, 1))),
    sc: clamp(roundStat(finiteOr(snapshotValue.sc, 0)), 0, CAP),
    be: clamp(roundStat(finiteOr(snapshotValue.be, 0)), 0, CAP),
    la: clamp(Math.floor(finiteOr(snapshotValue.la, 0)), 0, LA_CAP),
    pop: Math.max(0, Math.round(finiteOr(snapshotValue.pop, 0))),
    eco: Math.max(0, Math.round(finiteOr(snapshotValue.eco, 0))),
    stability: clamp(Math.round(finiteOr(snapshotValue.stability, 0)), 0, 100),
    eerf: clamp(Math.round(finiteOr(snapshotValue.eerf ?? snapshotValue.eerfLevel, 0)), 0, EERF_MAX_LEVEL),
    collapse: options.collapse ? String(options.collapse) : "",
    label: options.label ? String(options.label) : ""
  };
}

function recordMetricSample(options = {}) {
  if (!state) return;
  if (!Array.isArray(state.metricSamples)) state.metricSamples = [];

  const sample = createMetricSample(state.turn, state.count, snapshot(), options);
  const last = state.metricSamples[state.metricSamples.length - 1];
  if (
    last &&
    last.turn === sample.turn &&
    last.civilization === sample.civilization &&
    Boolean(last.collapse) === Boolean(sample.collapse)
  ) {
    state.metricSamples[state.metricSamples.length - 1] = sample;
  } else {
    state.metricSamples.push(sample);
  }
  state.metricSamples = state.metricSamples.slice(-METRIC_SAMPLE_LIMIT);
  recordCivilizationMetricSample(sample);
}

function updateMetricTrends(delta = {}) {
  state.metricTrends = {
    sc: Math.round(finiteOr(delta.sc, 0)),
    be: Math.round(finiteOr(delta.be, 0)),
    la: Math.round(finiteOr(delta.la, 0)),
    pop: Math.round(finiteOr(delta.pop, 0)),
    eco: Math.round(finiteOr(delta.eco, 0)),
    stability: Math.round(finiteOr(delta.stability, 0))
  };
}

function recordCivilizationMetricSample(sample) {
  if (!state.currentCivilization) return;
  if (!Array.isArray(state.currentCivilization.metricSamples)) {
    state.currentCivilization.metricSamples = [];
  }
  const last = state.currentCivilization.metricSamples[state.currentCivilization.metricSamples.length - 1];
  if (
    last &&
    last.turn === sample.turn &&
    Boolean(last.collapse) === Boolean(sample.collapse)
  ) {
    state.currentCivilization.metricSamples[state.currentCivilization.metricSamples.length - 1] = sample;
  } else {
    state.currentCivilization.metricSamples.push(sample);
  }
  state.currentCivilization.metricSamples = state.currentCivilization.metricSamples.slice(-CIVILIZATION_SAMPLE_LIMIT);
}

function scienceEra(value) {
  return eraNameFor(value, SCIENCE_ERAS);
}

function beliefEra(value) {
  return eraNameFor(value, BELIEF_ERAS);
}

function orderRegime(value) {
  const order = clamp(Math.round(finiteOr(value, 0)), 0, 100);
  if (order < 20) return "无政府";
  if (order < 40) return "封建";
  if (order < 60) return "君主立宪";
  if (order < 80) return "资本主义";
  return "极权国家";
}

function eraNameFor(value, eras) {
  return eras[eraIndexFor(value, eras)]?.name || eras[0].name;
}

function eraIndexFor(value, eras) {
  let index = 0;
  for (let cursor = 0; cursor < eras.length; cursor += 1) {
    if (value >= eras[cursor].threshold) {
      index = cursor;
    }
  }
  return index;
}

function renderSetup() {
  const setupComplete = Boolean(state?.setupComplete);
  if (dom.setupPanel) dom.setupPanel.hidden = setupComplete;
  if (dom.gamePanel) dom.gamePanel.hidden = !setupComplete;
  if (dom.realmIdentity) {
    dom.realmIdentity.textContent = `${state?.realmName || DEFAULT_REALM_NAME}｜${difficultyConfig(state?.difficulty).label}｜AI ${aiAggressionConfig(state?.aiAggression).label}`;
  }
  const governor = GOVERNORS[normalizeGovernorId(state?.governorId)];
  if (dom.activeGovernorPortrait) {
    dom.activeGovernorPortrait.src = governor.image;
    dom.activeGovernorPortrait.alt = `${governor.label}像`;
  }
  if (dom.activeGovernorName) dom.activeGovernorName.textContent = governor.label;
  if (setupComplete) return;

  const stage = ["difficulty", "governor", "territory"].includes(state?.setupStage)
    ? state.setupStage
    : "name";
  if (dom.realmNameForm) dom.realmNameForm.hidden = stage !== "name";
  if (dom.setupQuote) dom.setupQuote.hidden = stage !== "name";
  if (dom.difficultyStep) dom.difficultyStep.hidden = stage !== "difficulty";
  if (dom.governorStep) dom.governorStep.hidden = stage !== "governor";
  if (dom.territoryStep) dom.territoryStep.hidden = stage !== "territory";
  if (dom.realmNameInput && document.activeElement !== dom.realmNameInput) {
    dom.realmNameInput.value = state?.realmName || "";
  }
  if (dom.seedInput && document.activeElement !== dom.seedInput) {
    dom.seedInput.value = String(state?.seed || "");
  }
  if (dom.setupRealmPreview) dom.setupRealmPreview.textContent = state?.realmName || DEFAULT_REALM_NAME;
  dom.difficultyButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.difficulty === normalizeDifficulty(state?.difficulty) ? "true" : "false");
  });
  dom.aggressionButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.aggression === normalizeAiAggression(state?.aiAggression) ? "true" : "false");
  });
  dom.governorButtons.forEach((button) => {
    const governorId = normalizeGovernorId(button.dataset.governor);
    const governor = GOVERNORS[governorId];
    button.setAttribute("aria-pressed", governorId === normalizeGovernorId(state?.governorId) ? "true" : "false");
    const name = button.querySelector("strong");
    const caption = button.querySelector(".governor-caption");
    const skill = button.querySelector(".governor-skill");
    if (name) name.textContent = governor.label;
    if (caption) caption.textContent = governor.caption;
    if (skill) skill.textContent = governor.skill;
    button.title = `${governor.caption}\n${governor.skill}`;
  });
  dom.mapModeButtons.forEach((button) => {
    const mode = state?.mapUiExpanded === false ? "collapsed" : "expanded";
    button.setAttribute("aria-pressed", button.dataset.mapMode === mode ? "true" : "false");
  });
  if (stage === "territory") renderStartingRegionPicker();
}

function renderStartingRegionPicker() {
  if (!dom.startRegionMap) return;
  const selectedId = normalizeStartingRegionId(state.startingRegionId);
  const selectedDefinition = mapRegionById(selectedId);
  const selectedState = mapStateRegion(selectedId);
  if (dom.startRegionName) dom.startRegionName.textContent = selectedDefinition?.name || "中央盆地";
  if (dom.startRegionDescription) {
    const terrain = BALANCE_MODEL?.terrainProfile(selectedDefinition?.terrain || "plain", state.governorId);
    dom.startRegionDescription.textContent = `${terrain?.label || terrainLabel(selectedDefinition?.terrain)}｜攻 ${formatSignedNumber(terrain?.attack || 0)}｜防 ${formatSignedNumber(terrain?.defense || 0)}｜基础工事 ${formatNumber(selectedState?.fortification || selectedDefinition?.strength || 0)}｜将生成五块连通初始疆域`;
  }

  dom.startRegionMap.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "start-region-svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  MAP_REGIONS.forEach((definition) => {
    const layout = mapLayoutRegion(definition.id);
    if (!layout) return;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("class", `start-region${definition.id === selectedId ? " is-selected" : ""}`);
    group.setAttribute("data-start-region", definition.id);
    group.setAttribute("role", "button");
    group.setAttribute("tabindex", "0");
    group.setAttribute("aria-label", `${definition.name}，${terrainLabel(definition.terrain)}`);
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", layout.points.map((point) => `${point.x},${point.y}`).join(" "));
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", layout.centerX);
    label.setAttribute("y", layout.centerY + 0.8);
    label.textContent = definition.name;
    group.append(polygon, label);
    svg.append(group);
  });
  dom.startRegionMap.append(svg);
}

function render() {
  renderSetup();
  if (!state.setupComplete) return;
  dom.countValue.textContent = state.count;
  dom.turnValue.textContent = state.turn;
  dom.randValue.textContent = state.lastRand === null ? "----" : formatRand(state.lastRand);
  dom.scValue.textContent = formatNumber(state.sc);
  dom.beValue.textContent = formatNumber(state.be);
  if (dom.laValue) dom.laValue.textContent = formatNumber(state.la || 0);
  dom.popValue.textContent = formatNumber(state.pop);
  dom.ecoValue.textContent = formatNumber(state.eco);
  dom.eerfValue.textContent = `${state.eerfLevel || 0}/${EERF_MAX_LEVEL}`;
  dom.scMeter.style.width = `${(state.sc / CAP) * 100}%`;
  dom.beMeter.style.width = `${(state.be / CAP) * 100}%`;
  if (dom.laMeter) dom.laMeter.style.width = `${((state.la || 0) / LA_CAP) * 100}%`;
  dom.popMeter.style.width = `${Math.min(100, Math.sqrt(state.pop / 180000) * 100)}%`;
  dom.ecoMeter.style.width = `${Math.min(100, Math.sqrt(state.eco / ECO_METER_CAP) * 100)}%`;
  dom.eerfMeter.style.width = `${((state.eerfLevel || 0) / EERF_MAX_LEVEL) * 100}%`;
  dom.scEra.textContent = scienceEra(state.sc);
  dom.beEra.textContent = beliefEra(state.be);
  renderTrendStatus();
  renderMapExpansionMode();
  dom.stabilityValue.textContent = `秩序 ${state.stability}｜${orderRegime(state.stability)}`;
  dom.ecoStatus.textContent = isEconomicCrisis() ? "经济危机：发展冻结" : "预算、产业与粮仓";
  dom.eerfStatus.textContent = eerfStatusText();
  if (dom.laStatus) dom.laStatus.textContent = laStatusText();
  dom.weatherLabel.textContent = state.weather;
  dom.endingLabel.textContent = state.ending;
  renderEndingWatch();
  renderEerfDetails();
  renderEndingStats();
  renderActionButtons();
  renderMap();
  renderLog();
  renderArchive();
  renderSpecialNotice();
}

function renderActionButtons() {
  dom.actionButtons.forEach((button) => {
    const action = ACTIONS[button.dataset.action];
    const reason = actionDisabledReason(action);
    const disabled = Boolean(reason);
    const reasonNode = button.querySelector(".disabled-reason");
    if (reasonNode) reasonNode.textContent = reason;
    const baseName = button.dataset.accessibleName || action?.label || "行动";
    button.title = reason ? `${baseName}：${reason}` : baseName;
    button.disabled = disabled;
    button.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}

function renderTrendStatus() {
  const scTrend = Math.round(finiteOr(state.scTrend, 0));
  const beTrend = Math.round(finiteOr(state.beTrend, 0));
  const scStage = knowledgeTrendStageFor(scTrend);
  const beStage = knowledgeTrendStageFor(beTrend);
  const trends = state.metricTrends || {};

  if (dom.scTrendValue) dom.scTrendValue.textContent = `${formatSignedNumber(scTrend)}/年`;
  if (dom.beTrendValue) dom.beTrendValue.textContent = `${formatSignedNumber(beTrend)}/年`;
  if (dom.scTrendStage) dom.scTrendStage.textContent = scStage.label;
  if (dom.beTrendStage) dom.beTrendStage.textContent = beStage.label;
  renderMetricTrend("pop", trends.pop, dom.popTrendValue, dom.popTrendStage);
  renderMetricTrend("eco", trends.eco, dom.ecoTrendValue, dom.ecoTrendStage);
  renderMetricTrend("la", trends.la, dom.laTrendValue, dom.laTrendStage);
  renderMetricTrend("stability", trends.stability, dom.orderTrendValue, dom.orderTrendStage);
}

function renderMetricTrend(key, value, valueNode, stageNode) {
  const trend = Math.round(finiteOr(value, 0));
  if (valueNode) valueNode.textContent = `${formatSignedNumber(trend)}/年`;
  if (stageNode) stageNode.textContent = metricTrendStageFor(key, trend);
}

function renderMap() {
  if (!dom.worldMap || state.mapUiExpanded === false) return;
  ensureMilitaryMapState();
  const counts = mapOwnerCounts();
  const visibleRegions = visibleMilitaryRegionIds();
  let activeArmy = selectedArmy();
  if (activeArmy?.entityId !== PLAYER_ENTITY_ID && !visibleRegions.has(activeArmy?.regionId)) {
    activeArmy = primaryPlayerArmy();
    state.selectedArmyId = activeArmy?.id || null;
  }
  const activeArmyStats = armyCombatStats(activeArmy);
  const availableRegionIds = activeArmy?.entityId === PLAYER_ENTITY_ID && activeArmy.lastMovedTurn < state.turn
    ? new Set(roadNeighbors(activeArmy.regionId))
    : new Set();
  dom.worldMap.innerHTML = "";
  const fragment = document.createDocumentFragment();

  const mapSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  mapSvg.setAttribute("class", "world-map-svg");
  mapSvg.setAttribute("viewBox", "0 0 100 100");
  mapSvg.setAttribute("preserveAspectRatio", "none");

  const definitions = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  politicalEntities().forEach((entity) => {
    const clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clip.setAttribute("id", `entity-clip-${entity.id}`);
    entityRegions(entity.id).forEach((regionState) => {
      const layout = mapLayoutRegion(regionState.id);
      if (!layout) return;
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("points", layout.points.map((point) => `${point.x},${point.y}`).join(" "));
      clip.append(polygon);
    });
    definitions.append(clip);
  });
  mapSvg.append(definitions);

  MAP_REGIONS.forEach((definition) => {
    const regionState = mapStateRegion(definition.id) || {
      owner: MAP_OWNER_NEUTRAL,
      controllerId: NEUTRAL_ENTITY_ID,
      fortification: definition.strength
    };
    const owner = mapRegionOwner(regionState);
    const entity = politicalEntityById(regionState.controllerId);
    const isHostileNeutral = owner === MAP_OWNER_NEUTRAL && entity?.relation === "hostile";
    const layout = mapLayoutRegion(definition.id);
    if (!layout) return;
    const region = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const classes = [
      "map-region",
      `owner-${owner}`,
      `entity-${regionState.controllerId}`,
      `terrain-${definition.terrain}`
    ];
    if (isHostileNeutral) classes.push("owner-hostile-neutral");
    if (availableRegionIds.has(definition.id)) classes.push("available-target");
    if (state.selectedRegionId === definition.id) classes.push("selected-region");
    if (activeArmy?.regionId === definition.id) classes.push("army-region");
    region.setAttribute("class", classes.join(" "));
    region.setAttribute("role", "button");
    region.setAttribute("tabindex", "0");
    region.setAttribute("data-region", definition.id);
    region.setAttribute("aria-label", `${definition.name}，${mapOwnerLabel(regionState)}，地块防御 ${formatNumber(regionState.fortification)}`);
    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("class", "map-territory");
    polygon.setAttribute("points", layout.points.map((point) => `${point.x},${point.y}`).join(" "));
    region.append(polygon);
    mapSvg.append(region);
  });

  activeMapRoads().forEach((road) => {
    const left = mapLayoutRegion(road.a);
    const right = mapLayoutRegion(road.b);
    if (!left || !right) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const available = activeArmy?.entityId === PLAYER_ENTITY_ID &&
      (activeArmy.regionId === road.a && availableRegionIds.has(road.b) ||
        activeArmy.regionId === road.b && availableRegionIds.has(road.a));
    path.setAttribute("class", available ? "map-road available" : "map-road");
    path.setAttribute(
      "d",
      `M ${left.centerX} ${left.centerY} Q ${road.bendX} ${road.bendY} ${right.centerX} ${right.centerY}`
    );
    mapSvg.append(path);
  });

  politicalEntities().forEach((entity) => {
    if (entity.eliminated) return;
    const geometry = entityMapLabelGeometry(entity.id);
    if (!geometry) return;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", `map-entity-name map-entity-name-${entity.owner}`);
    label.setAttribute("x", geometry.x);
    label.setAttribute("y", geometry.y);
    label.setAttribute("textLength", geometry.width);
    label.setAttribute("lengthAdjust", "spacingAndGlyphs");
    label.setAttribute("clip-path", `url(#entity-clip-${entity.id})`);
    label.textContent = entity.name;
    mapSvg.append(label);
  });

  MAP_REGIONS.forEach((definition) => {
    const layout = mapLayoutRegion(definition.id);
    const regionState = mapStateRegion(definition.id);
    if (!layout || !regionState) return;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "map-region-label");
    label.setAttribute("x", layout.centerX);
    label.setAttribute("y", layout.centerY - 0.6);
    const nameLine = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    nameLine.setAttribute("x", layout.centerX);
    nameLine.textContent = definition.name;
    const metaLine = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    metaLine.setAttribute("class", "map-region-meta");
    metaLine.setAttribute("x", layout.centerX);
    metaLine.setAttribute("dy", "2.8");
    metaLine.textContent = `${terrainLabel(definition.terrain)} · 防 ${formatNumber(regionState.fortification)}`;
    label.append(nameLine, metaLine);
    mapSvg.append(label);
  });
  fragment.append(mapSvg);

  const regionArmyCounts = new Map();
  armies().forEach((army) => {
    if (army.force <= 0) return;
    if (army.entityId !== PLAYER_ENTITY_ID && !visibleRegions.has(army.regionId)) return;
    const layout = mapLayoutRegion(army.regionId);
    if (!layout) return;
    const offsetIndex = regionArmyCounts.get(army.regionId) || 0;
    regionArmyCounts.set(army.regionId, offsetIndex + 1);
    const entity = politicalEntityById(army.entityId);
    const owner = armyOwner(army);
    const token = document.createElement("button");
    token.type = "button";
    token.className = `army-token army-${owner}${owner === MAP_OWNER_NEUTRAL && entity?.relation === "hostile" ? " army-hostile-neutral" : ""}`;
    token.style.left = `${layout.centerX + 5 + offsetIndex * 3.5}%`;
    token.style.top = `${layout.centerY + 5}%`;
    token.dataset.army = army.id;
    const stats = armyCombatStats(army);
    const power = militaryPowerSummary(stats);
    const tier = document.createElement("strong");
    tier.textContent = power.tier;
    const force = document.createElement("small");
    force.textContent = compactArmyForce(army.force);
    token.append(tier, force);
    token.title = `${army.name}｜${entity?.name || "未知阵营"}｜兵力 ${formatNumber(army.force)}｜战斗力 ${power.tier}（${formatNumber(power.score)}）`;
    token.setAttribute("aria-label", token.title);
    token.setAttribute("aria-pressed", army.id === activeArmy?.id ? "true" : "false");
    fragment.append(token);
  });

  dom.worldMap.append(fragment);
  if (dom.mapStatus) {
    const intel = hasFullMilitaryIntel() ? "全域监听" : `可见 ${formatNumber(visibleRegions.size)}/${formatNumber(MAP_REGIONS.length)}`;
    dom.mapStatus.textContent = `Seed ${state.seed}｜${difficultyConfig().label}｜AI ${aiAggressionConfig().label}｜${intel}｜本国 ${formatNumber(counts.player)}｜中立 ${formatNumber(counts.neutral)}｜敌国 ${formatNumber(counts.rival)}｜${mapStrategicStatus(counts)}`;
  }
  const activeEntity = politicalEntityById(activeArmy?.entityId);
  const activeRegion = mapRegionById(activeArmy?.regionId);
  if (dom.selectedArmyName) dom.selectedArmyName.textContent = activeArmy?.name || "未选择";
  if (dom.selectedArmyOwner) dom.selectedArmyOwner.textContent = activeEntity?.name || "未知";
  if (dom.selectedArmyRegion) dom.selectedArmyRegion.textContent = activeRegion?.name || "无驻地";
  if (dom.militaryForceValue) dom.militaryForceValue.textContent = formatNumber(activeArmyStats.force);
  if (dom.militaryAttackValue) dom.militaryAttackValue.textContent = formatNumber(activeArmyStats.attack);
  if (dom.militaryDefenseValue) dom.militaryDefenseValue.textContent = formatNumber(activeArmyStats.defense);
  if (dom.militaryTechnologyValue) dom.militaryTechnologyValue.textContent = formatSignedNumber(militaryTechnologyBonus(activeArmy));
  if (dom.militaryPowerValue) {
    const power = militaryPowerSummary(activeArmyStats);
    dom.militaryPowerValue.textContent = `${power.tier} / ${formatNumber(power.score)}`;
  }
  if (dom.frontierValue) dom.frontierValue.textContent = `${formatNumber(counts.player)}/${formatNumber(counts.neutral)}/${formatNumber(counts.rival)}`;
  if (dom.deploymentHint) {
    dom.deploymentHint.textContent = deploymentHintFor(activeArmy);
  }
  if (dom.mapFeed) {
    const event = state.map?.lastEvent || state.military?.lastBattle;
    const eventVisible = !event?.regionId || canObserveMilitaryAt(event.regionId);
    dom.mapFeed.textContent = event && eventVisible
      ? `${event.title}：${event.text}`
      : event ? "战争迷雾：边境之外的军事动向无法确认。" : MAP_EVENT_NONE;
  }
  renderRegionIntel();
  renderPoliticalEntityPanel();
}

function entityMapLabelGeometry(entityId) {
  const layouts = entityRegions(entityId)
    .map((region) => mapLayoutRegion(region.id))
    .filter(Boolean);
  if (!layouts.length) return null;
  const points = layouts.flatMap((layout) => layout.points || []);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  return {
    x: roundMapCoordinate((minX + maxX) / 2),
    y: roundMapCoordinate((minY + maxY) / 2),
    width: roundMapCoordinate(clamp((maxX - minX) * 0.78, 10, 62))
  };
}

function terrainLabel(terrain) {
  return BALANCE_MODEL?.TERRAIN_EFFECTS?.[terrain]?.label || "未知地形";
}

function terrainCombatProfile(regionOrId, army = null) {
  const regionId = typeof regionOrId === "string" ? regionOrId : regionOrId?.id;
  const definition = mapRegionById(regionId);
  const governorId = army?.entityId === PLAYER_ENTITY_ID ? state.governorId : null;
  return BALANCE_MODEL?.terrainProfile(definition?.terrain || "plain", governorId) || {
    label: terrainLabel(definition?.terrain),
    attack: 0,
    defense: 0,
    attrition: 1
  };
}

function terrainCombatText(regionOrId, army = null) {
  const profile = terrainCombatProfile(regionOrId, army);
  return `${profile.label}｜攻 ${formatSignedNumber(profile.attack)}｜防 ${formatSignedNumber(profile.defense)}`;
}

function compactArmyForce(value) {
  const force = Math.max(0, finiteOr(value, 0));
  if (force >= 10000) return `${Math.round(force / 1000)}k`;
  if (force >= 1000) return `${(force / 1000).toFixed(1)}k`;
  return String(Math.round(force));
}

function militaryPowerSummary(stats = {}) {
  const score = Math.max(0, Math.round(
    finiteOr(stats.attack, 0) * 0.58 +
      finiteOr(stats.defense, 0) * 0.42 +
      finiteOr(stats.force, 0) / 2200
  ));
  const tier = score >= 95 ? "V" : score >= 75 ? "IV" : score >= 55 ? "III" : score >= 35 ? "II" : "I";
  return { score, tier };
}

function renderRegionIntel() {
  const selected = mapStateRegion(state.selectedRegionId) || mapStateRegion(selectedArmy()?.regionId) || state.map?.regions?.[0];
  if (!selected) return;
  state.selectedRegionId = selected.id;
  const definition = mapRegionById(selected.id);
  const stationed = armiesAtRegion(selected.id);
  const militaryVisible = selected.controllerId === PLAYER_ENTITY_ID || canObserveMilitaryAt(selected.id);
  if (dom.selectedRegionName) dom.selectedRegionName.textContent = definition?.name || selected.id;
  if (dom.selectedRegionTerrain) dom.selectedRegionTerrain.textContent = terrainCombatText(selected, primaryPlayerArmy());
  if (dom.selectedRegionController) dom.selectedRegionController.textContent = politicalEntityById(selected.controllerId)?.name || "无主地";
  if (dom.selectedRegionDefense) dom.selectedRegionDefense.textContent = formatNumber(selected.fortification);
  if (dom.selectedRegionRoads) dom.selectedRegionRoads.textContent = formatNumber(roadNeighbors(selected.id).length);
  if (dom.selectedRegionArmies) {
    dom.selectedRegionArmies.textContent = !militaryVisible
      ? "战争迷雾"
      : stationed.length
      ? stationed.map((army) => `${army.name} ${compactArmyForce(army.force)} / ${militaryPowerSummary(armyCombatStats(army)).tier}`).join("；")
      : "无";
  }
  if (dom.deployArmyButton) {
    const army = selectedArmy();
    const reason = deploymentDisabledReason(army, selected);
    dom.deployArmyButton.disabled = Boolean(reason);
    dom.deployArmyButton.textContent = mapRegionOwner(selected) === MAP_OWNER_PLAYER ? "部署防御" : "发起进攻";
    dom.deployArmyButton.title = reason || `将${army?.name || "选中军队"}部署至${definition?.name || selected.id}`;
  }
}

function deploymentDisabledReason(army, target) {
  if (!army || army.entityId !== PLAYER_ENTITY_ID) return "仅可部署本国军队";
  if (army.force <= 0) return "军队已经失去战斗力";
  if (army.lastMovedTurn >= state.turn) return "军队本年已经部署";
  if (!target) return "尚未选择地块";
  if (target.id !== army.regionId && !regionsShareRoad(army.regionId, target.id)) return "道路不通";
  return "";
}

function renderPoliticalEntityPanel() {
  const selected = selectedPoliticalEntity();
  if (dom.entityCards) {
    dom.entityCards.innerHTML = "";
    const fragment = document.createDocumentFragment();
    politicalEntities().forEach((entity) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `entity-card entity-card-${entity.owner}${entity.eliminated ? " is-eliminated" : ""}`;
      button.dataset.entity = entity.id;
      button.setAttribute("aria-pressed", entity.id === selected?.id ? "true" : "false");
      const name = document.createElement("strong");
      name.textContent = entity.name;
      const summary = document.createElement("small");
      summary.textContent = entity.eliminated
        ? "已灭亡"
        : `${politicalStrategyConfig(entity.strategy).label} · ${formatNumber(entityRegions(entity.id).length)} 地区`;
      button.append(name, summary);
      fragment.append(button);
    });
    dom.entityCards.append(fragment);
  }

  if (!selected) return;
  if (dom.entityPanelName) dom.entityPanelName.textContent = selected.name;
  if (dom.entityRelationValue) dom.entityRelationValue.textContent = entityRelationLabel(selected);
  if (dom.entityTerritoryValue) dom.entityTerritoryValue.textContent = formatNumber(entityRegions(selected.id).length);
  if (dom.entityForceValue) {
    const forceVisible = selected.id === PLAYER_ENTITY_ID || hasFullMilitaryIntel() || entityArmies(selected.id).some((army) => canObserveMilitaryAt(army.regionId));
    dom.entityForceValue.textContent = forceVisible ? formatNumber(entityMilitaryForce(selected.id)) : "???";
  }
  if (dom.entityDevelopmentValue) dom.entityDevelopmentValue.textContent = formatNumber(selected.development);
  if (dom.entityTechnologyValue) dom.entityTechnologyValue.textContent = formatNumber(selected.technology);
  if (dom.entityStrategySelect) {
    dom.entityStrategySelect.value = normalizePoliticalStrategy(selected.strategy);
    dom.entityStrategySelect.disabled = selected.id !== PLAYER_ENTITY_ID || selected.eliminated;
  }
  if (dom.entityStrategyText) {
    const config = politicalStrategyConfig(selected.strategy);
    dom.entityStrategyText.textContent = selected.eliminated ? "该政治实体已经灭亡。" : config.description;
  }
}

function entityRelationLabel(entity) {
  if (entity.eliminated) return "灭亡";
  if (entity.owner === MAP_OWNER_PLAYER) return "本国";
  if (entity.relation === "hostile") return "敌对";
  return "中立";
}

function deploymentHintFor(army) {
  if (!army) return "选择一支军队查看状态。";
  if (army.entityId !== PLAYER_ENTITY_ID) return "该军队仅供观察，目前不能直接指挥。";
  if (army.lastMovedTurn >= state.turn) return "这支军队本年已经部署。推进一年后可再次行动。";
  return "选择道路相连的地块查看情报，再用地块面板部署：己方为防御，其他地区为进攻。";
}

function mapOwnerLabel(regionOrOwner) {
  const region = regionOrOwner && typeof regionOrOwner === "object" ? regionOrOwner : null;
  const owner = region ? mapRegionOwner(region) : regionOrOwner;
  const entity = region ? politicalEntityById(region.controllerId) : null;
  if (entity) {
    const relation = entity.owner === MAP_OWNER_NEUTRAL && entity.relation === "hostile" ? "｜敌对" : "";
    return `${entity.name}${relation}`;
  }
  if (owner === MAP_OWNER_PLAYER) return "本国";
  if (owner === MAP_OWNER_RIVAL) return "敌国";
  if (owner === MAP_OWNER_RUINS) return "文明废墟";
  return "中立";
}

function mapStrategicStatus(counts = mapOwnerCounts()) {
  if (counts.player <= 0) return "国家灭亡";
  if (counts.player >= MAP_REGIONS.length) return "全图征服";
  if (counts.player <= 1) return "危急存亡";
  if (counts.rival <= 0) return "征服在望";
  return "边境拉锯";
}

function metricTrendStageFor(key, value) {
  const abs = Math.abs(finiteOr(value, 0));
  const sign = value > 0 ? 1 : value < 0 ? -1 : 0;
  const limits = {
    pop: [900, 2600, 7000],
    eco: [6000, 18000, 52000],
    la: [260, 760, 1800],
    stability: [2, 7, 14]
  }[key] || [1, 3, 8];

  if (sign === 0 || abs < limits[0]) return "平稳";
  const labels = sign > 0
    ? ["上扬", "扩张", "激增"]
    : ["下滑", "收缩", "崩落"];
  if (abs >= limits[2]) return labels[2];
  if (abs >= limits[1]) return labels[1];
  return labels[0];
}

function normalizedMetricSamples() {
  const samples = Array.isArray(state.metricSamples) ? state.metricSamples : [];
  if (!samples.length) {
    return [createMetricSample(state.turn, state.count, snapshot())];
  }
  return samples.slice(-METRIC_CHART_WINDOW).map((sample) => normalizeMetricSample(sample));
}

function normalizeMetricSample(sample = {}) {
  return {
    ...createMetricSample(sample.turn, sample.civilization, sample, sample),
    collapse: sample.collapse ? String(sample.collapse) : "",
    label: sample.label ? String(sample.label) : ""
  };
}

function renderEndingWatch() {
  if (!dom.endingWatchList) return;

  const watchItems = endingWatchItems();
  const featured = watchItems.filter((item) => ["K", "L"].includes(item.id));
  const items = [
    ...featured,
    ...watchItems.filter((item) => !["K", "L"].includes(item.id)).slice(0, 3)
  ];
  dom.endingWatchList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("li");
    empty.innerHTML = "<strong>暂无观测</strong><p>文明还没有足够数据形成终局判断。</p>";
    dom.endingWatchList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const row = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = `${item.id}｜${item.displayName}｜${formatPercent(item.progress)}`;
    const detail = document.createElement("p");
    detail.textContent = item.missing.length ? `还差：${item.missing.join("；")}` : "条件已满足，可结算。";
    row.append(title, detail);
    fragment.append(row);
  });
  dom.endingWatchList.append(fragment);
}

function endingWatchItems() {
  const current = snapshot();
  const thresholds = ENDING_THRESHOLDS;
  const harmony = knowledgeHarmony(current.sc, current.be);
  const collapseCount = state.history.length + (state.awaitingCivilizationRestart ? 1 : 0);
  const defs = [
    {
      id: "A",
      reqs: [
        singleLineCapRequirement("SC", current.sc, "BE", current.be)
      ]
    },
    {
      id: "B",
      reqs: [
        singleLineCapRequirement("BE", current.be, "SC", current.sc)
      ]
    },
    {
      id: "K",
      reqs: [
        minimumRequirement("控制区域", mapOwnerCounts().player, MAP_REGIONS.length),
        minimumRequirement("军力", militaryStats(current).force, thresholds.conquestForce)
      ]
    },
    {
      id: "L",
      reqs: [
        maximumRequirement("剩余区域", mapOwnerCounts().player, 0)
      ]
    },
    {
      id: "D",
      reqs: [
        minimumRequirement("SC", current.sc, thresholds.exodusKnowledge),
        maximumRequirement("BE", current.be, thresholds.companionKnowledge - 1),
        minimumRequirement("POP", current.pop, thresholds.exodusPopulation),
        minimumRequirement("ECO", current.eco, thresholds.exodusEconomy)
      ]
    },
    {
      id: "E",
      reqs: [
        minimumRequirement("BE", current.be, thresholds.exodusKnowledge),
        maximumRequirement("SC", current.sc, thresholds.companionKnowledge - 1),
        minimumRequirement("POP", current.pop, thresholds.exodusPopulation),
        minimumRequirement("秩序", current.stability, 58)
      ]
    },
    {
      id: "F",
      reqs: [
        minimumRequirement("SC", current.sc, thresholds.balancedKnowledge),
        minimumRequirement("BE", current.be, thresholds.balancedKnowledge),
        minimumRequirement("均衡度", harmony, 0.84, formatPercent)
      ]
    },
    {
      id: "G",
      reqs: [
        minimumRequirement("毁灭次数", collapseCount, thresholds.collapseCycle)
      ]
    },
    {
      id: "H",
      reqs: [
        minimumRequirement("SC", current.sc, thresholds.middleScience),
        maximumRequirement("SC 上限", current.sc, thresholds.exodusKnowledge - 1),
        maximumRequirement("BE", current.be, thresholds.lowKnowledge),
        minimumRequirement("秩序", current.stability, thresholds.orderHigh),
        minimumRequirement("POP", current.pop, thresholds.authoritarianPopulation)
      ]
    },
    {
      id: "I",
      reqs: [
        maximumRequirement("当前秩序", current.stability, I_LOW_ORDER_THRESHOLD - 1),
        minimumRequirement("低秩序文明连败", currentInclusiveLowOrderStreak(), I_LOW_ORDER_CIVILIZATION_STREAK)
      ]
    },
    {
      id: "J",
      reqs: [
        minimumRequirement("本代 LA", current.la, J_MEMORY_LA_THRESHOLD),
        minimumRequirement("记忆文明连胜", currentInclusiveLaMemoryStreak(), J_MEMORY_CIVILIZATION_STREAK)
      ]
    }
  ];

  return defs.filter((def) => state.mapUiExpanded !== false || !["K", "L"].includes(def.id)).map((def) => {
    const progress = def.reqs.reduce((sum, req) => sum + req.progress, 0) / def.reqs.length;
    return {
      id: def.id,
      name: shortEndingName(def.id),
      displayName: endingPreviewName(def.id),
      progress: clamp(progress, 0, 1),
      missing: def.reqs.filter((req) => !req.met).map((req) => req.missing)
    };
  }).sort((left, right) => {
    if (state.endingCandidate?.id === left.id) return -1;
    if (state.endingCandidate?.id === right.id) return 1;
    return right.progress - left.progress;
  });
}

function minimumRequirement(label, value, target, formatter = formatNumber) {
  const current = finiteOr(value, 0);
  const goal = Math.max(0.0001, finiteOr(target, 0));
  return {
    met: current >= goal,
    progress: clamp(current / goal, 0, 1),
    missing: `${label} ${formatter(Math.max(0, goal - current))}`
  };
}

function singleLineCapRequirement(primaryLabel, primaryValue, companionLabel, companionValue) {
  const primary = finiteOr(primaryValue, 0);
  const companion = finiteOr(companionValue, 0);
  const primaryAtCap = primary >= CAP;
  const companionAtCap = companion >= CAP;
  return {
    met: primaryAtCap && !companionAtCap,
    progress: companionAtCap ? 0.96 : clamp(primary / CAP, 0, 1),
    missing: companionAtCap
      ? `${companionLabel} 已同步封顶，转入双相判断`
      : `${primaryLabel} ${formatNumber(Math.max(0, CAP - primary))}`
  };
}

function maximumRequirement(label, value, maximum, formatter = formatNumber) {
  const current = finiteOr(value, 0);
  const cap = finiteOr(maximum, 0);
  return {
    met: current <= cap,
    progress: current <= cap ? 1 : clamp(cap / Math.max(current, 1), 0, 1),
    missing: `${label} 需降至 ${formatter(cap)} 以下`
  };
}

function shortEndingName(endingId) {
  const name = endingCopyFor(endingId).name || `${endingId}结局`;
  return name.split("/")[0] || name;
}

function endingPreviewName(endingId) {
  const summary = endingStatsSummary(state.endingStats);
  return (summary.endings[endingId] || 0) > 0 ? shortEndingName(endingId) : "???";
}

function renderEerfDetails() {
  if (!dom.eerfDetailList) return;

  const level = state.eerfLevel || 0;
  const rows = [];
  if (state.awaitingCivilizationRestart && state.pendingRestart) {
    rows.push(["状态", "等待重启文明"]);
    rows.push(["火种人口", formatNumber(state.pendingRestart.pop)]);
    rows.push(["火种知识", `SC ${formatNumber(state.pendingRestart.sc)} / BE ${formatNumber(state.pendingRestart.be)}`]);
    rows.push(["火种趋势", `SC ${formatSignedNumber(state.pendingRestart.scTrend || 0)}/年 / BE ${formatSignedNumber(state.pendingRestart.beTrend || 0)}/年`]);
    rows.push(["下一代 EERF", `${formatNumber(state.pendingRestart.eerfLevel)}/${EERF_MAX_LEVEL}`]);
  } else {
    const current = snapshot();
    const estimate = computeRestartPopulation(current);
    const knowledge = computeRestartKnowledge(current);
    const trends = computeRestartKnowledgeTrends(level, current);
    const cultureRatio = eerfCultureRatio(current);
    rows.push(["当前等级", `${formatNumber(level)}/${EERF_MAX_LEVEL}`]);
    rows.push(["LA 保存增幅", formatPercent(cultureRatio)]);
    rows.push(["毁灭后人口", formatNumber(estimate)]);
    rows.push(["毁灭后知识", `SC ${formatNumber(knowledge.sc)} / BE ${formatNumber(knowledge.be)}`]);
    rows.push(["毁灭后趋势", `SC ${formatSignedNumber(trends.scTrend)}/年 / BE ${formatSignedNumber(trends.beTrend)}/年`]);
    rows.push(["下一代 EERF", `${formatNumber(Math.max(0, level - 1))}/${EERF_MAX_LEVEL}`]);
    if (level < EERF_MAX_LEVEL) {
      const nextLevel = Math.max(1, level + 1);
      rows.push(["下级需求", nextLevel <= 1 ? "建造 EERF" : `SC ${formatNumber(eerfScienceRequirementForLevel(nextLevel))}`]);
    } else {
      rows.push(["下级需求", "已满级"]);
    }
  }
  renderDefinitionRows(dom.eerfDetailList, rows);
}

function renderDefinitionRows(list, rows) {
  list.innerHTML = "";
  const fragment = document.createDocumentFragment();
  rows.forEach(([label, value]) => {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    fragment.append(item);
  });
  list.append(fragment);
}

function actionDisabledReason(action) {
  if (!action) return "未知行动";
  if (state.finished) return "游戏已经结束";
  if (action.mapExpansionOnly && state.mapUiExpanded === false) return "战略拓展已折叠";

  if (state.awaitingCivilizationRestart) {
    return action.restartOnly ? "" : "等待重启文明";
  }

  if (state.autoRunUntilCollapse && !action.restartOnly) {
    return "分崩离析自动推演中";
  }

  if (action.settleOnly) {
    return state.endingCandidate?.id ? "" : "尚未出现可结算终局";
  }

  if (action.restartOnly) return "当前文明仍在运行";

  const crisis = isEconomicCrisis();
  if (crisis && !action.crisisOnly) return "经济危机，只能重启财政";
  if (!crisis && action.crisisOnly) return "ECO 尚未归零";

  if (state.controlLocked && !action.crisisOnly) return "文明不再响应控制";

  if (action.policyId) {
    const reason = policyDisabledReason(action.policyId);
    if (reason) return reason;
  }

  if (action === ACTIONS.militaryCampaign) {
    const playerArmy = selectedArmy()?.entityId === PLAYER_ENTITY_ID ? selectedArmy() : primaryPlayerArmy();
    if (playerArmy?.lastMovedTurn >= state.turn) return "军队本年已部署";
    if (!hasAttackTarget()) return "没有可进攻边境";
    if (finiteOr(playerArmy?.force, 0) < 1800) return "选中军队兵力不足";
  }

  if (action === ACTIONS.buildEerf && state.eerfLevel > 0) return "EERF 已建成";
  if (action === ACTIONS.upgradeEerf && state.eerfLevel <= 0) return "尚未建造 EERF";
  if (action === ACTIONS.upgradeEerf && state.eerfLevel >= EERF_MAX_LEVEL) return "EERF 已满级";

  const rawDelta = actionRawDelta(action);
  if (action === ACTIONS.upgradeEerf) {
    const nextLevel = Math.min(EERF_MAX_LEVEL, (state.eerfLevel || 0) + 1);
    const requirement = eerfScienceRequirementForLevel(nextLevel);
    if (state.sc < requirement) return `升级需 SC ${formatNumber(requirement)}`;
  }

  if (Number(rawDelta.eco || 0) < 0 && state.eco < Math.abs(rawDelta.eco || 0)) {
    return `ECO 不足 ${formatNumber(Math.abs(rawDelta.eco || 0))}`;
  }

  if (actionPopulationWouldBreakFloor(action, projectedActionPopulationDelta(rawDelta))) {
    return `人口需高于 ${formatNumber(minimumSustainablePopulation())}`;
  }

  return "";
}

function actionRawDelta(action) {
  if (!action) return {};
  return typeof action.delta === "function" ? action.delta(state) : (action.delta || {});
}

function renderEndingStats() {
  const summary = endingStatsSummary(state.endingStats);
  state.endingStats = summary;
  if (dom.endingStatsStatus) {
    const last = summary.lastEnding
      ? `${summary.lastEnding}｜${shortEndingName(summary.lastEnding)}`
      : "尚无";
    dom.endingStatsStatus.textContent = `已达成 ${formatNumber(summary.unique)}/${formatNumber(summary.totalEndings)} 种｜总计 ${formatNumber(summary.total)} 次｜最近 ${last}`;
  }
  if (!dom.endingStatsList) return;

  dom.endingStatsList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  Object.keys(window.THREE_SUN_ENDINGS || {}).forEach((endingId) => {
    const item = document.createElement("li");
    const count = summary.endings[endingId] || 0;
    item.className = count > 0 ? "achieved" : "";
    item.textContent = count > 0
      ? `${endingId} ${shortEndingName(endingId)} ×${formatNumber(count)}`
      : `${endingId}-???`;
    fragment.append(item);
  });
  dom.endingStatsList.append(fragment);
}

function renderSpecialNotice() {
  if (!state.specialNotice) {
    dom.specialBanner.hidden = false;
    const specLabel = state.lastSpec === null ? "SPEC ----" : `SPEC ${formatSpec(state.lastSpec)}`;
    dom.specialTitle.textContent = `${specLabel}｜无特殊事件`;
    dom.specialText.textContent = "日光之下，并无新事。";
    dom.specialDelta.innerHTML = "";
    return;
  }

  dom.specialBanner.hidden = false;
  dom.specialTitle.textContent = state.specialNotice.title;
  dom.specialText.textContent = state.specialNotice.text;
  dom.specialDelta.innerHTML = deltaHtml(state.specialNotice.delta);
}

function renderLog() {
  dom.logList.innerHTML = "";
  const visibleLogs = state.log.filter(logMatchesFilter);
  dom.logFilterButtons.forEach((button) => {
    const active = button.dataset.logFilter === currentLogFilter;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (!visibleLogs.length) {
    const empty = document.createElement("li");
    empty.className = "progress";
    empty.innerHTML = currentLogFilter === "all"
      ? "<strong>编年史空白</strong><p>下一年行动会写入新的记录。</p>"
      : "<strong>没有符合筛选的记录</strong><p>切回全部即可查看完整编年史。</p>";
    dom.logList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleLogs.forEach((entry) => {
    const item = document.createElement("li");
    item.className = entry.type || "progress";

    const title = document.createElement("strong");
    title.textContent = entry.title;
    const text = document.createElement("p");
    text.textContent = entry.text;
    const delta = document.createElement("div");
    delta.className = "delta-row";
    delta.innerHTML = deltaHtml(entry.delta);

    item.append(title, text, delta);
    fragment.append(item);
  });
  dom.logList.append(fragment);
}

function logMatchesFilter(entry) {
  return currentLogFilter === "all" || (entry.type || "progress") === currentLogFilter;
}

function renderArchive() {
  dom.archiveList.innerHTML = "";
  if (!state.history.length) {
    const empty = document.createElement("li");
    empty.innerHTML = "<strong>尚无毁灭记录</strong><p>第一份档案会在文明归零时生成。</p>";
    dom.archiveList.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  state.history.forEach((entry) => {
    const item = document.createElement("li");
    const peak = `SC ${formatNumber(entry.peakSc)} / BE ${formatNumber(entry.peakBe)} / LA ${formatNumber(entry.peakLa || 0)} / POP ${formatNumber(entry.peakPop)} / ECO ${formatNumber(entry.peakEco)} / EERF ${formatNumber(entry.peakEerf || 0)}`;
    const specials = entry.specialEvents?.length
      ? `特殊：${entry.specialEvents.slice(0, 2).join("、")}`
      : "特殊：无";
    item.innerHTML = `
      <strong>第 ${entry.civilization} 号文明｜${formatNumber(entry.turns)} 年</strong>
      <p>${entry.collapseCause || "未知终止"}｜${peak}</p>
      <p>${archiveSummary(entry)}</p>
      <p>${specials}</p>
    `;
    fragment.append(item);
  });
  dom.archiveList.append(fragment);
}

function archiveSummary(entry) {
  const sc = finiteOr(entry.peakSc, 0);
  const be = finiteOr(entry.peakBe, 0);
  const pop = finiteOr(entry.peakPop, 0);
  const eco = finiteOr(entry.peakEco, 0);
  const turns = finiteOr(entry.turns, 0);

  if (sc >= 14000 && be >= 14000) return "新时代的地上天国就此被灾难无情抹去。后人哀之而不鉴之，亦使后人而复哀后人也。";
  if (sc > be * 1.6 && sc >= 8000) return "直到死去的瞬间，他们依然认为是自己的计算发生了错误。";
  if (be > sc * 1.6 && be >= 8000) return "直到死前最后一刻，他们依然认为是自己的信仰陷入了歧途。";
  if (pop >= 90000) return "他们跺脚，足以引发地震；他们呼吸，足以改变气候。当然，太阳不在乎。";
  if (eco >= 180000) return "鼎铛玉石，金块珠砾，弃掷逦迤。秦人视之，亦不甚惜。";
  if (turns <= 30) return "我知道，尘世如露水般短暂；然而，然而。";
  if (sc >= 14000 && eco >= 100000) return "欢迎来到加州旅馆，如此可爱的地方，如此美丽的容颜。";
  return "他们没有成就、没有胜利、没有活下来。历史的潮水会抹去他们的踪迹，所有的踪迹。";
}

function deltaHtml(delta = {}) {
  return ["sc", "be", "la", "pop", "eco", "eerf", "stability"].map((key) => {
    const label = key === "stability" ? "秩序" : key.toUpperCase();
    const value = Number(delta[key] || 0);
    const sign = value > 0 ? "+" : "";
    return `<span>${label} ${sign}${formatNumber(value)}</span>`;
  }).join("");
}

function eerfStatusText() {
  if (state.awaitingCivilizationRestart && state.pendingRestart) {
    return `等待重启文明；火种人口 ${formatNumber(state.pendingRestart.pop)}；SC/BE ${formatNumber(state.pendingRestart.sc)}/${formatNumber(state.pendingRestart.be)}`;
  }

  const level = state.eerfLevel || 0;
  if (level <= 0) return `尚未修建EERF；下一代初始人口 ${formatNumber(BASE_RESTART_POP)}`;
  const current = snapshot();
  const estimate = computeRestartPopulation(current);
  const knowledge = computeRestartKnowledge(current);
  const nextLevel = Math.min(EERF_MAX_LEVEL, level + 1);
  const nextRequirement = level < EERF_MAX_LEVEL
    ? `；下一级需 SC ${formatNumber(eerfScienceRequirementForLevel(nextLevel))}`
    : "；已达满级";
  return `灾后火种等级 ${level}；下一代初始人口约 ${formatNumber(estimate)}；SC/BE 约 ${formatNumber(knowledge.sc)}/${formatNumber(knowledge.be)}；LA 保存增幅 ${formatPercent(eerfCultureRatio(current))}${nextRequirement}`;
}

function laStatusText() {
  const ratio = clamp((state.la || 0) / LA_CAP, 0, 1);
  if (state.currentCivilization?.hadLaCap || state.la >= J_MEMORY_LA_THRESHOLD) {
    return `本代已记录记忆饱和；连续文明 ${formatNumber(currentInclusiveLaMemoryStreak())}/${formatNumber(J_MEMORY_CIVILIZATION_STREAK)}`;
  }
  return `EERF 线性保存增幅 ${formatPercent(ratio)}`;
}

function saveState() {
  try {
    state.saveVersion = SAVE_VERSION;
    state.lastSavedAt = new Date().toISOString();
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // The game remains playable without persistent storage.
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const migrated = {
      ...createNewState(),
      ...parsed,
      saveVersion: SAVE_VERSION,
      seed: normalizeSeed(parsed.seed),
      rngState: normalizeSeed(parsed.rngState || parsed.seed),
      log: Array.isArray(parsed.log) ? parsed.log : []
    };
    migrated.lastSavedAt = typeof parsed.lastSavedAt === "string" ? parsed.lastSavedAt : null;
    migrated.loadedFromSave = true;
    migrated.setupComplete = typeof parsed.setupComplete === "boolean" ? parsed.setupComplete : true;
    migrated.setupStage = migrated.setupComplete
      ? "complete"
      : ["difficulty", "governor", "territory"].includes(parsed.setupStage)
        ? parsed.setupStage
        : "name";
    migrated.realmName = String(
      parsed.realmName || parsed.map?.entities?.[PLAYER_ENTITY_ID]?.name || DEFAULT_REALM_NAME
    ).trim().slice(0, 24) || DEFAULT_REALM_NAME;
    migrated.difficulty = normalizeDifficulty(parsed.difficulty);
    migrated.aiAggression = normalizeAiAggression(parsed.aiAggression);
    migrated.governorId = normalizeGovernorId(parsed.governorId);
    migrated.startingRegionId = normalizeStartingRegionId(parsed.startingRegionId || parsed.map?.startingRegionId);
    migrated.mapUiExpanded = parsed.mapUiExpanded !== false;
    migrated.turn = Math.max(0, Math.round(finiteOr(migrated.turn, 0)));
    migrated.count = Math.max(1, Math.round(finiteOr(migrated.count, 1)));
    migrated.lastRand = Number.isFinite(Number(migrated.lastRand))
      ? clamp(Math.round(Number(migrated.lastRand)), 0, 9999)
      : null;
    migrated.lastSpec = Number.isFinite(Number(migrated.lastSpec))
      ? Math.max(1, Math.round(Number(migrated.lastSpec)))
      : null;
    migrated.weather = String(migrated.weather || "等待第一年观测");
    migrated.ending = String(migrated.ending || "文明尚未抵达终局");
    migrated.lastTone = String(migrated.lastTone || "quiet");
    migrated.specialNotice = migrated.specialNotice && typeof migrated.specialNotice === "object"
      ? {
          title: String(migrated.specialNotice.title || "特殊事件"),
          text: String(migrated.specialNotice.text || ""),
          spec: Number.isFinite(Number(migrated.specialNotice.spec))
            ? Math.max(1, Math.round(Number(migrated.specialNotice.spec)))
            : null,
          delta: migrated.specialNotice.delta && typeof migrated.specialNotice.delta === "object"
            ? diff(snapshotForObject({}), snapshotForObject(migrated.specialNotice.delta))
            : {}
        }
      : null;
    migrated.sc = clamp(roundStat(finiteOr(migrated.sc, 240)), 0, CAP);
    migrated.be = clamp(roundStat(finiteOr(migrated.be, 360)), 0, CAP);
    migrated.la = clamp(Math.floor(finiteOr(migrated.la, 0)), 0, LA_CAP);
    migrated.pop = Math.max(0, Math.round(finiteOr(migrated.pop, 7600)));
    migrated.eco = Math.max(0, Math.round(finiteOr(migrated.eco, DEFAULT_ECO)));
    migrated.stability = clamp(Math.round(finiteOr(migrated.stability, 52)), 0, 100);
    migrated.scTrend = clamp(
      Math.round(finiteOr(migrated.scTrend, fallbackKnowledgeTrend("sc", migrated))),
      KNOWLEDGE_TREND_MIN,
      KNOWLEDGE_TREND_MAX
    );
    migrated.beTrend = clamp(
      Math.round(finiteOr(migrated.beTrend, fallbackKnowledgeTrend("be", migrated))),
      KNOWLEDGE_TREND_MIN,
      KNOWLEDGE_TREND_MAX
    );
    migrated.metricTrends = migrated.metricTrends && typeof migrated.metricTrends === "object"
      ? {
          sc: Math.round(finiteOr(migrated.metricTrends.sc, 0)),
          be: Math.round(finiteOr(migrated.metricTrends.be, 0)),
          la: Math.round(finiteOr(migrated.metricTrends.la, 0)),
          pop: Math.round(finiteOr(migrated.metricTrends.pop, 0)),
          eco: Math.round(finiteOr(migrated.metricTrends.eco, 0)),
          stability: Math.round(finiteOr(migrated.metricTrends.stability, 0))
        }
      : { sc: 0, be: 0, la: 0, pop: 0, eco: 0, stability: 0 };
    migrated.metricSamples = Array.isArray(migrated.metricSamples) && migrated.metricSamples.length
      ? migrated.metricSamples.slice(-METRIC_SAMPLE_LIMIT).map((sample) => normalizeMetricSample(sample))
      : [createMetricSample(migrated.turn, migrated.count, migrated)];
    migrated.map = createInitialMapState(migrated.map, {
      seed: migrated.seed,
      realmName: migrated.realmName,
      difficulty: migrated.difficulty,
      startingRegionId: migrated.startingRegionId
    });
    migrated.military = normalizeMilitaryState(migrated.military, migrated);
    migrated.selectedArmyId = armyByIdForState(migrated, migrated.selectedArmyId)?.id || PLAYER_ARMY_ID;
    migrated.selectedEntityId = politicalEntityByIdForState(migrated, migrated.selectedEntityId)?.id || PLAYER_ENTITY_ID;
    migrated.selectedRegionId = mapRegionById(migrated.selectedRegionId)?.id ||
      armyByIdForState(migrated, migrated.selectedArmyId)?.regionId ||
      migrated.startingRegionId;
    migrated.specialDecisionState = createSpecialDecisionState(migrated.specialDecisionState);
    migrated.populationGrowthMultiplier = finiteOr(migrated.populationGrowthMultiplier, 1);
    migrated.knowledgeGrowthMultiplier = finiteOr(migrated.knowledgeGrowthMultiplier, 1);
    migrated.controlEfficiencyMultiplier = finiteOr(migrated.controlEfficiencyMultiplier, 1);
    migrated.controlLocked = Boolean(migrated.controlLocked);
    migrated.autoRunUntilCollapse = Boolean(migrated.autoRunUntilCollapse || migrated.controlLocked);
    migrated.populationLockTurns = Math.max(0, Math.round(finiteOr(migrated.populationLockTurns, 0)));
    migrated.doomCountdown = Math.max(0, Math.round(finiteOr(migrated.doomCountdown, 0)));
    migrated.lockedPopulation = Number.isFinite(Number(migrated.lockedPopulation))
      ? Math.max(0, Math.round(Number(migrated.lockedPopulation)))
      : null;
    migrated.eerfLevel = clamp(Math.round(finiteOr(migrated.eerfLevel, 0)), 0, EERF_MAX_LEVEL);
    migrated.restartPopulationSeed = Math.max(BASE_RESTART_POP, Math.round(finiteOr(migrated.restartPopulationSeed, BASE_RESTART_POP)));
    migrated.awaitingCivilizationRestart = Boolean(migrated.awaitingCivilizationRestart);
    migrated.pendingRestart = migrated.pendingRestart && typeof migrated.pendingRestart === "object"
      ? {
          oldCount: Math.max(1, Math.round(finiteOr(migrated.pendingRestart.oldCount, migrated.count))),
          nextCount: Math.max(1, Math.round(finiteOr(migrated.pendingRestart.nextCount, migrated.count + 1))),
          sc: clamp(roundStat(finiteOr(migrated.pendingRestart.sc, 0)), 0, CAP),
          be: clamp(roundStat(finiteOr(migrated.pendingRestart.be, 0)), 0, CAP),
          la: clamp(Math.floor(finiteOr(migrated.pendingRestart.la, 0)), 0, LA_CAP),
          scTrend: clamp(Math.round(finiteOr(migrated.pendingRestart.scTrend, 0)), 0, KNOWLEDGE_TREND_MAX),
          beTrend: clamp(Math.round(finiteOr(migrated.pendingRestart.beTrend, 0)), 0, KNOWLEDGE_TREND_MAX),
          pop: Math.max(0, Math.round(finiteOr(migrated.pendingRestart.pop, BASE_RESTART_POP))),
          eco: Math.max(0, Math.round(finiteOr(migrated.pendingRestart.eco, 0))),
          stability: clamp(Math.round(finiteOr(migrated.pendingRestart.stability, 18)), 0, 100),
          eerfLevel: clamp(Math.round(finiteOr(migrated.pendingRestart.eerfLevel, 0)), 0, EERF_MAX_LEVEL),
          collapseCause: String(migrated.pendingRestart.collapseCause || "未知灾变"),
          mapState: migrated.pendingRestart.mapState && typeof migrated.pendingRestart.mapState === "object"
            ? migrated.pendingRestart.mapState
            : null
        }
      : null;
    if (migrated.awaitingCivilizationRestart && !migrated.pendingRestart) {
      migrated.awaitingCivilizationRestart = false;
    }
    if (migrated.awaitingCivilizationRestart || migrated.finished) {
      migrated.autoRunUntilCollapse = false;
    }
    migrated.endingCandidate = migrated.endingCandidate && typeof migrated.endingCandidate === "object" && migrated.endingCandidate.id
      ? {
          id: String(migrated.endingCandidate.id),
          name: String(migrated.endingCandidate.name || `${migrated.endingCandidate.id}结局`),
          turn: Math.max(0, Math.round(finiteOr(migrated.endingCandidate.turn, migrated.turn))),
          rand: Number.isFinite(Number(migrated.endingCandidate.rand)) ? Number(migrated.endingCandidate.rand) : migrated.lastRand,
          trigger: String(migrated.endingCandidate.trigger || migrated.weather || "存档恢复"),
          snapshot: migrated.endingCandidate.snapshot && typeof migrated.endingCandidate.snapshot === "object"
            ? {
                sc: clamp(roundStat(finiteOr(migrated.endingCandidate.snapshot.sc, migrated.sc)), 0, CAP),
                be: clamp(roundStat(finiteOr(migrated.endingCandidate.snapshot.be, migrated.be)), 0, CAP),
                la: clamp(Math.floor(finiteOr(migrated.endingCandidate.snapshot.la, migrated.la)), 0, LA_CAP),
                pop: Math.max(0, Math.round(finiteOr(migrated.endingCandidate.snapshot.pop, migrated.pop))),
                eco: Math.max(0, Math.round(finiteOr(migrated.endingCandidate.snapshot.eco, migrated.eco))),
                eerf: clamp(Math.round(finiteOr(migrated.endingCandidate.snapshot.eerf, migrated.eerfLevel)), 0, EERF_MAX_LEVEL),
                stability: clamp(Math.round(finiteOr(migrated.endingCandidate.snapshot.stability, migrated.stability)), 0, 100)
              }
            : snapshotForObject(migrated)
        }
      : null;
    if (migrated.endingCandidate?.id === "C") {
      migrated.endingCandidate = null;
    }
    if (migrated.awaitingCivilizationRestart) {
      migrated.endingCandidate = null;
    }
    migrated.cStagnantCivilizationStreak = clamp(
      Math.round(finiteOr(migrated.cStagnantCivilizationStreak ?? migrated.cStagnationStreak, 0)),
      0,
      C_STAGNANT_CIVILIZATION_STREAK
    );
    migrated.lowOrderCivilizationStreak = clamp(
      Math.round(finiteOr(migrated.lowOrderCivilizationStreak ?? migrated.lowOrderStreak, 0)),
      0,
      I_LOW_ORDER_CIVILIZATION_STREAK
    );
    migrated.laMemoryCivilizationStreak = clamp(
      Math.round(finiteOr(migrated.laMemoryCivilizationStreak ?? migrated.laFullStreak, 0)),
      0,
      J_MEMORY_CIVILIZATION_STREAK
    );
    migrated.finished = Boolean(migrated.finished);
    migrated.finalEnding = migrated.finalEnding && typeof migrated.finalEnding === "object"
      ? migrated.finalEnding
      : null;
    migrated.endingStats = loadEndingStats();
    if (migrated.finished && !migrated.finalEnding?.id) {
      migrated.finished = false;
      migrated.finalEnding = null;
    }
    migrated.history = Array.isArray(parsed.history)
      ? parsed.history.slice(0, 12).map((entry, index) => normalizeCivilizationArchiveEntry(entry, migrated.count - index - 1))
      : [];
    const fallbackCivilization = createCivilizationStats(migrated.count, Math.max(0, migrated.turn - 1), migrated);
    migrated.currentCivilization = parsed.currentCivilization && typeof parsed.currentCivilization === "object"
      ? { ...fallbackCivilization, ...parsed.currentCivilization }
      : fallbackCivilization;
    migrated.currentCivilization.initialSc = finiteOr(migrated.currentCivilization.initialSc, fallbackCivilization.initialSc);
    migrated.currentCivilization.initialBe = finiteOr(migrated.currentCivilization.initialBe, fallbackCivilization.initialBe);
    migrated.currentCivilization.initialLa = finiteOr(migrated.currentCivilization.initialLa, fallbackCivilization.initialLa);
    migrated.currentCivilization.initialPop = finiteOr(migrated.currentCivilization.initialPop, fallbackCivilization.initialPop);
    migrated.currentCivilization.initialEco = finiteOr(migrated.currentCivilization.initialEco, fallbackCivilization.initialEco);
    migrated.currentCivilization.initialStability = finiteOr(migrated.currentCivilization.initialStability, fallbackCivilization.initialStability);
    migrated.currentCivilization.peakSc = Math.max(finiteOr(migrated.currentCivilization.peakSc, 0), migrated.sc);
    migrated.currentCivilization.peakBe = Math.max(finiteOr(migrated.currentCivilization.peakBe, 0), migrated.be);
    migrated.currentCivilization.peakLa = Math.max(finiteOr(migrated.currentCivilization.peakLa, 0), migrated.la);
    migrated.currentCivilization.peakPop = Math.max(finiteOr(migrated.currentCivilization.peakPop, 0), migrated.pop);
    migrated.currentCivilization.peakEco = Math.max(finiteOr(migrated.currentCivilization.peakEco, 0), migrated.eco);
    migrated.currentCivilization.peakEerf = Math.max(finiteOr(migrated.currentCivilization.peakEerf, 0), migrated.eerfLevel);
    migrated.currentCivilization.peakStability = Math.max(finiteOr(migrated.currentCivilization.peakStability, 0), migrated.stability);
    migrated.currentCivilization.minStability = Math.min(
      finiteOr(migrated.currentCivilization.minStability, migrated.stability),
      migrated.stability
    );
    migrated.currentCivilization.hadLowOrder = Boolean(
      migrated.currentCivilization.hadLowOrder || migrated.currentCivilization.minStability < I_LOW_ORDER_THRESHOLD
    );
    migrated.currentCivilization.hadLaCap = Boolean(
      migrated.currentCivilization.hadLaCap ||
        migrated.currentCivilization.peakLa >= J_MEMORY_LA_THRESHOLD ||
        migrated.la >= J_MEMORY_LA_THRESHOLD
    );
    migrated.currentCivilization.specialEvents = Array.isArray(migrated.currentCivilization.specialEvents)
      ? migrated.currentCivilization.specialEvents.slice(0, 6)
      : [];
    migrated.currentCivilization.metricSamples = Array.isArray(migrated.currentCivilization.metricSamples) && migrated.currentCivilization.metricSamples.length
      ? migrated.currentCivilization.metricSamples.slice(-CIVILIZATION_SAMPLE_LIMIT).map((sample) => normalizeMetricSample(sample))
      : [createMetricSample(migrated.turn, migrated.count, migrated)];
    return migrated;
  } catch {
    return null;
  }
}

function normalizeCivilizationArchiveEntry(entry, fallbackCivilization = 1) {
  const safe = entry && typeof entry === "object" ? entry : {};
  const civilization = Math.max(1, Math.round(finiteOr(safe.civilization, fallbackCivilization)));
  const finalSnapshot = safe.finalSnapshot && typeof safe.finalSnapshot === "object"
    ? snapshotForObject(safe.finalSnapshot)
    : null;
  const fallbackTurn = Math.max(0, Math.round(finiteOr(safe.startTurn, 0) + finiteOr(safe.turns, 0)));
  const fallbackSamples = finalSnapshot
    ? [createMetricSample(fallbackTurn, civilization, finalSnapshot, safe.collapseCause ? { collapse: safe.collapseCause } : {})]
    : [];

  return {
    ...safe,
    civilization,
    turns: Math.max(0, Math.round(finiteOr(safe.turns, 0))),
    startTurn: Math.max(0, Math.round(finiteOr(safe.startTurn, 0))),
    metricSamples: Array.isArray(safe.metricSamples) && safe.metricSamples.length
      ? safe.metricSamples.slice(-CIVILIZATION_SAMPLE_LIMIT).map((sample) => normalizeMetricSample(sample))
      : fallbackSamples
  };
}

function formatNumber(value) {
  const number = finiteOr(value, 0);
  const hasFraction = Math.abs(number - Math.round(number)) > 0.0001;
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: hasFraction ? 4 : 0
  }).format(number);
}

function formatSignedNumber(value) {
  const number = finiteOr(value, 0);
  return `${number > 0 ? "+" : ""}${formatNumber(number)}`;
}

function formatPercent(value) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 1,
    style: "percent"
  }).format(finiteOr(value, 0));
}

function formatRand(value) {
  return String(value).padStart(4, "0");
}

function formatSpec(value) {
  return String(Math.max(1, Math.round(finiteOr(value, 0))));
}

function finiteOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundStat(value) {
  return Math.round(finiteOr(value, 0) * 10000) / 10000;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", () => {
  if (state && !state.finished) saveState();
  cancelAutoRun();
});
