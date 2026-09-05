"use strict";

(function installMapLabData(global) {
  const terrainTypes = {
    tundra: { nameZh: "冻原", nameEn: "Tundra", color: "#8ca4aa", attack: -2, defense: 3 },
    coast: { nameZh: "海岸", nameEn: "Coast", color: "#739da1", attack: 0, defense: 1 },
    mountain: { nameZh: "山地", nameEn: "Mountains", color: "#7f786b", attack: -4, defense: 6 },
    basin: { nameZh: "盆地", nameEn: "Basin", color: "#9b8d66", attack: 1, defense: 2 },
    river: { nameZh: "河谷", nameEn: "Riverland", color: "#688b78", attack: -1, defense: 3 },
    plain: { nameZh: "平原", nameEn: "Plains", color: "#879565", attack: 2, defense: 0 },
    waste: { nameZh: "荒原", nameEn: "Wasteland", color: "#8f765f", attack: 0, defense: -1 },
    canyon: { nameZh: "峡谷", nameEn: "Canyons", color: "#9b6857", attack: -3, defense: 5 }
  };

  const strategicRegions = [
    { id: "frost-crown", nameZh: "寒鸦冠地", nameEn: "Frostcrow Crown", label: [350, 146], tint: "#91aab2" },
    { id: "north-bay", nameZh: "北境冰湾", nameEn: "Northern Ice Bay", label: [770, 160], tint: "#82aeb3" },
    { id: "iron-highlands", nameZh: "铁脊高原", nameEn: "Ironspine Highlands", label: [275, 294], tint: "#83796c" },
    { id: "corona-coast", nameZh: "日冕海岸", nameEn: "Corona Coast", label: [1047, 344], tint: "#769da4" },
    { id: "central-basin", nameZh: "中央盆地", nameEn: "Central Basin", label: [620, 315], tint: "#a7976c" },
    { id: "ash-river", nameZh: "灰河走廊", nameEn: "Ash River Corridor", label: [884, 362], tint: "#6d8d78" },
    { id: "western-salt", nameZh: "西陲盐原", nameEn: "Western Salt March", label: [236, 445], tint: "#97816a" },
    { id: "obsidian-wilds", nameZh: "黑曜荒野", nameEn: "Obsidian Wilds", label: [270, 582], tint: "#75685e" },
    { id: "southern-crater", nameZh: "南方环坑", nameEn: "Southern Ring Crater", label: [584, 526], tint: "#9c6858" },
    { id: "lastlight-delta", nameZh: "终光三角洲", nameEn: "Lastlight Delta", label: [888, 536], tint: "#748d69" }
  ];

  const realms = [
    {
      id: "player-realm",
      nameZh: "长生共同体",
      nameEn: "Longevity Commonwealth",
      shortZh: "长生",
      shortEn: "Longevity",
      color: "#2f8f68",
      capitalRegionIds: ["central-basin"]
    },
    {
      id: "polaris-see",
      nameZh: "北辰圣座",
      nameEn: "Polaris See",
      shortZh: "北辰",
      shortEn: "Polaris",
      color: "#6767a8",
      capitalRegionIds: ["frost-crown", "north-bay"]
    },
    {
      id: "solar-court",
      nameZh: "日冕王庭",
      nameEn: "Court of the Corona",
      shortZh: "日冕",
      shortEn: "Corona",
      color: "#a5464d",
      capitalRegionIds: ["corona-coast", "ash-river"]
    },
    {
      id: "ash-confederacy",
      nameZh: "灰烬邦联",
      nameEn: "Ash Confederacy",
      shortZh: "灰烬",
      shortEn: "Ash",
      color: "#9a643d",
      capitalRegionIds: ["southern-crater", "lastlight-delta"]
    },
    {
      id: "free-cities",
      nameZh: "自由城邦同盟",
      nameEn: "Free Cities League",
      shortZh: "自由城邦",
      shortEn: "Free Cities",
      color: "#4d7088",
      capitalRegionIds: ["western-salt", "obsidian-wilds", "iron-highlands"]
    }
  ];

  function province(id, strategicRegionId, nameZh, nameEn, x, y, terrain, development, fortification, supply, population) {
    return {
      id,
      strategicRegionId,
      nameZh,
      nameEn,
      center: [x, y],
      label: [x, y],
      terrain,
      base: { development, fortification, supply, population }
    };
  }

  const provinces = [
    province("fc01", "frost-crown", "霜鸦原", "Frostcrow Plain", 190, 132, "tundra", 7, 34, 45, 86),
    province("fc02", "frost-crown", "极昼岭", "Highsun Ridge", 310, 112, "mountain", 6, 52, 32, 58),
    province("fc03", "frost-crown", "冻星台", "Frozen Starwatch", 430, 130, "tundra", 8, 41, 44, 72),
    province("fc04", "frost-crown", "白昼裂谷", "White-Day Rift", 215, 202, "canyon", 5, 49, 31, 54),
    province("fc05", "frost-crown", "乌羽苔原", "Ravenmoss Tundra", 355, 194, "tundra", 9, 37, 48, 91),
    province("fc06", "frost-crown", "长夜门", "Longnight Gate", 505, 172, "mountain", 8, 58, 38, 69),

    province("nb01", "north-bay", "北辰冰港", "Polaris Iceport", 615, 128, "coast", 13, 39, 70, 118),
    province("nb02", "north-bay", "寒钟谷", "Coldbell Vale", 735, 112, "tundra", 9, 36, 52, 88),
    province("nb03", "north-bay", "镜潮湾", "Mirrortide Bay", 860, 135, "coast", 15, 34, 78, 132),
    province("nb04", "north-bay", "银帆岬", "Silversail Cape", 985, 170, "coast", 12, 42, 73, 105),
    province("nb05", "north-bay", "蓝盐港", "Blue Salt Harbor", 670, 200, "coast", 16, 37, 82, 144),
    province("nb06", "north-bay", "望日丘", "Sunwatch Hill", 825, 215, "plain", 12, 40, 67, 127),

    province("ih01", "iron-highlands", "铁山关", "Ironmount Pass", 125, 275, "mountain", 8, 63, 38, 75),
    province("ih02", "iron-highlands", "铜脊", "Copper Spine", 225, 250, "mountain", 10, 57, 42, 88),
    province("ih03", "iron-highlands", "黑砧堡", "Black Anvil Hold", 330, 250, "mountain", 12, 66, 46, 101),
    province("ih04", "iron-highlands", "矿歌谷", "Minersong Vale", 425, 245, "plain", 14, 45, 63, 126),
    province("ih05", "iron-highlands", "炉火台", "Hearthforge Heights", 175, 345, "mountain", 11, 61, 43, 94),
    province("ih06", "iron-highlands", "断链隘", "Broken Chain Pass", 285, 335, "canyon", 7, 69, 35, 67),
    province("ih07", "iron-highlands", "石冠城", "Stonecrown", 405, 340, "basin", 15, 53, 61, 139),

    province("cc01", "corona-coast", "日冕滩", "Corona Strand", 1025, 240, "coast", 15, 38, 80, 148),
    province("cc02", "corona-coast", "潮汐阶地", "Tidal Terraces", 1100, 290, "coast", 12, 41, 70, 116),
    province("cc03", "corona-coast", "海镜城", "Mirrorglass City", 1015, 325, "coast", 19, 47, 88, 181),
    province("cc04", "corona-coast", "东风海门", "Eastwind Seagate", 1090, 380, "coast", 13, 54, 72, 124),
    province("cc05", "corona-coast", "金潮原", "Goldtide Fields", 1000, 410, "plain", 16, 43, 76, 157),
    province("cc06", "corona-coast", "三帆港", "Three-Sail Harbor", 1080, 455, "coast", 17, 46, 84, 169),

    province("cb01", "central-basin", "王庭原", "Court Plain", 500, 245, "plain", 18, 48, 82, 172),
    province("cb02", "central-basin", "三日庭", "Three-Sun Court", 610, 235, "basin", 21, 58, 91, 214),
    province("cb03", "central-basin", "学院原", "Academy Fields", 720, 260, "plain", 20, 42, 88, 196),
    province("cb04", "central-basin", "钟塔城", "Belltower City", 520, 315, "basin", 19, 55, 86, 189),
    province("cb05", "central-basin", "中央盆地", "Central Basin", 625, 315, "basin", 24, 62, 96, 245),
    province("cb06", "central-basin", "历法湖", "Calendar Lake", 750, 335, "river", 17, 44, 90, 176),
    province("cb07", "central-basin", "粮仓环", "Granary Ring", 500, 390, "plain", 22, 49, 94, 229),
    province("cb08", "central-basin", "中央旧都", "Old Central Capital", 650, 390, "basin", 23, 67, 89, 236),

    province("ar01", "ash-river", "灰河上游", "Upper Ash River", 820, 270, "river", 15, 46, 83, 156),
    province("ar02", "ash-river", "芦苇沼泽", "Reed Marsh", 910, 285, "river", 11, 39, 68, 129),
    province("ar03", "ash-river", "黑水渡", "Blackwater Ford", 835, 340, "river", 14, 52, 77, 145),
    province("ar04", "ash-river", "灰烬平原", "Ashen Plain", 925, 355, "plain", 16, 44, 74, 162),
    province("ar05", "ash-river", "下游祭口", "Lower Shrine Mouth", 800, 415, "river", 17, 48, 86, 174),
    province("ar06", "ash-river", "漂木城", "Driftwood City", 900, 430, "river", 18, 51, 82, 183),
    province("ar07", "ash-river", "雾港", "Mist Harbor", 975, 475, "coast", 15, 45, 80, 151),

    province("ws01", "western-salt", "西陲旷野", "Western March", 105, 405, "plain", 9, 38, 56, 93),
    province("ws02", "western-salt", "盐湖废原", "Salt Lake Waste", 205, 400, "waste", 7, 31, 42, 69),
    province("ws03", "western-salt", "风蚀城", "Windworn City", 310, 405, "waste", 11, 45, 55, 108),
    province("ws04", "western-salt", "白盐驿", "Whitesalt Station", 140, 480, "waste", 8, 36, 50, 76),
    province("ws05", "western-salt", "落日牧场", "Sunset Range", 250, 500, "plain", 13, 37, 66, 135),
    province("ws06", "western-salt", "旧车辙", "Old Cartway", 365, 485, "plain", 12, 40, 64, 121),

    province("ow01", "obsidian-wilds", "黑曜荒原", "Obsidian Wastes", 170, 555, "waste", 6, 34, 37, 62),
    province("ow02", "obsidian-wilds", "沉星坑", "Fallen Star Hollow", 225, 575, "canyon", 8, 54, 41, 73),
    province("ow03", "obsidian-wilds", "玻璃风口", "Glasswind Gap", 340, 565, "waste", 9, 43, 47, 81),
    province("ow04", "obsidian-wilds", "无声丘", "Silent Hills", 205, 620, "mountain", 5, 59, 30, 49),
    province("ow05", "obsidian-wilds", "夜火台", "Nightfire Watch", 285, 635, "canyon", 7, 57, 35, 65),
    province("ow06", "obsidian-wilds", "赤铁坡", "Red Iron Slopes", 420, 610, "mountain", 10, 60, 42, 90),

    province("sc01", "southern-crater", "赤岩峡谷", "Redrock Canyon", 455, 470, "canyon", 10, 61, 46, 102),
    province("sc02", "southern-crater", "环坑北壁", "North Crater Wall", 555, 465, "mountain", 9, 68, 39, 84),
    province("sc03", "southern-crater", "熔痕原", "Meltmark Plain", 665, 475, "waste", 12, 44, 57, 119),
    province("sc04", "southern-crater", "南门高地", "Southgate Heights", 470, 550, "mountain", 11, 65, 43, 98),
    province("sc05", "southern-crater", "环坑城", "Ring Crater City", 585, 585, "basin", 16, 59, 68, 154),
    province("sc06", "southern-crater", "红尘谷", "Red Dust Vale", 710, 565, "canyon", 13, 55, 58, 132),

    province("ld01", "lastlight-delta", "三角洲港群", "Delta Ports", 770, 490, "river", 20, 44, 92, 205),
    province("ld02", "lastlight-delta", "青绿汊口", "Verdant Forks", 855, 490, "river", 17, 39, 88, 178),
    province("ld03", "lastlight-delta", "琉璃原野", "Glasslands", 950, 515, "plain", 15, 42, 76, 159),
    province("ld04", "lastlight-delta", "潮汐海墙", "Tidal Seawall", 780, 575, "coast", 14, 63, 75, 137),
    province("ld05", "lastlight-delta", "终光海岬", "Lastlight Cape", 885, 600, "coast", 18, 51, 86, 183),
    province("ld06", "lastlight-delta", "远望海角", "Farwatch Cape", 1010, 565, "coast", 13, 47, 72, 126)
  ];

  const data = {
    schemaVersion: 1,
    id: "three-sun-continent-v1",
    geometryRevision: "map-lab-2026-09-04-b",
    viewBox: { x: 0, y: 0, width: 1200, height: 760 },
    landPath: [
      "M 83 203",
      "C 123 133 208 86 305 98",
      "C 389 43 521 55 614 91",
      "C 728 51 853 70 949 126",
      "C 1050 118 1135 184 1118 260",
      "C 1170 321 1134 397 1097 447",
      "C 1090 539 1019 620 925 624",
      "C 838 696 723 680 644 638",
      "C 548 703 428 689 354 641",
      "C 246 666 145 612 136 529",
      "C 69 478 57 388 97 324",
      "C 48 281 48 237 83 203 Z",
      "M 1078 537 C 1120 517 1152 538 1144 571 C 1118 594 1086 583 1078 537 Z",
      "M 92 510 C 61 498 39 519 48 547 C 72 563 98 548 92 510 Z"
    ].join(" "),
    terrainTypes,
    strategicRegions,
    realms,
    provinces,
    rivers: [
      { id: "ash-river", major: true, path: "M 725 210 C 768 270 782 326 817 368 C 858 416 893 474 916 586" },
      { id: "calendar-river", major: false, path: "M 545 192 C 570 247 558 315 615 362 C 660 399 691 454 702 553" },
      { id: "western-run", major: false, path: "M 277 287 C 320 342 300 405 345 463 C 382 510 400 563 421 630" }
    ],
    routes: [
      { id: "northern-road", provinceIds: ["fc02", "fc05", "fc06", "nb01", "nb05", "nb06", "ar01"] },
      { id: "iron-road", provinceIds: ["ih01", "ih03", "ih04", "cb01", "cb05", "cb06", "ar03", "ar04"] },
      { id: "western-caravan", provinceIds: ["ow04", "ow02", "ws05", "ws03", "cb07", "cb05"] },
      { id: "southern-arc", provinceIds: ["ow05", "ow06", "sc04", "sc05", "sc06", "ld04", "ld05", "ld06"] },
      { id: "corona-road", provinceIds: ["nb04", "cc01", "cc03", "cc05", "ar07", "ld03"] }
    ],
    initialSelection: "cb05"
  };

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  global.CRADLES_MAP_LAB_DATA = deepFreeze(data);
})(typeof window !== "undefined" ? window : globalThis);
