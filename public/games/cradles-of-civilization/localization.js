"use strict";

(function installCradlesLocalization(global) {
  const LANGUAGE_STORE_KEY = "three-sun-chronicle:language:v1";
  const SUPPORTED_LANGUAGES = new Set(["zh", "en"]);
  const HAN_PATTERN = /[\u3400-\u9fff]/u;

  const CORE_PAIRS = {
  "政治": "Political",
  "地形": "Terrain",
  "军事": "Military",
  "地图图层": "Map layers",
  "地图视角": "Map view",
  "地图缩放": "Map zoom",
  "缩小地图": "Zoom out",
  "放大地图": "Zoom in",
  "重置地图镜头": "Reset map camera",
  "切换到平面地图": "Switch to flat map",
  "开启立体地形": "Enable relief map",
  "三体世界战略地图": "Trisolaran strategic map",
  "拖动平移 · Ctrl/⌘ + 滚轮或双指缩放 · 普通滚轮滚动页面 · 选择军队与相邻地块后在右侧下令": "Drag to pan · Ctrl/⌘ + wheel or pinch to zoom · use the wheel normally to scroll the page · select an army and adjacent province, then issue the order on the right",
  "轻量立体地形已开启": "Lightweight relief enabled",
  "平面地图已开启": "Flat map enabled",
  "镜头已重置": "Camera reset",
  "未知阵营": "Unknown realm",
  "军队": "Army",
  "我们不禁驻足思考。生命、宇宙和万物的终极答案，究竟是什么？\nSC 暴涨，旧神学体系崩塌，EERF 被一次性推至满级。人口被锁定 5 次行动。\n": "We cannot help but pause and wonder: what is the ultimate answer to life, the universe, and everything?\nSC surges, the old theology collapses, and EERF is raised to maximum level at once. Population is locked for 5 actions.\n",
  "难道就没有一个基督徒来砍下我的头吗？！\n——君士坦丁十一世，1453年5月29日。\n经济衰退至原有的五分之一，人口流失一成。\n": "Is there no Christian here who will take my head?!\n—Constantine XI, May 29, 1453.\nThe economy falls to one-fifth of its former level, and one-tenth of the population is lost.\n",
  "“在朦胧的月光下，泪水涌出我的眼睛。”——《Take Me Home, Country Roads》，约翰·丹佛，1971年": "“Moonlit mist brings tears to my eyes.” —Take Me Home, Country Roads, John Denver, 1971",
  "[color=#7f8b99][b]没有符合筛选的记录[/b]\n切回全部即可查看完整编年史。[/color]": "[color=#7f8b99][b]No records match this filter[/b]\nSwitch back to All to view the complete chronicle.[/color]",
  "灰烬，灰烬，我们都将倒下。\n——中世纪英国民谣。\n先按 4/5 人口减半、1/5 人口保留得到幸存基数。\n": "Ashes, ashes, we all fall down.\n—Medieval English folk song.\nThe survivor base is calculated by halving four-fifths of the population and retaining one-fifth.\n",
  "公式与祷文不过是一体两面，经文和论文亦不过是双生的姊妹。这天，学者和祭司第一次在同一份日历上签名。": "Formula and prayer prove two faces of one truth, scripture and paper twin sisters. That day, scholars and priests sign the same calendar for the first time.",
  "[color=#7f8b99][b]编年史空白[/b]\n下一年行动会写入新的记录。[/color]": "[color=#7f8b99][b]The chronicle is blank[/b]\nThe next action will write a new record.[/color]",
  "共同体碎裂。本代文明内，玩家行动无法再控制任何发展。文明将自行推进，直到本轮毁灭，或自动结算。\n": "The community fractures. Player actions can no longer control development in this civilization. It will advance on its own until collapse or automatic settlement.\n",
  "“看哪，我们将造一座塔，为要传扬我们的名，使我们免于分散在全地上。”——《创世记》，11:4": "“Come, let us build ourselves a city and a tower, and make a name for ourselves, lest we be dispersed.” —Genesis 11:4",
  "同一种子会生成相同的地块、道路与随机序列。地图将在后续版本接回；当前种子仍决定全部随机序列。": "The same seed produces the same terrain, roads, and random sequence. The map returns in a later version; for now, the seed still controls every random roll.",
  "E.E.R.F.极端环境抵抗设施在地下开工。\n子子孙孙无穷匮也，而山不加增，何苦而不平？": "The E.E.R.F. begins construction underground.\nGeneration after generation is endless, while the mountain grows no taller—why should it remain unconquered?",
  "0/年                                      平稳": "0/year                                      Stable",
  "牛奶会有的，面包也会有的。一切都会有的！\n ——弗拉基米尔·伊里奇·列宁，1917年": "There will be milk, there will be bread. There will be everything!\n —Vladimir Ilyich Lenin, 1917",
  "我想花几分钟时间，向我们的人民谈谈银行的情况。\n ——富兰克林·罗斯福，1933年": "I want to talk for a few minutes with the people of the United States about banking.\n —Franklin D. Roosevelt, 1933",
  "跳舞吧，狂欢吧。一切都没有意义。\n经济损失 30,000，神学增长 600。\n": "Dance and revel. Nothing has meaning.\nThe economy loses 30,000, while theology gains 600.\n",
  "啊，这美丽的新世界，竟有这样的人。\n——《暴风雨》，莎士比亚，1611年。\n": "O brave new world, that has such people in it.\n—The Tempest, William Shakespeare, 1611.\n",
  "铸兹宝鼎，祀我国殇。\n人口损失 300,000，且EERF保护作用无效。\n": "Cast this treasured cauldron to honor our national dead.\nPopulation loses 300,000, and EERF protection does not apply.\n",
  "独立宣言扩散进学院和神殿，本代文明内 SC/BE 正向增速 ×1.15。\n": "The Declaration of Independence spreads through academies and temples. Positive SC/BE growth is ×1.15 for this civilization.\n",
  "我们把天空翻了个遍，没有发现上帝和天使。\n——尤里·加加林，1961年。\n": "We searched the whole sky and found neither God nor angels.\n—Yuri Gagarin, 1961.\n",
  "“啊，这美丽的新世界，竟有这样的人！”——《暴风雨》，莎士比亚，1611年": "“O brave new world, that has such people in it!” —The Tempest, William Shakespeare, 1611",
  "“他战胜了自己，他热爱老大哥。”——《1984》，乔治·奥威尔，1949年": "“He had won the victory over himself. He loved Big Brother.” —1984, George Orwell, 1949",
  "原创企划 / Original concept: Noah Walker": "Original concept: Noah Walker",
  "政治是妥协的艺术。由此，百花齐放，百家争鸣；\n我看没什么，起码挺热闹。": "Politics is the art of compromise. Thus, let a hundred flowers bloom and a hundred schools contend;\nI see no harm in it—at least it is lively.",
  "学院夺回祭坛、税粮与钟楼，教化蒙昧。神学退却，科学获得一段残酷的清场。": "The academies reclaim altars, taxes, and bell towers to educate the benighted. Theology retreats; science gains a brutal clearing.",
  "祭司接管学院、工坊与账簿，清算异端。科学退却，神学获得一段安静的扩张。": "Priests seize the academies, workshops, and ledgers to purge heresy. Science retreats; theology gains a quiet expansion.",
  "佛罗伦萨的晨钟敲碎中世纪的蒙昧,人文主义的曙光正为每块大理石注入体温.": "Florence's morning bells shatter medieval ignorance; the dawn of humanism breathes warmth into every block of marble.",
  "“进入此门者，当舍弃一切希望。”——《神曲·地狱篇》，但丁，1307年": "“Abandon all hope, you who enter here.” —Inferno, Dante, 1307",
  "陛下，我不需要上帝这个假设。\n——皮埃尔·西蒙·拉普拉斯，1802年": "Sire, I had no need of that hypothesis.\n—Pierre-Simon Laplace, 1802",
  "真正的艺术，是不显得像艺术。\n——巴尔达萨雷·卡斯蒂廖内，1528年": "True art is that which does not appear to be art.\n—Baldassare Castiglione, 1528",
  "。文明的种子仍在，它将重新启动，再次开启在三体世界中命运莫测的进化。": ". Civilization's seed remains; it will restart and begin another uncertain evolution in the three-body world. ",
  "从何时开始，文明掐死了自己的最后一个婴儿？万籁俱寂，一切重新开始。": "When did civilization strangle its own last infant? All falls silent, and everything begins again.",
  "“君不见，青海头，古来白骨无人收。”——《兵车行》，杜甫，750年": "“Do you not see, by the shores of Kokonor, the white bones uncollected since ancient times?” —Ballad of the Army Carts, Du Fu, 750",
  "当前等级 0/5\n毁灭后人口 2,600\n下一代 EERF 0/5": "Current level 0/5\nPost-collapse population 2,600\nNext-generation EERF 0/5",
  "所有派系暂时站在同一条防线上，本代文明内发展与打压效率 ×2。\n": "All factions temporarily stand on the same defensive line. Development and suppression efficiency is ×2 for this civilization.\n",
  "极端环境抵抗设施在地下开工，地表文明为下一代火种支付第一笔代价。": "The Extreme Environment Resistance Facility begins underground. Surface civilization pays the first price for the next generation's seed.",
  "风雨不动安如山。\n呜呼！何时眼前突兀见此屋，吾庐独破受冻死亦足！": "Unmoved by wind and rain, secure as a mountain.\nOh, to see such a house rise before us—even if my own hut fell and I froze, it would be enough!",
  "EERF 进行整夜演习，地表城市骂它浪费，地下工程师假装没听见。": "EERF runs drills through the night. Surface cities call it wasteful; underground engineers pretend not to hear.",
  "一颗恒星在另一颗恒星前方变暗，潮汐和辐射同时失序，历法彻底失效。": "One star darkens before another. Tides and radiation lose order together, and every calendar fails.",
  "城邦禁止剧场上演灾变寓言，演员散入酒馆，把沉默变成更锋利的故事。": "The city-state bans disaster allegories from the stage. Actors scatter into taverns and sharpen silence into stories.",
  "人类从历史中学到的唯一教训，\n就是人类从未从历史中学到任何教训。": "The only thing we learn from history is\nthat we learn nothing from history.",
  "自然对数被奉为女神，人们在她的祭坛上计算——嗯，几乎是一切。\n": "The natural logarithm is worshiped as a goddess. At her altar, people calculate—well, almost everything.\n",
  "我们必须知道；我们必将知道。\n ——大卫·希尔伯特，1930年": "We must know. We will know.\n —David Hilbert, 1930",
  "居者有其屋，耕者有其田。\n安得广厦千万间，大庇天下寒士俱欢颜？": "Homes for those who live; land for those who till.\nOh, for a mansion vast enough to shelter all the poor in joy!",
  "新的洞穴、温室与地下街区被打开，人口膨胀带来繁荣，也带来拥挤。": "New caverns, greenhouses, and underground districts open. Population growth brings prosperity—and crowding.",
  "温室沿着城墙向外扩张，更多人口被养活，也有更多人口需要被养活。": "Greenhouses spread beyond the walls, feeding more people and creating still more mouths to feed.",
  "观测队要求向北，长老会要求向东，最后车队在原地消耗了整整一季。": "The observers demand north and the elders demand east; in the end, the caravan spends an entire season going nowhere.",
  "市民把灾年、粮价和三颗太阳写进韵脚，广场第一次因为记忆而拥挤。": "Citizens rhyme disasters, grain prices, and three suns; for the first time, memory crowds the square.",
  "当前难度只影响灾变强度；地图与军事参数将在对应系统迁回时恢复。": "Difficulty currently affects disaster intensity only. Map and military parameters return with those systems.",
  "城邦发行硬债、重启税粮并征用冬眠库物资，财政恢复了最小心跳。": "The city-state issues hard debt, restores taxes and grain levies, and requisitions hibernation stores. Public finance regains a minimal pulse.",
  "不信者自当征收重税，神殿的账本上写满了他们的名字；天意如此。": "Unbelievers are duly taxed. Temple ledgers fill with their names; such is divine will.",
  "纸带、继电器和早期算法接管粮仓调度，迷信第一次输给了排队论。": "Paper tape, relays, and early algorithms take over granary logistics; superstition loses to queueing theory for the first time.",
  "捐献、赎罪券和粮票被装订在同一本账册里，秩序变得昂贵而稳定。": "Donations, indulgences, and ration slips are bound into one ledger; order becomes costly and stable.",
  "同一场灾难被写成论文，也被写成祷文，后人第一次读懂两种恐惧。": "The same disaster is recorded as both paper and prayer; later generations understand two kinds of fear for the first time.",
  "人物与数值规则沿用网页版；涉及地图与军事的技能部分暂不生效。": "Characters and numerical rules match the web version. Skills tied to map and military systems are temporarily inactive.",
  "图书馆的火光照亮海港，也照亮空白的目录。LA 大幅下降。\n": "The library fire illuminates the harbor—and an empty catalogue. LA falls sharply.\n",
  "不管怎么说，它依然在转动！\n——伽利略·伽利莱，1632年": "And yet it moves!\n—Galileo Galilei, 1632",
  "一批人进入脱水状态，文明用当下的热闹换取下一次醒来的秩序。": "Part of the population dehydrates. Civilization trades the bustle of the present for order at the next awakening.",
  "粮仓、工坊和税制重新开始工作，文明卖出了理想，得到了现金。": "Granaries, workshops, and taxation begin working again. Civilization sells its ideals and receives cash.",
  "幸存者打开 EERF 和废墟档案，下一代文明从火种中醒来。": "Survivors open EERF and the ruin archives. The next civilization awakens from the seed.",
  "工坊把热量从地底引向街区，机器第一次像城市的血管一样搏动。": "Workshops pipe heat from underground into the streets; machines pulse like the city's veins for the first time.",
  "地下反应堆点亮了一整片城市，也让每一位官员学会恐惧仪表盘。": "An underground reactor lights an entire district and teaches every official to fear the instrument panel.",
  "学者和祭司共享同一份历法，争论没有停止，但预算终于能通过。": "Scholars and priests share one calendar. Their arguments continue, but the budget finally passes.",
  "拥挤的地下街区为了水渠爆发冲突，行政官用粮票买来一夜安静。": "Crowded underground districts riot over drainage canals; administrators buy one quiet night with ration slips.",
  "祭司们用一场漫长争论解释灾变，群众获得方向，学院失去经费。": "Priests explain the disaster through a long debate. The people gain direction; the academies lose funding.",
  "城中央的青铜钟在寒夜中裂开，人们第一次听见自己心跳的声音。": "The bronze bell at the city center cracks in the cold night, and people hear their own heartbeats for the first time.",
  "失踪三年的测绘队带回新地图，也带回一串没人敢看的死亡名单。": "Surveyors missing for three years return with new maps and a casualty list no one dares read.",
  "工坊烟囱遮住了祷告时的星光，城里第一次为天空的所有权争吵。": "Workshop smoke hides the stars during prayer, and the city argues over ownership of the sky for the first time.",
  "灾年留下的孩子被集中抚养，他们很快学会同时背诵公式和祷文。": "Children orphaned by disaster are raised together and soon learn to recite formulas and prayers side by side.",
  "新币上没有国王头像，只刻着三颗太阳和一行小到看不清的税率。": "The new coin bears no king, only three suns and a tax rate too small to read.",
  "城墙又高了一层，外面的人看不见粮仓，里面的人看不见地平线。": "The wall rises another level. Those outside cannot see the granaries; those inside cannot see the horizon.",
  "旧文明的壁画从盐壳下露出，孩子们照着那些线条重新想象祖先。": "Murals of an older civilization emerge from the salt crust, and children use their lines to imagine their ancestors anew.",
  "更深的门、更厚的隔热层、更长的冬眠协议被写入 EERF。": "Deeper doors, thicker insulation, and longer hibernation protocols are added to EERF.",
  "最先进的实验同时失败，前沿学者们耳语道，物理学不存在了。": "The most advanced experiments fail at once. Frontier scholars whisper that physics no longer exists.",
  "数万人沿着恒星升落的方向步行，市集、神殿和粮仓一同膨胀。": "Tens of thousands walk with the rising and setting stars; markets, temples, and granaries swell together.",
  "来自旧轨道的碎片贯穿大气层，城市和神殿一起消失在白光里。": "Debris from an old orbit pierces the atmosphere; cities and temples vanish together in white light.",
  "这一年没有宏大的灾变，普通人的手艺和耐心反而推进了文明。": "No grand disaster comes this year; ordinary skill and patience advance civilization instead.",
  "天体运行短暂呈现规律，历法、神谕和工程计划同时变得可信。": "The heavens briefly become regular, making calendars, oracles, and engineering plans credible at once.",
  "地下水脉短暂恢复，谣言说这是神迹，工程师说这是地层压力。": "The aquifer briefly recovers. Rumor calls it a miracle; engineers call it geological pressure.",
  "王陵里没有永生秘密，只有金器、霉菌和一份相当准确的历法。": "The royal tomb holds no secret of immortality—only gold, mold, and a remarkably accurate calendar.",
  "天空出现一片缓慢移动的巨大阴影，孩子们把它画进课本边角。": "A vast, slow-moving shadow crosses the sky; children draw it in the margins of their textbooks.",
  "钟表匠拒绝继续修理互相矛盾的时间，城里的预约系统崩溃了。": "Clockmakers refuse to repair mutually contradictory time. The city's appointment system collapses.",
  "“耶和华是我的牧者，我必不至缺乏。”——《诗篇》23:1": "“The Lord is my shepherd; I shall not want.” —Psalm 23:1",
  "孩子们在黑板上计算三颗恒星的影子，旧神话被改写成作业。": "Children calculate the shadows of three stars on blackboards, turning old myths into homework.",
  "祭司把争端写进誓约，人们服从判决，但学院开始小声抗议。": "Priests write disputes into covenants. The people obey the judgments, while the academies begin to protest in whispers.",
  "年轻人离开工坊进入修院，城市安静下来，机器也安静下来。": "Young people leave the workshops for monasteries. The city grows quiet, and so do its machines.",
  "城邦把未来三十年的税写成纸片出售，纸片比粮食更快贬值。": "The city-states sell thirty years of future taxes on scraps of paper; the paper loses value faster than grain.",
  "大地被三颗太阳的潮汐力撕开，地下河与城市一起坠入裂谷。": "The tidal force of three suns tears the ground apart; underground rivers and cities plunge into the rifts.",
  "天空在同一天内经历正午与深夜，热浪和冰霜轮流碾过地表。": "The sky passes through noon and midnight in a single day, while heat waves and frost take turns crushing the surface.",
  "长夜提前降临，冰层越过赤道，火种和粮仓在同一周内熄灭。": "The long night arrives early. Ice crosses the equator, and seedbanks and granaries fail within the same week.",
  "人口超过洞穴和粮仓的承载极限，最后的避难所从内部崩塌。": "Population exceeds the capacity of caverns and granaries. The final refuge collapses from within.",
  "第 42 号答案完成最后一次回响，文明在确定性里停止。": "Answer 42 completes its final echo, and civilization halts within certainty.",
  "祭日吸引了远方部落，祈祷、交易和盗窃在同一条街上发生。": "The holy day draws distant tribes. Prayer, trade, and theft fill the same street.",
  "一颗太阳呈现异常红光，学院增设观测班，民间增设忏悔日。": "One sun turns an unnatural red. The academies add observation shifts; the public adds days of penitence.",
  "负责征粮的税吏在夜里消失，第二天所有人都声称没有看见。": "The tax collector responsible for grain disappears at night. The next day, everyone claims to have seen nothing.",
  "逃亡者被允许返回城市，条件是交出武器、粮票和一半故事。": "Exiles may return if they surrender their weapons, ration slips, and half their stories.",
  "潮气钻进地下档案室，一整架族谱在早晨变成无法展开的灰。": "Damp enters the underground archive; by morning, an entire shelf of genealogies has become ash that cannot be unfolded.",
  "“哦，妈妈，我真傻。”——弗里德里希·尼采，1889年": "“Mother, I am stupid.” —Friedrich Nietzsche, 1889",
  "研究者把恐惧写成公式，科学上升，但旧祭司们感到不安。": "Researchers turn fear into formulas. Science rises, but the old priests grow uneasy.",
  "学院和神殿互相让出一步，文明暂时学会用两种语言说话。": "Academy and temple each yield a step. Civilization briefly learns to speak in two languages.",
  "巡夜队、粮票与临时法院重新挤压混乱，经济为秩序让路。": "Night patrols, ration slips, and provisional courts press chaos back. The economy yields to order.",
  "每座城都怀疑下一座城偷走了恒纪元，贸易线被临时关停。": "Every city suspects the next of stealing the Stable Era, and trade routes close temporarily.",
  "人们在街垒后讨论明天由谁统治，没人讨论明天由谁播种。": "Behind the barricades, people debate who will rule tomorrow. No one asks who will sow tomorrow.",
  "三颗恒星同时占据天空，海洋沸腾，山脉像纸页一样卷曲。": "Three stars fill the sky at once. Oceans boil and mountains curl like sheets of paper.",
  "恒星轨道突然抽紧，整颗行星被甩入一段无法计算的黑暗。": "The stellar orbits suddenly tighten, flinging the whole planet into an incalculable darkness.",
  "远古海床重新隆起，城市像沉船一样被埋进盐壳和石灰岩。": "Ancient seabeds rise again, burying cities like shipwrecks beneath salt crust and limestone.",
  "浸泡在恒纪元的光辉里，文明的秩序和产出都获得了提升。": "Bathed in the light of the Stable Era, civilization gains both order and output.",
  "一次错误预报让迁徙队走向错误山谷，星象学派趁机扩张。": "A faulty forecast sends the migration party into the wrong valley, and the astrologers seize the chance to expand.",
  "长夜覆盖地表，人口退入洞穴，火和故事成为同一种资源。": "The long night covers the surface. People retreat into caves, where fire and story become the same resource.",
  "盐湖露出一圈旧码头，商人带回矿盐，祭司带回远古咒语。": "A receding salt lake reveals old docks. Merchants return with mineral salt, priests with ancient incantations.",
  "一场小火烧掉了半座抄写院，幸存的书页反而被抄得更快。": "A small fire burns half the scriptorium; the surviving pages are copied faster than ever.",
  "白天种地的人夜里学习几何，白天祷告的人夜里学习账簿。": "Those who farm by day study geometry at night; those who pray by day study ledgers at night.",
  "风像从炉膛里吹来，地表作物卷曲，地下课堂却坐满了人。": "The wind blows like a furnace. Surface crops curl, while underground classrooms fill.",
  "苦修者重新解释星象，人群获得秩序，怀疑者退回暗处。": "Ascetics reinterpret the stars. The crowd gains order, while doubters retreat into the shadows.",
  "教授们公开嘲笑神迹，学生们鼓掌，街角的老人们沉默。": "Professors openly mock miracles. Students applaud; old people on street corners fall silent.",
  "上一代人的错误被重新编号，下一代人的课本因此变厚。": "The previous generation's mistakes are renumbered, making the next generation's textbooks thicker.",
  "温暖、雨水和安静的夜晚罕见地同时出现，粮仓被装满。": "Warmth, rain, and quiet nights arrive together in a rare season, filling the granaries.",
  "干涸河床重新容纳浅船，商路像旧伤口一样被重新撕开。": "Shallow boats return to the dry riverbed, reopening trade routes like old wounds.",
  "“看哪，我将一切都更新了。”——《启示录》21:5": "“Behold, I make all things new.” —Revelation 21:5",
  "——格奥尔格·威廉·弗里德里希·黑格尔，1837年": "—Georg Wilhelm Friedrich Hegel, 1837",
  "只生一个好，政府来养老。本年所有人口变化均被回滚。": "One child is best; the state will provide. All population changes this year were rolled back. ",
  "每座钟楼在同一刻发声，恐慌被压低，怀疑也被压低。": "Every bell tower sounds at once. Panic is subdued, and so is doubt.",
  "审查官把一批星图锁进地下室，钥匙交给唱诗班保管。": "Censors lock a collection of star charts underground and entrust the key to the choir.",
  "新的矿脉从断崖里露出，代价是一片旧城被埋进岩层。": "New ore seams emerge from the cliffs at the cost of an old city buried in the strata.",
  "高温唤醒古老病灶，医师与祈祷者都被推到人群前方。": "Heat awakens an ancient plague, pushing physicians and supplicants alike to the front of the crowd.",
  "修道院把草药配方交给医师，医师承认这次确实有效。": "The monastery gives its herbal formula to the physicians, who admit that this time it actually works.",
  "学院与神殿仍在争吵，但他们已经在使用同一份日历。": "Academy and temple still argue, but they now use the same calendar. ",
  "昼夜和季节失去意义，人们靠猜测安排播种和迁徙。": "Day, night, and season lose meaning; people schedule planting and migration by guesswork.",
  "矿工在深处发现稳定岩层，歌声沿着竖井传到地表。": "Miners find stable rock deep below, and their songs rise to the surface through the shaft.",
  "尚无毁灭记录。\n第一份档案会在文明归零时生成。": "No collapse has been recorded.\nThe first archive entry is created when a civilization falls.",
  "已达成 0/10 种｜总计 0 次｜最近 尚无": "Reached 0/10 endings | Total 0 | Latest none",
  "望远镜的影子盖过祭坛，城市开始用证据审判传统。": "The telescope's shadow covers the altar, and the city begins judging tradition by evidence. ",
  "观测器需要更多金属，旧神像被熔进望远镜底座。": "The observatories need more metal, so old idols are melted into telescope mounts.",
  "账本被重新计算，少了一些神迹，多了一些库存。": "The ledgers are recalculated: fewer miracles, more inventory.",
  "“把字刻在石头上。”——罗辑，掩体纪元67年": "“Carve the words into stone.” —Luo Ji, Bunker Era 67",
  "地下粮仓拒绝开门，价格比恒星轨道更难预测。": "The underground granaries refuse to open. Prices become harder to predict than stellar orbits.",
  "财政盈余让统治者第一次相信明年可以被规划。": "A fiscal surplus makes the ruler believe for the first time that next year can be planned. ",
  "您自由了。\n——《悲惨世界》，1862年": "You are free.\n—Les Misérables, 1862",
  "钟声盖过仪器噪音，疑问被重新命名为诱惑。": "Bells drown out the instruments, and questions are renamed temptations. ",
  " 后抵达终局。游戏结束。终局统计已更新。": " reached the ending after the stated trigger. The game is over, and ending statistics have been updated. ",
  "冬至过了那整三天，耶稣降生在驻马店。\n": "Three full days after the winter solstice, Jesus is born in Zhumadian.\n",
  "神学共同体正在把松散人群重新编入秩序。": "The theological community is drawing scattered people back into order. ",
  "地方城邦开始以自己的钟声代替中央命令。": "Local city-states begin replacing central commands with their own bells. ",
  "朋友，随我来，加入这场伟大的合唱。\n": "Friend, follow me and join this grand chorus.\n",
  "建立文明 // INITIALIZE": "INITIALIZE CIVILIZATION",
  "一切文明，始于一个被共同记住的名字。": "Every civilization begins with a name remembered in common.",
  "([A-J])结局可结算；可继续发展": "$1 ending available; development may continue",
  "秩序让学院、工坊与档案系统更快运转。": "Order makes academies, workshops, and archives run faster. ",
  "连续 3 代文明达到 LA 记忆饱和": "3 consecutive civilizations reached maximum LA memory",
  "亲王亲王御马前，何物随风斩娇颜？\n": "Prince, prince, before the royal horse—what rides the wind to cut down beauty?\n",
  "新世界已准备，请重新确认建国信息。": "The new world is ready. Please confirm the founding details again.",
  "粮仓和账本之间的距离正在变得危险。": "The distance between granaries and ledgers is becoming dangerous. ",
  "秩序严密到连谣言都要排队通过街口。": "Order is so strict that even rumors must queue at the street corner. ",
  "这一年没有答案，只有更精确的问题。": "This year brings no answers, only more precise questions. ",
  "文明毁灭，EERF 火种等待重启": "collapsed; the EERF seedbank awaits restart",
  "地下火种工程已经成为另一种国家。": "The underground seed project has become another kind of state. ",
  "神又说，要有光。于是又有了光。": "And God said, Let there be light: and there was light.",
  "三恒星危机管制台 / 重启文明": "TRISOLAR CRISIS CONTROL / RESTART",
  "SPEC ----｜无特殊事件": "SPEC ---- | NO SPECIAL EVENT",
  "在三颗恒星互相矛盾的轨迹下苏醒": "awakens beneath the contradictory paths of three stars",
  "连续 16 代文明以无政府收束": "16 consecutive civilizations ended in anarchy",
  "文明把当前状态写成最终结局。": "Civilization records its present state as the final ending.",
  "经济维护成本吞噬了部分产出。": "Economic maintenance consumes part of the output. ",
  "师者，所以传道授业解惑也。": "A teacher is one who transmits the Way, imparts knowledge, and resolves doubts.",
  "EERF 极端环境抵抗设施": "EERF EXTREME ENVIRONMENT RESISTANCE FACILITY",
  "已读取尚未完成的建国流程。": "Loaded an unfinished founding sequence.",
  "人口承载压力正在回收扩张。": "Population carrying pressure is reclaiming expansion. ",
  "输入种子，例如 1058": "Enter a seed, e.g. 1058",
  "可以修改国名或世界种子。": "You may change the realm name or world seed.",
  "从 EERF 火种中启动": "started from the EERF seedbank",
  "知识结构的互斥开始显现。": "Conflict between knowledge systems begins to show. ",
  "新世界　Shift+N": "New World  Shift+N",
  "长生军｜普通｜无地图版": "Longevity Army | Normal | Mapless Build",
  "终局判定 / 脱离苦海": "ENDING CHECK / SETTLE",
  "可以重新选择演化压力。": "You may choose a different evolutionary pressure.",
  "经济危机｜正向知识冻结": "Economic crisis | Positive knowledge frozen",
  "中毁灭了，该文明进化至": " and had advanced to the ",
  "连续 18 代青铜停滞": "18 consecutive civilizations stagnated in the Bronze Age",
  "万物非主，唯有真主。": "There is no deity but God.",
  "必须想象你是幸福的。": "One must imagine you happy.",
  "日光之下，并无新事。": "There is nothing new under the sun.",
  "文明的旅程尚未停息。": "Civilization's journey continues.",
  "选择一位初始执政官。": "Choose the first governor.",
  "本地纪事显示已清空。": "The local chronicle display has been cleared.",
  "条件已满足，可结算。": "Conditions met; ready to settle.",
  "山巅一寺一壶酒。\n": "On the mountaintop: one temple, one flask of wine.\n",
  "01 / 国度命名": "01 / NAME THE REALM",
  "02 / 难度选择": "02 / SELECT DIFFICULTY",
  "EERF 火种预估": "EERF SEEDBANK ESTIMATE",
  "脱水！脱水！！！": "Dehydrate! Dehydrate!!!",
  "开始　Enter": "Start  Enter",
  "03 / 执政官": "03 / GOVERNOR",
  "预算、产业与粮仓": "Budget, industry, and granaries",
  "要依靠主得救。": "Believe in the Lord, and you will be saved.",
  "例如 1058": "e.g. 1058",
  "选择初始执政官": "Choose the First Governor",
  "等待第一年观测": "Awaiting the first year's observation",
  "LA 文学艺术": "LA ARTS & LETTERS",
  " · 文明毁灭": " · CIVILIZATION COLLAPSED",
  "请先输入国名。": "Enter a realm name first.",
  "没有找到存档。": "No save file was found.",
  "低秩序文明连败": "LOW-ORDER STREAK",
  "建造 EERF": "Build EERF",
  "升级 EERF": "Upgrade EERF",
  "复制挑战链接": "Copy Challenge Link",
  "选择演化压力": "Choose Evolutionary Pressure",
  "POP 人口": "POP POPULATION",
  "ECO 经济": "ECO ECONOMY",
  "特殊设施建设": "SPECIAL FACILITIES",
  "游戏已保存。": "Game saved.",
  "记忆文明连胜": "MEMORY STREAK",
  "铜石并用时代": "Chalcolithic Age",
  "古典机械时代": "Classical Mechanics",
  "星际航行时代": "Interstellar Age",
  "宇宙工程时代": "Cosmic Engineering Age",
  "选择执政官": "Choose Governor",
  "SC 科学": "SC SCIENCE",
  "BE 神学": "BE THEOLOGY",
  "本代 LA": "CURRENT LA",
  "建造研究所": "Build Research Institute",
  "扩建聚居地": "Expand Settlements",
  "戴森球时代": "Dyson Sphere Age",
  "尼西亚信经": "Nicene Creed",
  "｜文明毁灭": " | Civilization Collapsed",
  "｜终局达成": " | Ending Achieved",
  "特殊事件：": "Special event: ",
  "行动受阻：": "Action blocked: ",
  "系统压力：": "System pressure: ",
  "科学史进入": "The history of science enters the ",
  "神学史进入": "The history of theology enters the ",
  "手动结算：": "Ending chosen: ",
  "地上天国": "Promised Land",
  "人间地狱": "Suffer In Hell",
  "都灵之马": "The Turin Horse",
  "四海为家": "Space Odyssey",
  "唯主是依": "In God We Trust",
  "各执一词": "Agree to Disagree",
  "如梦方醒": "Brave New World",
  "罗马再临": "Do As the Romans Do",
  "永志不忘": "Here's Looking At You",
  "本局复盘": "RUN RECAP",
  "终局统计": "ENDING STATISTICS",
  "指定种子": "Custom Seed",
  "文明摇篮": "CRADLES OF CIVILIZATION",
  "你的国度": "Your Realm",
  "输入国名": "Enter realm name",
  "世界种子": "World Seed",
  "随机世界": "Random World",
  "确认国名": "Confirm Realm Name",
  "无名国度": "Unnamed Realm",
  "返回命名": "Back to Name",
  "返回难度": "Back to Difficulty",
  "开始演化": "Begin Evolution",
  "特殊事件": "SPECIAL EVENT",
  "状态仪表": "STATUS METERS",
  "基础操作": "BASIC ACTIONS",
  "战略干预": "STRATEGIC INTERVENTION",
  "文明系统": "CIVILIZATION SYSTEM",
  "终局观测": "ENDING WATCH",
  "文明档案": "CIVILIZATION ARCHIVE",
  "世界存档": "WORLD SAVE",
  "毁灭次数": "COLLAPSES",
  "当前秩序": "CURRENT ORDER",
  "潜心苦修": "Devote to Asceticism",
  "刺激经济": "Stimulate the Economy",
  "文艺复兴": "Renaissance",
  "均衡治理": "Balanced Governance",
  "打压神学": "Suppress Theology",
  "维持秩序": "Maintain Order",
  "打压科学": "Suppress Science",
  "炉边谈话": "Fireside Chat",
  "重启文明": "Restart Civilization",
  "脱离苦海": "Settle Ending",
  "石器时代": "Stone Age",
  "青铜时代": "Bronze Age",
  "铁器时代": "Iron Age",
  "蒸汽时代": "Steam Age",
  "电气时代": "Electrical Age",
  "原子时代": "Atomic Age",
  "信息时代": "Information Age",
  "太空时代": "Space Age",
  "巫祝萌芽": "Shamanic Beginnings",
  "图腾祭司": "Totem Priests",
  "祖灵城邦": "Ancestral City-States",
  "神权律法": "Theocratic Law",
  "经院神学": "Scholastic Theology",
  "圣城体系": "Holy City System",
  "正典教会": "Canonical Church",
  "三位一体": "Trinity",
  "教皇选举": "Papal Election",
  "异端审判": "Inquisition",
  "唯有上帝": "God Alone",
  "天国王朝": "Kingdom of Heaven",
  "文明毁灭": "Civilization Collapsed",
  "等待重启": "Awaiting Restart",
  "已经抵达": "Reached",
  "长生军": "Longevity Army",
  "执政官": "GOVERNOR",
  "编年史": "CHRONICLE",
  "新世界": "New World",
  "已复制": "Copied",
  "均衡度": "HARMONY",
  "执行：": "Action: ",
  "种子": "Seed",
  "战局": "Campaign",
  "文明": "CIVILIZATION",
  "年份": "YEAR",
  "触发": "Trigger",
  "终值": "Final values",
  "峰值": "Peak values",
  "清空": "Clear",
  "国名": "Realm name",
  "保存": "Save",
  "读取": "Load",
  "平稳": "Stable",
  "尚无": "none",
  "秩序": "ORDER",
  "脱水": "Dehydrate"
};

  const WEB_PAIRS = {
    "文明摇篮：文明文字模拟": "Cradles of Civilization: A Text-Based Civilization Simulator",
    "文明摇篮：终局": "Cradles of Civilization: Ending",
    "文明摇篮终局": "Cradles of Civilization ending",
    "返回 Tech Echo 官网 / Return to Tech Echo": "Return to Tech Echo",
    "尚无结局记录": "No Ending Recorded",
    "这一页会在文明抵达终局后显示结果。返回新世界，开始一轮新的演化。": "Your civilization’s final chapter will appear here when you reach an ending. Start a new world to begin its story.",
    "未知触发": "Unknown trigger",
    "未知灾变": "Unknown disaster",
    "地上天国/Promised Land": "Promised Land",
    "人间地狱/Suffer In Hell": "Suffer In Hell",
    "都灵之马/The Turin Horse": "The Turin Horse",
    "四海为家/Space Odyssey": "Space Odyssey",
    "唯主是依/In God We Trust": "In God We Trust",
    "各执一词/Agree to Disagree": "Agree to Disagree",
    "如梦方醒/Brave New World": "Brave New World",
    "1984/Big Brother": "Big Brother",
    "罗马再临/Do As the Romans Do": "Do As the Romans Do",
    "永志不忘/Here's Looking At You": "Here's Looking At You",
    "万王之王/King of All Kings": "King of All Kings",
    "末代皇帝/Viva La Vida": "Viva La Vida",
    "女孩们只想玩乐。\n——辛迪·劳帕，1983年。\n人口增长策略转向审慎，本代文明内人口增速变为原来的 2/3。\n": "Girls just want to have fun.\n—Cyndi Lauper, 1983.\nPopulation policy turns cautious; population growth becomes 2/3 of its former rate for this civilization.\n",
    "妇女能顶半边天。新的家庭制度释放劳动与生育潜能，本代文明内人口增速变为原来的 5/4。\n": "Women hold up half the sky. New family institutions release labor and reproductive potential; population growth becomes 5/4 of its former rate for this civilization.\n",
    "无": "None",
    "经济": "Economy",
    "我们必须知道；我们必将知道。": "We must know. We will know.",
    "——大卫·希尔伯特，1930年": "—David Hilbert, 1930",
    "居者有其屋，耕者有其田。安得广厦千万间，大庇天下寒士俱欢颜？": "Homes for those who live; land for those who till. Oh, for a mansion vast enough to shelter all the poor in joy!",
    "牛奶会有的，面包也会有的。一切都会有的！": "There will be milk, there will be bread. There will be everything!",
    "——列宁，1917年": "—Vladimir Lenin, 1917",
    "政治是妥协的艺术。百花齐放，百家争鸣。我看没什么，起码挺热闹。": "Politics is the art of compromise. Let a hundred flowers bloom and a hundred schools contend. I see no harm in it—at least it is lively.",
    "E.E.R.F.极端环境抵抗设施在地下开工。子子孙孙无穷匮也，而山不加增，何苦而不平？": "The E.E.R.F. begins construction underground. Generation after generation is endless, while the mountain grows no taller—why should it remain unconquered?",
    "风雨不动安如山。呜呼！何时眼前突兀见此屋，吾庐独破受冻死亦足！": "Unmoved by wind and rain, secure as a mountain. Oh, to see such a house rise before us—even if my own hut fell and I froze, it would be enough!",
    "我想花几分钟时间，向我们的人民谈谈银行的情况。": "I want to talk for a few minutes with the people about banking.",
    "——富兰克林·罗斯福，1933年": "—Franklin D. Roosevelt, 1933",
    "执政官 I 像": "Portrait of Governor I",
    "执政官 II 像": "Portrait of Governor II",
    "执政官 III 像": "Portrait of Governor III",
    "三体监听员像": "Portrait of the Trisolaran Listener",
    "人类从历史中学到的唯一教训，": "The only lesson humanity learns from history is",
    "就是人类从未从历史中学到任何教训。": "that humanity has never learned anything from history.",
    "同一种子会生成相同的地块、道路与随机序列。": "The same seed generates the same regions, roads, and random sequence.",
    "大陆地理固定；同一种子会重现势力分布与随机序列。": "Continental geography is fixed; the same seed reproduces political borders and the random sequence.",
    "敌军与灾变较弱，边境反应较慢": "Weaker enemies and disasters, with slower pressure at the frontier",
    "标准军力、灾变与边境压力": "Standard military strength, disasters, and frontier pressure",
    "敌军更强，灾变和进攻更频繁": "Stronger enemies, with more frequent disasters and attacks",
    "战争与灾变全面强化，容错极低": "War and disasters are fully intensified, leaving almost no margin for error",
    "简单": "Easy",
    "普通": "Normal",
    "困难": "Hard",
    "终极困难": "Ultimate",
    "AI 侵略性": "AI Aggression",
    "克制": "Restrained",
    "标准": "Standard",
    "好战": "Aggressive",
    "全面战争": "Total War",
    "杨卫平": "Yang Weiping",
    "汉人血统。": "Of Han Chinese descent.",
    "他坚信空谈误国，实干兴邦。": "He believes empty talk ruins a nation, while practical work makes it prosper.",
    "他也坚信：历来强盗要侵入，最终必送命。": "He also believes that invaders who come as bandits will ultimately meet their end.",
    "民生防线｜人口正增长 +8%；防御 +6。": "People's Lifeline | Positive population growth +8%; defense +6.",
    "克莱尔·英格丽德·麦克劳德": "Claire Ingrid MacLeod",
    "维京-凯尔特血统。": "Of Norse-Celtic descent.",
    "当然，她可以是一位优秀的执政官。": "She could, of course, be an excellent governor.",
    "但她更想成为一位女武神。": "But she would rather be a Valkyrie.",
    "女武神｜神学正增长 +8%；攻击 +6。": "Valkyrie | Positive theology growth +8%; attack +6.",
    "拉特尔·“公羊”·塞万提斯三世": "Ratel 'Ram' Cervantes III",
    "拉特尔·‘公羊’·塞万提斯三世": "Ratel 'Ram' Cervantes III",
    "拉美-非洲混血。": "Of Latin American and African descent.",
    "他有自己的梦想，比如有一天，殖民者能停止掠夺他的家乡。": "He has a dream of his own: that one day colonizers might stop plundering his homeland.",
    "当然，只是个梦想。": "Of course, it is only a dream.",
    "公羊之梦｜经济正增长 +10%；强化有利地形并减轻地形惩罚。": "Ram's Dream | Positive economic growth +10%; improves favorable terrain and reduces terrain penalties.",
    "三体监听员": "Trisolaran Listener",
    "监听员": "Listener",
    "三体世界的监听员。": "A listener from the Trisolaran world.",
    "你已经是身经百战见得多了。": "You have seen more than your share of battles.",
    "你觉得三体世界不好，现在，你来建设它。": "You think the Trisolaran world is not good enough. Now it is yours to rebuild.",
    "监听者｜取消战争迷雾，显示全图军事动向。": "Listener | Removes the fog of war and reveals military movement across the map.",
    "选择起始地块": "Choose a Starting Region",
    "04 / 文明发源地": "04 / CRADLE OF CIVILIZATION",
    "选择一块区域作为首都，初始疆域将在其周围生成。": "Choose a region as your capital. Your starting territory will form around it.",
    "战略拓展": "Strategic Expansion",
    "启用地图": "Enable Map",
    "纯数值模式": "Numbers Only",
    "返回执政官": "Back to Governor",
    "文明尚未抵达终局": "Civilization has not yet reached an ending",
    "战略拓展：展开": "Strategic Expansion: Expanded",
    "战略拓展：折叠": "Strategic Expansion: Collapsed",
    "收起地图、军事与相关决议": "Hide the map, military system, and related decisions",
    "展开战略地图与军事系统": "Show the strategic map and military system",
    "无地下种子库": "No underground seedbank",
    "记忆、艺术与档案": "Memory, art, and archives",
    "战略地图": "STRATEGIC MAP",
    "边境观测尚未开始": "Frontier observation has not begun",
    "地块情报": "REGION INTELLIGENCE",
    "地形攻防": "Terrain Modifiers",
    "部署选中军队": "Deploy Selected Army",
    "政治实体": "POLITICAL ENTITIES",
    "国家策略": "National Strategy",
    "选中军队": "Selected Army",
    "第一军团": "First Legion",
    "选择本国军队，再点击道路相连的地区进行部署。": "Select one of your armies, then choose a road-connected region for deployment.",
    "没有战报。": "No battle reports.",
    "本国": "Your Realm",
    "中立": "Neutral",
    "敌国": "Rival",
    "文明废墟": "Civilization Ruins",
    "归属": "Controller",
    "防御": "Defense",
    "道路": "Roads",
    "驻军": "Garrison",
    "关系": "Relations",
    "领土": "Territory",
    "军力": "Military Strength",
    "发展": "Development",
    "技术": "Technology",
    "阵营": "Faction",
    "驻地": "Station",
    "兵力": "Troops",
    "进攻": "Attack",
    "防守": "Defense",
    "科技加成": "Technology Bonus",
    "战斗力": "Combat Power",
    "战线": "Front Line",
    "军事状态": "Military Status",
    "均衡发展": "Balanced Development",
    "技术优先": "Technology First",
    "要塞国家": "Fortress State",
    "扩张主义": "Expansionism",
    "商业网络": "Trade Network",
    "正信共同体": "Community of True Faith",
    "稳定积累发展、技术与军备。": "Build development, technology, and armaments at a steady pace.",
    "集中资源推进技术与军队现代化。": "Concentrate resources on technology and military modernization.",
    "强化领土工事与守军组织。": "Strengthen territorial fortifications and organize the garrison.",
    "优先扩军并寻找可进攻边境。": "Prioritize military expansion and seek vulnerable frontiers.",
    "以繁荣和补给支撑长期发展。": "Use prosperity and logistics to sustain long-term development.",
    "秩序与共同信仰提高防御韧性。": "Order and shared belief improve defensive resilience.",
    "寒鸦冻原": "Frostcrow Tundra",
    "北境冰原": "Northern Icefields",
    "日冕海岸": "Corona Coast",
    "镜海湾": "Mirror Bay",
    "北辰港": "Polaris Harbor",
    "铁山关": "Ironmount Pass",
    "西陲旷野": "Western Marches",
    "中央盆地": "Central Basin",
    "东部城邦": "Eastern City-States",
    "东崖要塞": "Eastcliff Fortress",
    "盐湖废原": "Salt-Lake Wastes",
    "南门高地": "Southgate Heights",
    "苍穹草原": "Sky Prairie",
    "灰河上游": "Upper Ash River",
    "芦苇沼泽": "Reed Marsh",
    "黑曜荒原": "Obsidian Wastes",
    "赤岩峡谷": "Redrock Canyon",
    "三角洲港群": "Delta Ports",
    "远望海角": "Farwatch Cape",
    "潮汐海墙": "Tidal Seawall",
    "寂静沙丘": "Silent Dunes",
    "南方环坑": "Southern Crater",
    "青绿三角洲": "Verdant Delta",
    "琉璃原野": "Glass Fields",
    "终光海岬": "Lastlight Cape",
    "冻原": "Tundra",
    "海岸": "Coast",
    "山地": "Mountains",
    "平原": "Plains",
    "盆地": "Basin",
    "城邦": "Urban",
    "盐碱地": "Salt Flats",
    "河谷": "River Valley",
    "荒原": "Wasteland",
    "峡谷": "Canyon",
    "自由城邦同盟": "Free Cities Alliance",
    "镜海共和国": "Republic of the Mirror Sea",
    "日冕王庭": "Court of the Corona",
    "灰烬邦联": "Ash Confederacy",
    "铁山卫队": "Ironmount Guard",
    "东部城防军": "Eastern City Guard",
    "北境军团": "Northern Legion",
    "灰河军团": "Ash River Legion",
    "野战军团": "Field Legion",
    "地方军团": "Local Legion",
    "新生军团": "Newborn Legion",
    "重建军团": "Reconstituted Legion",
    "边境暂无大规模军事行动。": "No major military action is taking place on the frontier.",
    "边境静默": "Quiet Frontier",
    "后台形势": "Background Situation",
    "战略拓展已折叠，各国维持军备与边境巡逻。": "Strategic expansion is collapsed; the states maintain their forces and frontier patrols.",
    "边界暂时稳定，没有政治实体能够改变疆域。": "The borders are temporarily stable; no political entity can alter the map.",
    "后台疆域变动": "Background Territorial Shift",
    "国家灭亡": "State Destroyed",
    "中央政府已经失去全部区域，王旗落地。": "The central government has lost every region, and the royal standard has fallen.",
    "国家战略调整": "National Strategy Adjusted",
    "仅可观察": "Observation Only",
    "中立与敌方军队目前只能查看，不能直接指挥。": "Neutral and enemy armies can be observed, but not commanded directly.",
    "无法部署": "Unable to Deploy",
    "军团已经失去作战能力。": "The legion has lost its combat capability.",
    "部署完成": "Deployment Complete",
    "这支军队本年已经行动。": "This army has already acted this year.",
    "这支军队本年已经部署。": "This army has already been deployed this year.",
    "转入防御": "Defensive Posture",
    "道路不通": "No Road Connection",
    "军队只能沿道路向相邻地区部署。": "Armies may deploy only to adjacent regions connected by roads.",
    "防御部署": "Defensive Deployment",
    "无法远征": "Unable to Campaign",
    "当前没有可供部署的本国军队。": "No army from your realm is currently available for deployment.",
    "没有可进攻的接壤区域。": "There is no adjacent region to attack.",
    "敌国没有找到可突破的道路。": "The rival states found no road they could break through.",
    "远征军本次连续控制": "This campaign seized",
    "块领土": "regions in succession",
    "败军无路可退，残部就地溃散。": "The defeated force has no route of retreat, and its remnants scatter on the spot.",
    "进攻方": "Attacker",
    "守军": "Defender",
    "血战": "Bloodbath",
    "冲突": "Clash",
    "战役": "Battle",
    "取得了胜利": "won the battle",
    "进攻方阵亡": "Attacker casualties",
    "守军阵亡": "Defender casualties",
    "灭亡，其军事单位全部解散": "has fallen; all of its military units are disbanded",
    "战争迷雾：边境之外的军事动向无法确认。": "Fog of war: military movement beyond the frontier cannot be confirmed.",
    "战争迷雾": "Fog of War",
    "全域监听": "Full-Spectrum Surveillance",
    "未知阵营": "Unknown Faction",
    "未知地形": "Unknown Terrain",
    "无主地": "Unclaimed Territory",
    "无驻地": "No Station",
    "未选择": "Not Selected",
    "可见": "Visible",
    "地块防御": "Region Defense",
    "基础工事": "Base Fortification",
    "将生成五块连通初始疆域": "Five connected starting regions will be generated",
    "部署防御": "Deploy to Defend",
    "发起进攻": "Launch Attack",
    "仅可部署本国军队": "Only armies from your realm may be deployed",
    "军队已经失去战斗力": "The army has lost all combat power",
    "军队本年已经部署": "The army has already deployed this year",
    "军队本年已部署": "The army has already deployed this year",
    "尚未选择地块": "No region selected",
    "该政治实体已经灭亡。": "This political entity has been destroyed.",
    "已灭亡": "Destroyed",
    "灭亡": "Destroyed",
    "敌对": "Hostile",
    "全图征服": "Total Conquest",
    "危急存亡": "Existential Crisis",
    "征服在望": "Conquest Within Reach",
    "边境拉锯": "Frontier Stalemate",
    "选择一支军队查看状态。": "Select an army to inspect its status.",
    "该军队仅供观察，目前不能直接指挥。": "This army is visible for intelligence purposes but cannot be commanded.",
    "这支军队本年已经部署。推进一年后可再次行动。": "This army has already deployed this year. Advance one year before issuing another order.",
    "选择道路相连的地块查看情报，再用地块面板部署：己方为防御，其他地区为进攻。": "Select a road-connected region for intelligence, then deploy from the region panel: friendly territory means defense; any other territory means attack.",
    "征兵": "Raise Levies",
    "边疆戒严": "Secure the Frontier",
    "强化王权": "Strengthen Royal Authority",
    "整训军团": "Drill the Legion",
    "构筑工事": "Build Fieldworks",
    "发动远征": "Launch Campaign",
    "征兵令贴满城门，青壮年被编入新的军团。": "Conscription orders cover the city gates as young adults are drafted into a new legion.",
    "边疆进入戒严，烽火台、关卡和军需账簿同时运转。": "The frontier enters martial law; beacon towers, checkpoints, and supply ledgers all go into operation.",
    "中央命令压过诸侯私令，王权重新接管军政。": "Central orders override private commands, and the crown retakes control of military affairs.",
    "军官重编队列、旗语与补给章程，军团的进攻能力得到提升。": "Officers rewrite formations, signals, and supply regulations, improving the legion's offensive capability.",
    "军队在当前驻地构筑壕沟、粮站与永久防线。": "The army builds trenches, supply posts, and permanent defenses at its current station.",
    "高成本远征：随机沿道路连续征服至多三块领土，首败即止。": "Costly campaign: advances along roads and may conquer up to three regions, stopping at the first defeat.",
    "抽调青壮年扩军；全军覆没后可在选中的本国领土重建军团。": "Draft young adults to expand the army; after total defeat, rebuild a legion in the selected home region.",
    "把边境纳入战时管制。": "Place the frontier under wartime control.",
    "以中央权威整合军政命令。": "Unify military and political command under central authority.",
    "提升军团进攻能力。": "Improve the legion's offensive capability.",
    "强化当前驻地与军团防御。": "Fortify the current station and strengthen the legion's defense.",
    "我来，我见，我征服。\n——尤利乌斯·凯撒，公元前49年": "I came, I saw, I conquered.\n—Julius Caesar, 49 BCE",
    "天下兴亡，匹夫有责。\n——顾炎武，1639年": "Everyone bears responsibility for the rise or fall of the realm.\n—Gu Yanwu, 1639",
    "沿海省份，应立严禁，无许片帆入海，违者置重典。\n——屯泰，1655年": "The coastal provinces shall be placed under strict prohibition: not a single sail may take to sea, on pain of severe punishment.\n—Tuntai, 1655",
    "君王通过他的建筑而使自己不朽。\n——腓特烈·奥古斯特一世，1728年": "A monarch makes himself immortal through his buildings.\n—Frederick Augustus I, 1728",
    "胜兵先胜而后求战，败兵先战而后求胜。\n——《孙子兵法》": "Victorious warriors win first and then go to war; defeated warriors go to war first and then seek victory.\n—The Art of War",
    "高筑墙、广积粮、缓称王。\n——朱升，1356年": "Build high walls, store abundant grain, and delay claiming the crown.\n—Zhu Sheng, 1356",
    "远征军携带三段行程的补给越过边境；他们将持续推进，直到第三块领土或第一次失败。": "The expedition crosses the frontier with provisions for three marches; it will advance until the third captured region or its first defeat.",
    "征兵令扩充了军队，也把家庭、粮仓与工坊拖进战争。": "The levy expands the army and draws households, granaries, and workshops into the war.",
    "边疆戒严提高了防御，也让贸易路线变得僵硬。": "Frontier martial law improves defense but leaves trade routes rigid.",
    "强化王权让军队更像国家的手臂，而不是地方领主的私产。": "Royal authority makes the army an arm of the state rather than the property of local lords.",
    "军团完成整训，新的进攻章程开始生效。": "The legion completes its drills, and new offensive doctrine takes effect.",
    "军团在驻地构筑工事，区域防御随之增强。": "The legion builds fieldworks at its station, strengthening the region's defense.",
    "未知政策": "Unknown policy",
    "先在地图上选择一块本国领土": "Select one of your own regions on the map first",
    "未知行动": "Unknown action",
    "游戏已经结束": "The game has ended",
    "战略拓展已折叠": "Strategic expansion is collapsed",
    "等待重启文明": "Awaiting civilization restart",
    "分崩离析自动推演中": "Automatic simulation is running after social collapse",
    "尚未出现可结算终局": "No ending is currently available for settlement",
    "当前文明仍在运行": "The current civilization is still active",
    "经济危机，只能重启财政": "Economic crisis: only fiscal recovery is available",
    "ECO 尚未归零": "ECO has not reached zero",
    "文明不再响应控制": "Civilization no longer responds to control",
    "没有可进攻边境": "No frontier is available to attack",
    "选中军队兵力不足": "The selected army lacks sufficient troops",
    "EERF 已建成": "EERF has already been built",
    "尚未建造 EERF": "EERF has not been built",
    "EERF 已满级": "EERF is at maximum level",
    "行动": "Action",
    "快捷键": "Shortcut",
    "全部": "All",
    "灾变": "Disaster",
    "特殊": "Special",
    "军事与特殊政策": "MILITARY & SPECIAL POLICIES",
    "扶持文艺": "Support the Arts",
    "把字刻在石头上。": "Carve the words into stone.",
    "拆掉神坛，修成观测台。": "Tear down the altar and build an observatory.",
    "先让街灯亮起来，再争论谁拥有星空。": "Light the streetlamps first; then debate who owns the stars.",
    "收起望远镜，先听钟声。": "Put away the telescope and listen to the bells.",
    "终局": "ENDING",
    "万王之王": "King of All Kings",
    "末代皇帝": "Viva La Vida",
    "终局资料缺失。": "Ending data is unavailable.",
    "终极答案倒计时归零": "Ultimate Answer Countdown Reaches Zero",
    "查看文明数据": "View Civilization Data",
    "收起文明数据": "Hide Civilization Data",
    "文明数据": "CIVILIZATION DATA",
    "知识与记忆": "Knowledge & Memory",
    "人口与秩序": "Population & Order",
    "开始": "Start",
    "文明数据复盘": "Civilization Data Review",
    "选择文明代际": "Select a Civilization",
    "终局复盘": "Ending Recap",
    "新世界，快捷键 Shift+N": "New World, shortcut Shift+N",
    "使用指定种子开始，快捷键 Enter": "Start with this seed, shortcut Enter",
    "未知": "Unknown",
    "未记录": "Not recorded",
    "尚未记录": "Not recorded yet",
    "尚无地图数据": "No map data",
    "尚无军事数据": "No military data",
    "地图": "Map",
    "指定种子": "Custom Seed",
    "无足够样本": "Not enough data yet",
    "当前执政官": "Current Governor",
    "当前执政官像": "Portrait of the current governor",
    "文明状态": "Civilization Status",
    "执政终端": "Governance Terminal",
    "核心变量": "Core Variables",
    "三恒星战略地图": "Trisolar Strategic Map",
    "地图图例": "Map Legend",
    "区域归属图": "Regional Control Map",
    "玩家行动": "Player Actions",
    "编年史筛选": "Chronicle Filters",
    "选择战略拓展模式": "Choose Strategic Expansion Mode",
    "建立国度": "Found a Realm",
    "选择难度": "Choose Difficulty",
    "选择 AI 侵略性": "Choose AI Aggression",
    "文明摇篮文字游戏": "Cradles of Civilization Text Game",
    "三颗恒星在天幕上留下互相矛盾的轨迹。执政官看着围在篝火旁的各人，那时科学、神学、人口与经济都脆弱不堪：这是一个文明的新生。": "Three stars trace contradictory paths across the sky. The governor looks upon those gathered around the fire, when science, theology, population, and economy are all desperately fragile: this is the birth of a civilization.",
    "当前文明进度会被新世界覆盖，终局统计仍会保留。继续？": "The current civilization will be replaced by a new world. Ending statistics will be preserved. Continue?",
    "经济危机锁死了这项行动。正向发展冻结，只能先重启财政。": "The economic crisis has locked this action. Positive development is frozen; fiscal recovery must come first.",
    "尚未建造 EERF，无法升级不存在的地下设施。": "EERF has not been built, so there is no underground facility to upgrade.",
    "EERF 已达到当前技术能支持的最高等级。": "EERF has reached the highest level supported by current technology.",
    "EERF 已经存在，只能继续升级。": "EERF already exists and can only be upgraded further.",
    "经济尚未归零，重启财政未被触发。": "The economy has not reached zero, so fiscal recovery is unavailable.",
    "经济危机：科学与神学的正向发展冻结": "Economic crisis: positive scientific and theological development is frozen",
    "最后的配给没有等来接收者，文明被迫再次归零。": "The final rations found no one left to receive them, and civilization was forced back to zero.",
    "工业革命擦过地平线，但当前科学基础已不需要这次补课。": "The Industrial Revolution brushes the horizon, but the current scientific base no longer needs the lesson.",
    "中古世纪的影子出现了，但神学基础已经更高。": "The shadow of the Middle Ages appears, but theology has already advanced beyond it.",
    "全图征服已经完成，万王之王等待加冕。": "Total conquest is complete. The King of All Kings awaits coronation.",
    "国土濒临灭亡，末代皇帝的阴影逼近。": "The realm stands on the brink of extinction, and the shadow of the last emperor draws near.",
    "我们即将建成地上天国。": "We are about to build the Promised Land.",
    "我们即将皈依上上善道。": "We are about to embrace the highest good.",
    "我们即将拥有整片星空。": "We are about to claim the whole sky.",
    "我们即将拥有完美信仰。": "We are about to attain perfect faith.",
    "我们即将建成通天高塔。": "We are about to complete the tower to heaven.",
    "我们即将奴役有灵众生。": "We are about to enslave every sentient being.",
    "我们依旧存在。": "We still exist.",
    "我们依然存在。": "We still exist.",
    "直到死去的瞬间，他们依然认为是自己的计算发生了错误。": "Until the moment they died, they still believed their calculations were wrong.",
    "直到死前最后一刻，他们依然认为是自己的信仰陷入了歧途。": "Until their final moment, they still believed their faith had gone astray.",
    "新时代的地上天国就此被灾难无情抹去。后人哀之而不鉴之，亦使后人而复哀后人也。": "The promised land of a new age was mercilessly erased by disaster. Later generations mourned it without learning from it, leaving still later generations to mourn them in turn.",
    "他们没有成就、没有胜利、没有活下来。历史的潮水会抹去他们的踪迹，所有的踪迹。": "They achieved nothing, won nothing, and did not survive. The tide of history will erase every trace of them.",
    "他们跺脚，足以引发地震；他们呼吸，足以改变气候。当然，太阳不在乎。": "Their footsteps could cause earthquakes; their breath could change the climate. The suns, of course, did not care.",
    "鼎铛玉石，金块珠砾，弃掷逦迤。秦人视之，亦不甚惜。": "Bronze vessels were treated as pots, jade as stones, gold as clods, pearls as gravel—cast aside without regret.",
    "欢迎来到加州旅馆，如此可爱的地方，如此美丽的容颜。": "Welcome to the Hotel California: such a lovely place, such a lovely face.",
    "我知道，尘世如露水般短暂；然而，然而。": "I know this world is as fleeting as dew; and yet, and yet.",
    "物理学的大厦已经基本落成，只剩下两朵乌云遮蔽着。——开尔文勋爵，1899年": "The grand edifice of physics is nearly complete; only two small clouds remain. —Lord Kelvin, 1899",
    "万物皆数。——毕达哥拉斯，公元前530年": "All is number. —Pythagoras, 530 BCE",
    "我发现了！——阿基米德，公元前212年": "Eureka! —Archimedes, 212 BCE",
    "现在，我将演示世界运行的规律。——艾萨克·牛顿，1687年": "Now I will demonstrate the laws by which the world moves. —Isaac Newton, 1687",
    "因为我是个白痴。——罗伯特·奥本海默，1954年": "Because I am an idiot. —J. Robert Oppenheimer, 1954",
    "我没有时间了。——埃瓦里斯特·伽罗瓦，1832年": "I have no time. —Évariste Galois, 1832",
    "或许，你们比我更加恐惧！——焦尔达诺·布鲁诺，1600年": "Perhaps you pronounce this sentence with greater fear than I receive it. —Giordano Bruno, 1600",
    "你们可以一眨眼就把他的头砍下来，但那样的头脑一百年再也长不出一个来了！——约瑟夫-路易·拉格朗日，1794年": "It took them only a moment to cut off that head, and a hundred years may not produce another like it. —Joseph-Louis Lagrange, 1794",
    "不要弄坏我的圆！——阿基米德，公元前212年": "Do not disturb my circles! —Archimedes, 212 BCE",
    "盛宴已毕。——杨振宁，1980年": "The feast is over. —Chen-Ning Yang, 1980",
    "起初，神创造天地。——《创世记》1:1": "In the beginning God created the heaven and the earth. —Genesis 1:1",
    "凡事都要规规矩矩地按着次序行。——《哥林多前书》14:40": "Let all things be done decently and in order. —1 Corinthians 14:40",
    "这福音要传遍天下。——《马太福音》24:14": "This gospel shall be preached in all the world. —Matthew 24:14",
    "万膝必向我跪拜，万口必向我承认。——《罗马书》14:11": "Every knee shall bow to me, and every tongue shall confess. —Romans 14:11",
    "日光之下，并无新事。——《传道书》1:9": "There is nothing new under the sun. —Ecclesiastes 1:9",
    "没有异象，民就放肆。——《箴言》29:18": "Where there is no vision, the people perish. —Proverbs 29:18",
    "他们的心远离我。——《以赛亚书》29:13": "Their hearts are far from me. —Isaiah 29:13",
    "你们心持两意要到几时呢？——《列王纪上》18:21": "How long will you waver between two opinions? —1 Kings 18:21",
    "我的神，我的神！为什么离弃我？——《马太福音》27:46": "My God, my God, why have you forsaken me? —Matthew 27:46",
    "虚空的虚空，凡事都是虚空。——《传道书》1:2": "Vanity of vanities; all is vanity. —Ecclesiastes 1:2",
    "微粒封锁假说": "Particle Lockdown Hypothesis",
    "地下档案校订": "Underground Archive Revision",
    "木星般的影子": "A Jovian Shadow",
    "毁灭后待判定": "Pending Post-Collapse Assessment",
    "科学抵达上限": "Science Reaches the Cap",
    "神学抵达上限": "Theology Reaches the Cap",
    "反应堆试车": "Reactor Trial",
    "无神论讲坛": "Atheist Lectern",
    "地下城窒息": "Undercity Suffocation",
    "乱纪元延长": "Chaotic Era Extended",
    "稳定恒纪元": "Stable Era",
    "抄写院失火": "Scriptorium Fire",
    "测绘队归来": "Surveyors Return",
    "旧王陵开启": "Old Royal Tomb Opened",
    "修道院药圃": "Monastery Physic Garden",
    "孤儿院扩建": "Orphanage Expansion",
    "钟表匠罢工": "Clockmakers' Strike",
    "SC 上限": "SC Cap",
    "等待观测": "Awaiting Observation",
    "人口断代": "Population Extinction",
    "系统压力": "System Pressure",
    "不信者税": "Tax on Unbelievers",
    "双相启示": "Dual Revelation",
    "蒸汽管线": "Steam Pipeline",
    "轨道学校": "Orbital School",
    "计算中心": "Computing Center",
    "誓约法庭": "Covenant Court",
    "圣城税册": "Holy City Tax Roll",
    "钟楼合唱": "Belfry Choir",
    "学院神殿联合会": "Academy–Temple Union",
    "双语档案": "Bilingual Archives",
    "拆庙取铜": "Temple Bronze Requisition",
    "禁书清点": "Forbidden Book Census",
    "苦修大队": "Ascetic Corps",
    "环城温室": "Ring-City Greenhouses",
    "排水暴动": "Drainage Riot",
    "债券风波": "Bond Crisis",
    "黑市粮仓": "Black-Market Granary",
    "城邦互疑": "City-State Suspicion",
    "街垒夜谈": "Night Talks at the Barricades",
    "火种演习": "Seedbank Drill",
    "三日凌空": "Three Suns Aloft",
    "引力长鞭": "Gravitational Whip",
    "三日连珠": "Three-Sun Syzygy",
    "烈焰长夜": "Long Night of Flame",
    "板块运动": "Tectonic Upheaval",
    "黑星凌日": "Black Star Transit",
    "三颗飞星": "Three Flying Stars",
    "地层翻页": "Strata Turn Over",
    "神权辩论": "Theocracy Debate",
    "观测失误": "Observation Error",
    "工匠学院": "Artisans' Academy",
    "圣典整理": "Canon Compilation",
    "星象安静": "Quiet Heavens",
    "轨道共振": "Orbital Resonance",
    "盐湖退潮": "Salt Lake Recedes",
    "迁徙争执": "Migration Dispute",
    "井水变甜": "Sweetened Wells",
    "青铜钟裂": "Cracked Bronze Bell",
    "粮仓审计": "Granary Audit",
    "祭日市场": "Festival Market",
    "恒星色变": "Stellar Color Shift",
    "煤烟争议": "Coal-Smoke Dispute",
    "税吏失踪": "Tax Collector Missing",
    "港口复工": "Harbor Reopens",
    "夜校开课": "Night School Opens",
    "矿井歌声": "Songs from the Mine",
    "铸币改革": "Coinage Reform",
    "城墙加高": "Walls Raised",
    "诗歌竞赛": "Poetry Contest",
    "壁画出土": "Unearthed Mural",
    "剧场禁令": "Theater Ban",
    "档案霉变": "Mold in the Archives",
    "巡礼季": "Pilgrimage Season",
    "碎片雨": "Debris Rain",
    "丰收季": "Harvest Season",
    "冷寂季": "Cold Silence",
    "赦免令": "Act of Pardon",
    "干热风": "Hot Dry Wind",
    "热疫": "Heat Plague",
    "未知政权": "Unknown Polity",
    "未判定": "Undetermined",
    "扩张": "Expanding",
    "Independence and Freedom - 独立自由": "Independence and Freedom",
    "Industrial Revolution - 工业革命": "Industrial Revolution",
    "Ashes of Alexandria - 亚历山大灰烬": "Ashes of Alexandria",
    "Remember the Pain - 勿忘国耻": "Remember the Pain",
    "Middle Aged Times - 中古世纪": "Middle Aged Times",
    "Revenge Our Loss - 招核男儿": "Revenge Our Loss",
    "Gender Equality - 两性平等": "Gender Equality",
    "Divide and Fall - 分崩离析": "Divide and Fall",
    "Answers to All - 终极答案": "Answers to All",
    "Union We Stand - 团结永存": "Union We Stand",
    "Nature Goddess - 自然对数": "Nature Goddess",
    "Genesis Birth - 创世出生": "Genesis Birth",
    "God Not Found - 查无此神": "God Not Found",
    "Plague Inc. - 瘟疫公司": "Plague Inc.",
    "No Meaning - 虚无主义": "No Meaning",
    "The Tempest - 暴风雨": "The Tempest",
    "Civil War - 三体内战": "Civil War",
    "No Refund - 概不退款": "No Refund",
    "ReUnion - 叛军起义": "ReUnion",
    "Anarchy - 时代终结": "Anarchy",
    "像": " portrait",
    "无政府": "Anarchy",
    "封建": "Feudalism",
    "君主立宪": "Constitutional Monarchy",
    "资本主义": "Capitalism",
    "极权国家": "Totalitarian State",
    "荒无人烟": "Desolate",
    "衰退": "Declining",
    "停滞": "Stalled",
    "萌芽": "Budding",
    "成形": "Formed",
    "群星璀璨": "Brilliant Constellation",
    "上扬": "Rising",
    "激增": "Surging",
    "下滑": "Falling",
    "收缩": "Contracting",
    "崩落": "Collapsing",
    "经济危机：发展冻结": "Economic crisis: development frozen",
    "趋势播报": "Trend Report",
    "升级至": "Rises to ",
    "降级至": "Falls to ",
    "科学趋势变为": "Science trend changes to ",
    "神学趋势变为": "Theology trend changes to ",
    "科学": "Science",
    "神学": "Theology",
    "暂无观测": "No observations yet",
    "文明还没有足够数据形成终局判断。": "Civilization does not yet have enough data for an ending assessment.",
    "还差": "Remaining",
    "控制区域": "Controlled Regions",
    "剩余区域": "Remaining Regions",
    "已同步封顶，转入双相判断": "has also reached the cap; switching to the paired-state check",
    "需降至": "must fall to",
    "以下": "or below",
    "状态": "Status",
    "火种人口": "Seedbank Population",
    "火种知识": "Seedbank Knowledge",
    "火种趋势": "Seedbank Trends",
    "下一代 EERF": "Next-generation EERF",
    "当前等级": "Current Level",
    "LA 保存增幅": "LA Preservation Bonus",
    "毁灭后人口": "Post-collapse Population",
    "毁灭后知识": "Post-collapse Knowledge",
    "毁灭后趋势": "Post-collapse Trends",
    "下级需求": "Next-level Requirement",
    "已满级": "Maximum level reached",
    "升级需 SC": "Upgrade requires SC",
    "ECO 不足": "Insufficient ECO:",
    "人口需高于": "Population must exceed",
    "地区": "regions",
    "种": "types",
    "次": "times",
    "最近": "Latest",
    "特殊：无": "Special: none",
    "特殊：": "Special: ",
    "未知终止": "Unknown termination",
    "等待重启文明；火种人口": "Awaiting civilization restart; seedbank population",
    "尚未修建EERF；下一代初始人口": "EERF has not been built; next-generation starting population",
    "下一级需 SC": "next level requires SC",
    "已达满级": "maximum level reached",
    "灾后火种等级": "Post-collapse seedbank level",
    "下一代初始人口约": "estimated next-generation starting population",
    "本代已记录记忆饱和": "Memory saturation recorded in this civilization",
    "连续文明": "consecutive civilizations",
    "EERF 线性保存增幅": "EERF linear preservation bonus",
    "文明苏醒": "Civilization Awakens",
    "开始文明演化": " begins its civilizational evolution",
    "战略地图升级": "Strategic Map Upgrade",
    "旧战略层已迁移到固定的 64 省大陆。文明数值、EERF 与文明编年史全部保留；旧 25 格疆域和驻军按当前种子重新生成。": "The old strategic layer has been migrated to the fixed 64-province continent. Civilization metrics, EERF, and the chronicle are preserved; the old 25-region borders and armies are regenerated from the current seed.",
    "载入存档": "Save Loaded",
    "存档恢复": "Save Restored"
  };

  const mapData = global.CRADLES_MAP_LAB_DATA;
  const MAP_PAIRS = Object.freeze(Object.fromEntries([
    ...(mapData?.provinces || []).map((province) => [province.nameZh, province.nameEn]),
    ...(mapData?.strategicRegions || []).map((region) => [region.nameZh, region.nameEn]),
    ...(mapData?.realms || []).flatMap((realm) => [
      [realm.nameZh, realm.nameEn],
      [realm.shortZh, realm.shortEn]
    ]),
    ...Object.values(mapData?.terrainTypes || {}).map((terrain) => [terrain.nameZh, terrain.nameEn])
  ].filter(([source, target]) => source && target)));
  const EXACT_PAIRS = Object.freeze({ ...CORE_PAIRS, ...WEB_PAIRS, ...MAP_PAIRS });
  const SEGMENT_PAIRS = Object.entries(EXACT_PAIRS)
    .filter(([source]) => source.length > 1 && !source.includes("\\"))
    .sort(([left], [right]) => right.length - left.length);

  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  let language = "zh";
  let protectedTerms = [];
  let observer = null;
  let localizationQueued = false;

  function normalizeLanguage(value) {
    const normalized = String(value || "").toLowerCase().split("-")[0];
    return SUPPORTED_LANGUAGES.has(normalized) ? normalized : "zh";
  }

  function readStoredLanguage() {
    try {
      return normalizeLanguage(localStorage.getItem(LANGUAGE_STORE_KEY));
    } catch {
      return "zh";
    }
  }

  function writeStoredLanguage(value) {
    try {
      localStorage.setItem(LANGUAGE_STORE_KEY, value);
    } catch {
      // Language selection still works for this page view without storage.
    }
  }

  function languageFromUrl() {
    try {
      const requested = new URL(window.location.href).searchParams.get("lang");
      return SUPPORTED_LANGUAGES.has(requested) ? requested : null;
    } catch {
      return null;
    }
  }

  function updateLanguageInUrl(value) {
    try {
      const url = new URL(window.location.href);
      if (value === "en") url.searchParams.set("lang", "en");
      else url.searchParams.delete("lang");
      window.history?.replaceState?.({}, "", url.href);
    } catch {
      // URL synchronization is optional.
    }
  }

  function init() {
    language = languageFromUrl() || readStoredLanguage();
    writeStoredLanguage(language);
    startObserver();
    return language;
  }

  function startObserver() {
    if (observer || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
    const target = document.documentElement;
    if (!target) return;
    observer = new MutationObserver(() => {
      if (!isEnglish() || localizationQueued) return;
      localizationQueued = true;
      queueMicrotask(() => {
        localizationQueued = false;
        localizeDocument(document);
      });
    });
    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["title", "aria-label", "placeholder", "alt"]
    });
  }

  function getLanguage() {
    return language;
  }

  function isEnglish() {
    return language === "en";
  }

  function locale() {
    return isEnglish() ? "en-US" : "zh-CN";
  }

  function t(chinese, english) {
    return isEnglish() ? english : chinese;
  }

  function translateDynamic(value) {
    const en = (part) => translate(part, "en").trim();
    let match;

    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明(?:｜(.+))?$/u))) {
      return `Civilization ${match[1]}${match[2] ? ` | ${en(match[2])}` : ""}`;
    }
    if ((match = value.match(/^([\d,.]+)\s+年$/u))) {
      return `${match[1]} years`;
    }
    if ((match = value.match(/^已达成\s+([\d,.]+)\s+种\s+\/\s+总计\s+([\d,.]+)\s+次$/u))) {
      return `${match[1]} endings reached / ${match[2]} total`;
    }
    if ((match = value.match(/^可见\s+([\d,.]+)\/([\d,.]+)$/u))) {
      return `Visible ${match[1]}/${match[2]}`;
    }
    if ((match = value.match(/^本代已记录记忆饱和；连续文明\s+([\d,.]+)\/([\d,.]+)$/u))) {
      return `Memory saturation recorded in this civilization; ${match[1]}/${match[2]} consecutive civilizations`;
    }
    if ((match = value.match(/^(.+?)\s+([\d.]+k)\s+\/\s+([IV]+)$/u))) {
      return `${en(match[1])} ${match[2]} / ${match[3]}`;
    }
    if (value.includes("升级至") || value.includes("降级至")) {
      const trendParts = value.split("；");
      const translatedTrendParts = trendParts.map((part) => {
        const trendMatch = part.match(/^(.+?)(升级至|降级至)(.+)$/u);
        if (!trendMatch) return null;
        const direction = trendMatch[2] === "升级至" ? "rises to" : "falls to";
        return `${en(trendMatch[1])} ${direction} ${en(trendMatch[3])}`;
      });
      if (translatedTrendParts.every(Boolean)) return translatedTrendParts.join("; ");
    }
    if ((match = value.match(/^(.+)开始文明演化$/u))) {
      return `${en(match[1])} begins its civilizational evolution`;
    }
    if ((match = value.match(/^极端环境抵抗设施赶在灾变抵达前完成最后一次封门。(.+)$/u))) {
      return `The Extreme Environment Resistance Facility seals its final door before the disaster arrives. ${en(match[1])}`;
    }
    if ((match = value.match(/^(.+) EERF 无法替地表人口承受这次屠杀。$/u))) {
      return `${en(match[1])} EERF cannot shield the surface population from this slaughter.`;
    }
    if ((match = value.match(/^(.+)趋势变为(.+)。$/u))) {
      return `${en(match[1])} trend changes to ${en(match[2])}.`;
    }
    if ((match = value.match(/^冷却\s+([\d,.]+)\s+年$/u))) {
      return `${match[1]} years of cooldown remaining`;
    }
    if ((match = value.match(/^(.+)，快捷键\s+(.+)$/u))) {
      return `${en(match[1])}, shortcut ${match[2]}`;
    }
    if ((match = value.match(/^(.+)在(.+)边境试探后撤回。$/u))) {
      return `${en(match[1])} probes the frontier at ${en(match[2])}, then withdraws.`;
    }
    if ((match = value.match(/^(.+)接管(.+)，(.+)仍保有核心疆域。$/u))) {
      return `${en(match[1])} takes control of ${en(match[2])}; ${en(match[3])} still holds its core territory.`;
    }
    if ((match = value.match(/^(.+)开始执行“(.+)”。$/u))) {
      return `${en(match[1])} adopts the ${en(match[2])} strategy.`;
    }
    if ((match = value.match(/^(.+)在(.+)进入防御姿态。$/u))) {
      return `${en(match[1])} assumes a defensive posture at ${en(match[2])}.`;
    }
    if ((match = value.match(/^(.+)沿道路进驻(.+)。$/u))) {
      return `${en(match[1])} moves along the road into ${en(match[2])}.`;
    }
    if ((match = value.match(/^败军撤往(.+)。$/u))) {
      return `The defeated force retreats to ${en(match[1])}.`;
    }
    if ((match = value.match(/^(.+)灭亡，其军事单位全部解散(。)?$/u))) {
      return `${en(match[1])} has fallen; all of its military units are disbanded${match[2] ? "." : ""}`;
    }
    if ((match = value.match(/^(.+?)(血战|冲突|战役)：(.+)$/u))) {
      const label = match[2] === "血战" ? "Bloodbath at" : match[2] === "冲突" ? "Clash at" : "Battle of";
      return `${label} ${en(match[1])}: ${en(match[3])}`;
    }
    if ((match = value.match(/^(.+)(血战|冲突|战役)$/u))) {
      const label = match[2] === "血战" ? "Bloodbath at" : match[2] === "冲突" ? "Clash at" : "Battle of";
      return `${label} ${en(match[1])}`;
    }
    if ((match = value.match(/^(.+) 之后，旧地图失效。$/u))) {
      return `After ${en(match[1])}, the old map is no longer valid.`;
    }
    if ((match = value.match(/^(.+)和(.+)的军队在(.+)相遇。最终(.+)取得了胜利，(.+)\s+进攻方阵亡\s+([\d,.]+)（([^）]+)），守军阵亡\s+([\d,.]+)（([^）]+)）。(.*)$/u))) {
      const elimination = match[10] ? ` ${en(match[10])}` : "";
      return `${en(match[1])} and ${en(match[2])} meet in battle at ${en(match[3])}. ${en(match[4])} wins. ${en(match[5])} Attacker casualties: ${match[6]} (${match[7]}); defender casualties: ${match[8]} (${match[9]}).${elimination}`;
    }
    if ((match = value.match(/^(.+)｜攻\s+([^｜]+)｜防\s+([^｜]+)｜基础工事\s+([^｜]+)｜将生成五块连通初始疆域$/u))) {
      return `${en(match[1])} | ATK ${match[2].trim()} | DEF ${match[3].trim()} | Base fortification ${match[4].trim()} | Five connected starting regions will be generated`;
    }
    if ((match = value.match(/^(.+)｜攻\s+([^｜]+)｜防\s+([^｜]+)｜基础工事\s+([^｜]+)｜将围绕首都生成\s+([^ ]+)\s+块连通初始疆域$/u))) {
      return `${en(match[1])} | ATK ${match[2].trim()} | DEF ${match[3].trim()} | Base fortification ${match[4].trim()} | Generates ${match[5].trim()} connected starting provinces around this capital`;
    }
    if ((match = value.match(/^(.+)，(.+)，地块防御\s+(.+)$/u))) {
      return `${en(match[1])}, ${en(match[2])}, region defense ${match[3]}`;
    }
    if ((match = value.match(/^(.+)\s+·\s+防\s+(.+)$/u))) {
      return `${en(match[1])} · DEF ${match[2]}`;
    }
    if ((match = value.match(/^(.+)｜(.+)｜兵力\s+([^｜]+)｜战斗力\s+([IV]+)（([^）]+)）$/u))) {
      return `${en(match[1])} | ${en(match[2])} | troops ${match[3].trim()} | combat power ${match[4]} (${match[5]})`;
    }
    if ((match = value.match(/^Seed\s+([^｜]+)｜([^｜]+)｜AI\s+([^｜]+)｜([^｜]+)｜本国\s+([^｜]+)｜中立\s+([^｜]+)｜敌国\s+([^｜]+)｜(.+)$/u))) {
      return `Seed ${match[1].trim()} | ${en(match[2])} | AI ${en(match[3])} | ${en(match[4])} | your realm ${match[5].trim()} | neutral ${match[6].trim()} | rivals ${match[7].trim()} | ${en(match[8])}`;
    }
    if ((match = value.match(/^(.+)｜攻\s+([^｜]+)｜防\s+(.+)$/u))) {
      return `${en(match[1])} | ATK ${match[2].trim()} | DEF ${match[3].trim()}`;
    }
    if ((match = value.match(/^将(.+)部署至(.+)$/u))) {
      return `Deploy ${en(match[1])} to ${en(match[2])}`;
    }
    if ((match = value.match(/^(.+)\s+·\s+([\d,.]+)\s+地区$/u))) {
      return `${en(match[1])} · ${match[2]} regions`;
    }
    if ((match = value.match(/^还差：(.+)$/u))) {
      return `Remaining: ${en(match[1])}`;
    }
    if ((match = value.match(/^(.+)\s+需降至\s+(.+)\s+以下$/u))) {
      return `${en(match[1])} must fall to ${match[2]} or below`;
    }
    if ((match = value.match(/^已达成\s+([\d,.]+)\/([\d,.]+)\s+种｜总计\s+([\d,.]+)\s+次｜最近\s+(.+)$/u))) {
      return `${match[1]}/${match[2]} endings reached | ${match[3]} total | Latest: ${en(match[4])}`;
    }
    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明｜([\d,.]+)\s+年$/u))) {
      return `Civilization ${match[1]} | ${match[2]} years`;
    }
    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明苏醒$/u))) {
      return `Civilization ${match[1]} Awakens`;
    }
    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明从 EERF 火种中启动。$/u))) {
      return `Civilization ${match[1]} starts from the EERF seedbank.`;
    }
    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明从 EERF 和废墟档案里醒来。$/u))) {
      return `Civilization ${match[1]} awakens from EERF and the ruin archives.`;
    }
    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明毁灭，等待重启文明$/u))) {
      return `Civilization ${match[1]} collapsed; awaiting restart`;
    }
    if ((match = value.match(/^([A-L])结局可结算。可继续发展，或点击脱离苦海$/u))) {
      return `Ending ${match[1]} is available. Continue developing, or choose Settle Ending.`;
    }
    if ((match = value.match(/^([A-L])结局已经抵达$/u))) {
      return `Ending ${match[1]} has been reached`;
    }
    if ((match = value.match(/^终极答案倒计时：还剩\s+([\d,.]+)\s+次行动$/u))) {
      return `Ultimate Answer countdown: ${match[1]} actions remaining`;
    }
    if ((match = value.match(/^永志不忘观测：连续\s+([^\s]+)\s+代文明曾使 LA 达到记忆饱和$/u))) {
      return `Here's Looking At You watch: ${match[1]} consecutive civilizations reached LA memory saturation`;
    }
    if ((match = value.match(/^罗马再临观测：连续\s+([^\s]+)\s+代文明以无政府收束$/u))) {
      return `Do As the Romans Do watch: ${match[1]} consecutive civilizations ended in anarchy`;
    }
    if ((match = value.match(/^全图征服已经完成，军力达到\s+([\d,.]+)\s+后方可加冕。$/u))) {
      return `Total conquest is complete. Reach ${match[1]} military strength to claim the crown.`;
    }
    if ((match = value.match(/^(.+)\s+需\s+([\d,.]+)$/u))) {
      return `${en(match[1])} requires ${match[2]}`;
    }
    if ((match = value.match(/^(.+) 被各自为政的城邦吞没，文明不再响应玩家控制。$/u))) {
      return `${en(match[1])} is swallowed by autonomous city-states, and civilization no longer responds to player control.`;
    }
    if ((match = value.match(/^升级至 EERF\s+([\d,.]+)\s+级需要 SC\s+([\d,.]+)。$/u))) {
      return `Upgrading EERF to level ${match[1]} requires ${match[2]} SC.`;
    }
    if ((match = value.match(/^(.+) 需要\s+([\d,.]+)\s+ECO，当前经济无法支付。$/u))) {
      return `${en(match[1])} requires ${match[2]} ECO, which the current economy cannot afford.`;
    }
    if ((match = value.match(/^(.+) 会让人口跌破最低可持续线\s+([\d,.]+)\s+POP。$/u))) {
      return `${en(match[1])} would reduce the population below the minimum sustainable threshold of ${match[2]} POP.`;
    }
    if ((match = value.match(/^(.+) 第\s+([\d,.]+)\s+号文明进化至(.+)。EERF 将保存人口\s+([\d,.]+)、少量知识与少量趋势。$/u))) {
      return `${en(match[1])} Civilization ${match[2]} advanced to ${en(match[3])}. EERF will preserve a population of ${match[4]}, along with limited knowledge and momentum.`;
    }
    if ((match = value.match(/^(.+) 第\s+([\d,.]+)\s+号文明在(.+)中毁灭了，该文明进化至(.+)。文明的种子仍在，它将重新启动，再次开启在三体世界中命运莫测的进化。$/u))) {
      return `${en(match[1])} Civilization ${match[2]} was destroyed by ${en(match[3])}, after advancing to ${en(match[4])}. Its seed remains; it will restart and begin another uncertain evolution in the Trisolaran world.`;
    }
    if ((match = value.match(/^连续\s+([\d,.]+)\s+代文明毁灭时科学峰值未突破青铜停滞阈值\s+([\d,.]+)$/u))) {
      return `${match[1]} consecutive civilizations collapsed without science exceeding the Bronze Age stagnation threshold of ${match[2]}`;
    }
    if ((match = value.match(/^连续\s+([\d,.]+)\s+代文明以无政府秩序收束（低于\s+([\d,.]+)）$/u))) {
      return `${match[1]} consecutive civilizations ended in anarchy (below ${match[2]} order)`;
    }
    if ((match = value.match(/^连续\s+([\d,.]+)\s+代文明曾使 LA 达到\s+([\d,.]+)$/u))) {
      return `${match[1]} consecutive civilizations reached ${match[2]} LA`;
    }
    if ((match = value.match(/^第\s+([\d,.]+)\s+号文明在\s+(.+)\s+后抵达终局。游戏结束。终局统计已更新。$/u))) {
      return `Civilization ${match[1]} reached its ending after ${en(match[2])}. The game is over, and ending statistics have been updated.`;
    }
    if ((match = value.match(/^(.+)像$/u))) {
      return `Portrait of ${en(match[1])}`;
    }
    if ((match = value.match(/^(.+)｜无特殊事件$/u))) {
      return `${en(match[1])} | NO SPECIAL EVENT`;
    }
    if ((match = value.match(/^灾后火种等级\s+([^；]+)；下一代初始人口约\s+([^；]+)；SC\/BE 约\s+([^；]+)；LA 保存增幅\s+(.+)$/u))) {
      return `Post-collapse seedbank level ${match[1]}; estimated next-generation population ${match[2]}; SC/BE approx. ${match[3]}; LA preservation bonus ${en(match[4])}`;
    }
    if ((match = value.match(/^王侯将相，宁有种乎？\s*\n——陈胜、吴广，公元前209年。\s*\n叛军夺取粮仓与观测站，人口损失\s+([\d,.]+)。$/u))) {
      return `Are kings and nobles born to their stations?\n—Chen Sheng and Wu Guang, 209 BCE.\nRebels seize the granaries and observatories; population loses ${match[1]}.`;
    }
    if ((match = value.match(/^消灭三体暴政，世界属于人类。\s*\n人口被除以\s+([\d,.]+)，经济损失\s+([\d,.]+)。$/u))) {
      return `Destroy Trisolaran tyranny; the world belongs to humanity.\nPopulation is divided by ${match[1]}, and the economy loses ${match[2]}.`;
    }
    if ((match = value.match(/^工厂、滚轮和蒸汽噪声同时启动，科学被推至\s+([\d,.]+)。$/u))) {
      return `Factories, rollers, and the noise of steam start together, pushing science to ${match[1]}.`;
    }
    if ((match = value.match(/^旧秩序用城墙、钟声和滚轮重组信仰，BE 被推至\s+([\d,.]+)。$/u))) {
      return `The old order reorganizes belief through walls, bells, and rollers, pushing BE to ${match[1]}.`;
    }
    return null;
  }

  function translate(source, targetLanguage = language) {
    if (source === null || source === undefined) return "";
    const value = String(source);
    if (normalizeLanguage(targetLanguage) !== "en" || !value) return value;

    if (protectedTerms.includes(value.trim())) return value;

    if (Object.prototype.hasOwnProperty.call(EXACT_PAIRS, value)) {
      return EXACT_PAIRS[value];
    }

    const leadingWhitespace = value.match(/^\s*/u)?.[0] || "";
    const trailingWhitespace = value.match(/\s*$/u)?.[0] || "";
    const coreValue = value.slice(leadingWhitespace.length, value.length - trailingWhitespace.length);
    if (!coreValue) return value;

    if (Object.prototype.hasOwnProperty.call(EXACT_PAIRS, coreValue)) {
      return `${leadingWhitespace}${EXACT_PAIRS[coreValue]}${trailingWhitespace}`;
    }

    if (!HAN_PATTERN.test(coreValue)) return value;

    const dynamicTranslation = translateDynamic(coreValue);
    if (dynamicTranslation !== null) {
      return `${leadingWhitespace}${dynamicTranslation}${trailingWhitespace}`;
    }

    const protectedValues = [];
    let result = coreValue;
    protectedTerms.forEach((term) => {
      if (!term || !result.includes(term)) return;
      const token = `\uE000${protectedValues.length}\uE001`;
      protectedValues.push(term);
      result = result.split(term).join(token);
    });
    for (const [chinese, english] of SEGMENT_PAIRS) {
      if (result.includes(chinese)) result = result.split(chinese).join(english);
    }

    result = result
      .replace(/第\s*(\d+)\s*号文明/g, "Civilization $1")
      .replace(/第\s*(\d+)\s*年/g, "Year $1")
      .replace(/第\s*(\d+)\s*号/g, "No. $1")
      .replace(/还剩\s*(\d+)\s*次行动/g, "$1 actions remaining")
      .replace(/需要\s*([\d,.]+)\s*(SC|BE|LA|POP|ECO)/g, "Requires $1 $2")
      .replace(/([A-L])结局/g, "Ending $1")
      .replace(/([+-]?[\d,.]+)\/年/g, "$1/year")
      .replace(/，/g, ", ")
      .replace(/；/g, "; ")
      .replace(/：/g, ": ")
      .replace(/。/g, ".")
      .replace(/｜/g, " | ")
      .replace(/（/g, " (")
      .replace(/）/g, ")");

    result = result.replace(/[ \t]+([,.;:!?])/g, "$1").replace(/[ \t]{2,}/g, " ").trim();
    protectedValues.forEach((term, index) => {
      result = result.split(`\uE000${index}\uE001`).join(term);
    });
    return `${leadingWhitespace}${result}${trailingWhitespace}`;
  }

  function setProtectedTerms(terms = []) {
    protectedTerms = Array.from(new Set(
      terms.map((term) => String(term || "").trim()).filter(Boolean)
    )).sort((left, right) => right.length - left.length);
  }

  function rememberTextSource(node) {
    const current = node.nodeValue || "";
    let record = textSources.get(node);
    if (!record) {
      record = { source: current, last: null };
      textSources.set(node, record);
    } else if (current !== record.last) {
      record.source = current;
    }
    return record;
  }

  function rememberAttributeSource(element, name) {
    let records = attributeSources.get(element);
    if (!records) {
      records = new Map();
      attributeSources.set(element, records);
    }
    const current = element.getAttribute(name) || "";
    let record = records.get(name);
    if (!record) {
      record = { source: current, last: null };
      records.set(name, record);
    } else if (current !== record.last) {
      record.source = current;
    }
    return record;
  }

  function localizeDocument(root = document) {
    if (!root?.documentElement || typeof root.createTreeWalker !== "function") return;

    root.documentElement.lang = isEnglish() ? "en" : "zh-CN";
    const walker = root.createTreeWalker(root.documentElement, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-i18n-skip]") || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return;
      const record = rememberTextSource(node);
      const next = translate(record.source);
      if (node.nodeValue !== next) node.nodeValue = next;
      record.last = next;
    });

    root.querySelectorAll("[title], [aria-label], [placeholder], [alt]").forEach((element) => {
      ["title", "aria-label", "placeholder", "alt"].forEach((name) => {
        if (!element.hasAttribute(name) || element.closest("[data-i18n-skip]")) return;
        const record = rememberAttributeSource(element, name);
        const next = translate(record.source);
        if (element.getAttribute(name) !== next) element.setAttribute(name, next);
        record.last = next;
      });
    });

    const toggle = root.querySelector("#languageToggle");
    if (toggle) {
      const label = isEnglish() ? "中文" : "EN";
      const accessibleLabel = isEnglish() ? "Switch to Chinese" : "切换到英文";
      if (toggle.textContent !== label) toggle.textContent = label;
      if (toggle.getAttribute("aria-label") !== accessibleLabel) toggle.setAttribute("aria-label", accessibleLabel);
      if (toggle.title !== accessibleLabel) toggle.title = accessibleLabel;
    }
  }

  function setLanguage(value, options = {}) {
    language = normalizeLanguage(value);
    if (options.persist !== false) writeStoredLanguage(language);
    if (options.updateUrl !== false) updateLanguageInUrl(language);
    return language;
  }

  function toggle() {
    return setLanguage(isEnglish() ? "zh" : "en");
  }

  function hasHan(value) {
    return HAN_PATTERN.test(String(value || ""));
  }

  global.CRADLES_I18N = Object.freeze({
    init,
    getLanguage,
    isEnglish,
    locale,
    t,
    translate,
    localizeDocument,
    setLanguage,
    toggle,
    setProtectedTerms,
    hasHan
  });
})(globalThis);
