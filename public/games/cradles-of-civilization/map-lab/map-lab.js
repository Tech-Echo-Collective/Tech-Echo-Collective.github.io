"use strict";

(function runMapLab() {
  const DATA = window.CRADLES_MAP_LAB_DATA;
  const MODEL = window.CRADLES_MAP_LAB_MODEL;
  if (!DATA || !MODEL) throw new Error("Map Lab data or model failed to load.");

  const SVG_NS = "http://www.w3.org/2000/svg";
  const LANGUAGE_KEY = "three-sun-chronicle:language:v1";
  const RELIEF_KEY = "three-sun-chronicle:map-relief:v1";
  const RECRUIT_FORCE = Math.max(1, Math.round(Number(MODEL.RECRUITMENT_FORCE) || 5200));
  const RECRUIT_COOLDOWN = Math.max(1, Math.round(Number(MODEL.RECRUITMENT_COOLDOWN) || 4));
  const MODES = new Set(["political", "terrain", "military"]);
  const RELIEF_PROJECTION = Object.freeze({ x: 0.34, y: 1 });
  const RELIEF_DEPTHS = Object.freeze({
    coast: 2,
    river: 3,
    basin: 4,
    plain: 5,
    tundra: 5,
    waste: 6,
    canyon: 9,
    mountain: 11
  });
  const params = new URLSearchParams(window.location.search);

  const dom = {
    body: document.body,
    mapStage: document.querySelector("#mapStage"),
    mapSvg: document.querySelector("#mapSvg"),
    worldLayer: document.querySelector("#worldLayer"),
    landClipPath: document.querySelector("#landClipPath"),
    landDepth: document.querySelector("#landDepth"),
    landBase: document.querySelector("#landBase"),
    coastLine: document.querySelector("#coastLine"),
    oceanDetailLayer: document.querySelector("#oceanDetailLayer"),
    provinceLayer: document.querySelector("#provinceLayer"),
    provinceReliefLayer: document.querySelector("#provinceReliefLayer"),
    terrainTextureLayer: document.querySelector("#terrainTextureLayer"),
    routeLayer: document.querySelector("#routeLayer"),
    riverLayer: document.querySelector("#riverLayer"),
    strategicBorderLayer: document.querySelector("#strategicBorderLayer"),
    realmBorderLayer: document.querySelector("#realmBorderLayer"),
    capitalLayer: document.querySelector("#capitalLayer"),
    realmLabelLayer: document.querySelector("#realmLabelLayer"),
    strategicLabelLayer: document.querySelector("#strategicLabelLayer"),
    provinceLabelLayer: document.querySelector("#provinceLabelLayer"),
    armyLayer: document.querySelector("#armyLayer"),
    modeButtons: Array.from(document.querySelectorAll("[data-map-mode]")),
    seedForm: document.querySelector("#seedForm"),
    seedInput: document.querySelector("#seedInput"),
    reliefToggle: document.querySelector("#reliefToggle"),
    languageToggle: document.querySelector("#languageToggle"),
    returnLink: document.querySelector("#returnLink"),
    legendModeName: document.querySelector("#legendModeName"),
    legendItems: document.querySelector("#legendItems"),
    geographyReadout: document.querySelector("#geographyReadout"),
    scenarioReadout: document.querySelector("#scenarioReadout"),
    zoomReadout: document.querySelector("#zoomReadout"),
    phaseStatus: document.querySelector("#phaseStatus"),
    endPhaseButton: document.querySelector("#endPhaseButton"),
    turnBadge: document.querySelector("#turnBadge"),
    zoomInButton: document.querySelector("#zoomInButton"),
    zoomOutButton: document.querySelector("#zoomOutButton"),
    zoomResetButton: document.querySelector("#zoomResetButton"),
    mapTooltip: document.querySelector("#mapTooltip"),
    inspector: document.querySelector("#inspector"),
    inspectorToggle: document.querySelector("#inspectorToggle"),
    inspectorEyebrow: document.querySelector("#inspectorEyebrow"),
    inspectorContent: document.querySelector("#inspectorContent"),
    provinceCode: document.querySelector("#provinceCode"),
    provinceName: document.querySelector("#provinceName"),
    provinceRegion: document.querySelector("#provinceRegion"),
    recruitPanel: document.querySelector("#recruitPanel"),
    recruitStatus: document.querySelector("#recruitStatus"),
    recruitFeedback: document.querySelector("#recruitFeedback"),
    recruitButton: document.querySelector("#recruitButton"),
    phaseReport: document.querySelector("#phaseReport"),
    phaseReportTitle: document.querySelector("#phaseReportTitle"),
    phaseReportActions: document.querySelector("#phaseReportActions"),
    battleReport: document.querySelector("#battleReport"),
    battleReportTitle: document.querySelector("#battleReportTitle"),
    battleReportText: document.querySelector("#battleReportText"),
    provinceFacts: Array.from(document.querySelectorAll(".province-facts > div")),
    provinceArmies: document.querySelector("#provinceArmies"),
    inspectorNote: document.querySelector("#inspectorNote"),
    liveRegion: document.querySelector("#liveRegion")
  };

  const geography = MODEL.buildGeography(DATA);
  const provinceNodes = new Map();
  const reliefNodes = new Map();
  const textureNodes = new Map();
  const provinceLabelNodes = new Map();
  const realmBorderNodes = [];
  const capitalNodes = new Map();
  const realmLabelNodes = new Map();
  const armyNodes = new Map();
  const pointers = new Map();
  let language = preferredLanguage();
  let mode = MODES.has(params.get("mode")) ? params.get("mode") : "political";
  let reliefMode = preferredReliefMode();
  let scenario = MODEL.createScenario(DATA, geography, params.get("seed") || "1058");
  let camera = MODEL.clampCamera({
    cx: DATA.viewBox.x + DATA.viewBox.width / 2,
    cy: DATA.viewBox.y + DATA.viewBox.height / 2,
    zoom: 1
  }, DATA.viewBox);
  let selectedProvinceId = geography.provinceById[DATA.initialSelection]?.id || DATA.provinces[0].id;
  let selectedArmyId = null;
  let movementCount = 0;
  let lastBattleReport = null;
  let lastPhaseReport = null;
  let lastRecruitReport = null;
  let combatLockedUntil = 0;
  let phaseLockedUntil = 0;
  let recruitLockedUntil = 0;
  let dragState = null;
  let pinchState = null;
  let suppressClick = false;

  function preferredLanguage() {
    const requested = String(params.get("lang") || "").toLowerCase();
    if (requested === "en" || requested === "zh") return requested;
    try {
      return localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  }

  function preferredReliefMode() {
    const requested = String(params.get("relief") || "").toLowerCase();
    if (requested === "2d" || requested === "3d") return requested;
    try {
      return localStorage.getItem(RELIEF_KEY) === "2d" ? "2d" : "3d";
    } catch {
      return "3d";
    }
  }

  function t(chinese, english) {
    return language === "en" ? english : chinese;
  }

  function localizedName(record) {
    return language === "en" ? record?.nameEn : record?.nameZh;
  }

  function realmRelation(realmId) {
    if (typeof MODEL.realmRelation === "function") return MODEL.realmRelation(scenario, realmId);
    if (realmId === "player-realm") return "player";
    return scenario.realmRelations?.[realmId] || "hostile";
  }

  function relationName(realmId) {
    return {
      player: t("本国", "Player"),
      neutral: t("中立", "Neutral"),
      hostile: t("敌对", "Hostile")
    }[realmRelation(realmId)] || t("未知", "Unknown");
  }

  function localizedNumber(value) {
    return Math.max(0, Math.round(Number(value) || 0)).toLocaleString(language === "en" ? "en-US" : "zh-CN");
  }

  function svgElement(tag, attributes = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    return node;
  }

  function pointsPath(points) {
    if (!points?.length) return "";
    return `${points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ")} Z`;
  }

  function signedPolygonArea(points) {
    return points.reduce((area, point, index) => {
      const next = points[(index + 1) % points.length];
      return area + point.x * next.y - next.x * point.y;
    }, 0) / 2;
  }

  function reliefFacingEdges(points) {
    if (!points?.length) return [];
    const clockwiseOnScreen = signedPolygonArea(points) >= 0;
    return points.map((start, index) => {
      const end = points[(index + 1) % points.length];
      const edgeX = end.x - start.x;
      const edgeY = end.y - start.y;
      const outwardX = clockwiseOnScreen ? edgeY : -edgeY;
      const outwardY = clockwiseOnScreen ? -edgeX : edgeX;
      if (outwardX * RELIEF_PROJECTION.x + outwardY * RELIEF_PROJECTION.y <= 0) return null;
      const frontFacing = outwardY >= Math.abs(outwardX) * 0.45;
      return { start, end, face: frontFacing ? "front" : "side" };
    }).filter(Boolean);
  }

  function reliefWallPath(points, depth, face) {
    if (!points?.length || depth <= 0) return "";
    const projection = { x: depth * RELIEF_PROJECTION.x, y: depth * RELIEF_PROJECTION.y };
    return reliefFacingEdges(points).filter((edge) => edge.face === face).map(({ start, end }) => {
      return `M ${start.x} ${start.y} L ${end.x} ${end.y} L ${end.x + projection.x} ${end.y + projection.y} L ${start.x + projection.x} ${start.y + projection.y} Z`;
    }).join(" ");
  }

  function reliefRimPath(points) {
    return reliefFacingEdges(points)
      .map(({ start, end }) => `M ${start.x} ${start.y} L ${end.x} ${end.y}`)
      .join(" ");
  }

  function darkenHex(color, factor) {
    const value = String(color || "").replace("#", "");
    if (!/^[0-9a-f]{6}$/iu.test(value)) return "#18201e";
    const channels = [0, 2, 4].map((offset) => Math.round(Number.parseInt(value.slice(offset, offset + 2), 16) * factor));
    return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  }

  function reliefProfile() {
    const compact = window.matchMedia("(max-width: 820px), (max-height: 620px) and (orientation: landscape)").matches;
    const profile = compact
      ? { skewX: -0.05, scaleY: 0.94, landY: 9 }
      : { skewX: -0.075, scaleY: 0.9, landY: 11 };
    return { ...profile, landX: profile.landY * RELIEF_PROJECTION.x };
  }

  function reliefWorldTransform() {
    const { skewX, scaleY } = reliefProfile();
    const centerY = DATA.viewBox.y + DATA.viewBox.height / 2;
    // Keep the world center fixed while giving the map plane a shallow oblique view.
    const translateX = -skewX * centerY;
    const translateY = (1 - scaleY) * centerY;
    return `matrix(1 0 ${skewX} ${scaleY} ${translateX} ${translateY})`;
  }

  function applyReliefProjection() {
    const profile = reliefProfile();
    dom.landDepth.setAttribute("transform", `translate(${profile.landX} ${profile.landY})`);
    if (reliefMode === "3d") dom.worldLayer.setAttribute("transform", reliefWorldTransform());
    else dom.worldLayer.removeAttribute("transform");
  }

  function routePath(provinceIds) {
    const points = provinceIds.map((provinceId) => geography.provinceById[provinceId]?.center).filter(Boolean);
    if (!points.length) return "";
    return points.map((point, index) => `${index ? "L" : "M"} ${point[0]} ${point[1]}`).join(" ");
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", String(scenario.seed));
    if (language === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    if (mode !== "political") url.searchParams.set("mode", mode);
    else url.searchParams.delete("mode");
    if (reliefMode === "2d") url.searchParams.set("relief", "2d");
    else url.searchParams.delete("relief");
    try {
      window.history.replaceState({}, "", url.href);
    } catch {
      // Direct file launches can deny history writes; the map still remains fully playable.
    }
  }

  function announce(message) {
    dom.liveRegion.textContent = "";
    window.requestAnimationFrame(() => {
      dom.liveRegion.textContent = message;
    });
  }

  function updateScenarioReadout() {
    const movementSuffix = movementCount ? ` · M${movementCount}` : "";
    const battleSuffix = scenario.battleCount ? ` · B${scenario.battleCount}` : "";
    dom.scenarioReadout.textContent = `${scenario.seed} · ${scenario.signature.toUpperCase()} · T${scenario.turn}${movementSuffix}${battleSuffix}`;
    dom.phaseStatus.textContent = t(`第 ${scenario.turn} 回合 · 玩家阶段`, `ROUND ${scenario.turn} · PLAYER PHASE`);
    dom.turnBadge.textContent = String(scenario.turn);
    dom.endPhaseButton.setAttribute("aria-label", t(
      `结束第 ${scenario.turn} 回合玩家阶段（快捷键 E）`,
      `End player phase for round ${scenario.turn} (E)`
    ));
    const playerSurvives = Object.values(scenario.controllerByProvince).includes("player-realm");
    dom.endPhaseButton.disabled = !playerSurvives;
  }

  function buildStaticMap() {
    const landPath = DATA.landPath;
    dom.landClipPath.setAttribute("d", landPath);
    dom.landDepth.setAttribute("d", landPath);
    dom.landBase.setAttribute("d", landPath);
    dom.coastLine.setAttribute("d", landPath);

    [
      "M -70 184 C 180 91 365 89 568 157 C 782 228 982 200 1272 84",
      "M -89 322 C 163 249 365 261 554 328 C 787 410 1005 368 1282 240",
      "M -35 520 C 194 456 389 475 607 548 C 831 621 1029 592 1280 461",
      "M 85 700 C 297 617 497 626 700 694 C 879 754 1039 740 1188 671"
    ].forEach((pathData) => {
      const path = svgElement("path", { class: "ocean-current", d: pathData });
      dom.oceanDetailLayer.append(path);
    });

    const reliefCells = geography.cells
      .map((cell) => {
        const province = geography.provinceById[cell.provinceId];
        return { cell, province, depth: RELIEF_DEPTHS[province.terrain] || 3 };
      })
      .sort((left, right) => left.province.center[1] + left.depth - right.province.center[1] - right.depth);
    reliefCells.forEach(({ cell, province, depth }) => {
      const reliefCell = svgElement("g", {
        class: `province-relief-cell relief-terrain-${province.terrain}`,
        "data-province-id": province.id,
        "data-relief-depth": depth
      });
      const side = svgElement("path", {
        class: "province-relief-wall province-relief-side",
        d: reliefWallPath(cell.points, depth, "side")
      });
      const front = svgElement("path", {
        class: "province-relief-wall province-relief-front",
        d: reliefWallPath(cell.points, depth, "front")
      });
      const rim = svgElement("path", {
        class: "province-relief-rim",
        d: reliefRimPath(cell.points)
      });
      reliefCell.append(side, front, rim);
      reliefNodes.set(province.id, reliefCell);
      dom.provinceReliefLayer.append(reliefCell);
    });

    geography.cells.forEach((cell) => {
      const province = geography.provinceById[cell.provinceId];
      const path = svgElement("path", {
        class: "province-shape",
        d: pointsPath(cell.points),
        role: "button",
        tabindex: province.id === selectedProvinceId ? "0" : "-1",
        "data-province-id": province.id
      });
      path.addEventListener("focus", () => setHoveredProvince(province.id, null));
      path.addEventListener("blur", () => setHoveredProvince(null, null));
      path.addEventListener("keydown", (event) => handleProvinceKeydown(event, province.id));
      provinceNodes.set(province.id, path);
      dom.provinceLayer.append(path);

      const texture = svgElement("path", {
        class: `terrain-texture terrain-${province.terrain}`,
        d: pointsPath(cell.points)
      });
      textureNodes.set(province.id, texture);
      dom.terrainTextureLayer.append(texture);

      if (province.terrain === "mountain" || province.terrain === "canyon") {
        const mountain = svgElement("use", {
          class: "terrain-mountain",
          href: "#mountainSymbol",
          x: province.center[0] - 15,
          y: province.center[1] - 10,
          width: 30,
          height: 20
        });
        dom.terrainTextureLayer.append(mountain);
      }

      const label = svgElement("text", {
        class: "province-label",
        x: province.label[0],
        y: province.label[1] - 2
      });
      const nameLine = svgElement("tspan", { x: province.label[0] });
      const metaLine = svgElement("tspan", {
        class: "province-meta-label",
        x: province.label[0],
        dy: 12
      });
      label.append(nameLine, metaLine);
      provinceLabelNodes.set(province.id, { label, nameLine, metaLine });
      dom.provinceLabelLayer.append(label);
    });

    DATA.rivers.forEach((river) => {
      dom.riverLayer.append(svgElement("path", {
        class: `map-river${river.major ? " major" : ""}`,
        d: river.path
      }));
    });

    DATA.routes.forEach((route) => {
      dom.routeLayer.append(svgElement("path", {
        class: "map-route",
        d: routePath(route.provinceIds)
      }));
    });

    geography.sharedEdges.forEach((edge, index) => {
      const pathData = `M ${edge.start.x} ${edge.start.y} L ${edge.end.x} ${edge.end.y}`;
      if (edge.strategicBoundary) {
        dom.strategicBorderLayer.append(svgElement("path", {
          class: "strategic-border",
          d: pathData
        }));
      }
      const realmBorder = svgElement("path", {
        class: "realm-border",
        d: pathData,
        "data-edge-index": index
      });
      realmBorderNodes.push({ node: realmBorder, edge });
      dom.realmBorderLayer.append(realmBorder);
    });

    DATA.strategicRegions.forEach((region) => {
      const label = svgElement("text", {
        class: "strategic-label",
        x: region.label[0],
        y: region.label[1]
      });
      label.textContent = localizedName(region);
      label.dataset.regionId = region.id;
      dom.strategicLabelLayer.append(label);
    });

    DATA.realms.forEach((realm) => {
      const capital = svgElement("g", { class: "capital-node" });
      capital.append(svgElement("use", {
        class: "capital-marker",
        href: "#capitalSymbol",
        x: -11,
        y: -11,
        width: 22,
        height: 22
      }));
      capitalNodes.set(realm.id, capital);
      dom.capitalLayer.append(capital);

      const label = svgElement("text", { class: "realm-label" });
      realmLabelNodes.set(realm.id, label);
      dom.realmLabelLayer.append(label);
    });

    dom.geographyReadout.textContent = `${DATA.provinces.length} / ${DATA.strategicRegions.length} · ${geography.signature.toUpperCase()}`;
  }

  function buildArmyNodes() {
    dom.armyLayer.replaceChildren();
    armyNodes.clear();
    scenario.armies.forEach((army) => {
      const realm = geography.realmById[army.realmId];
      const marker = svgElement("g", {
        class: `army-marker${army.realmId === "player-realm" ? " is-player" : ""}${army.id.endsWith("-frontier") ? " secondary-army" : ""}`,
        role: "button",
        tabindex: "0",
        "data-army-id": army.id,
        "aria-label": localizedArmyLabel(army)
      });
      marker.append(svgElement("path", {
        class: "army-marker-shield",
        d: "M -15 -14 L 15 -14 L 13 7 L 0 16 L -13 7 Z"
      }));
      const tier = svgElement("text", { class: "army-tier", x: 0, y: -2 });
      tier.textContent = armyTier(army.force);
      const force = svgElement("text", { class: "army-force", x: 0, y: 8 });
      force.textContent = compactNumber(army.force);
      marker.append(tier, force);
      marker.addEventListener("click", (event) => {
        if (suppressClick) return;
        event.stopPropagation();
        activateArmyMarker(army.id);
      });
      marker.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (event.repeat) return;
          activateArmyMarker(army.id, { focusAfter: true });
          return;
        }
        if (event.key.startsWith("Arrow")) {
          selectArmy(army.id);
          focusDirectionalNeighbor(event, army.provinceId);
        }
      });
      armyNodes.set(army.id, marker);
      dom.armyLayer.append(marker);
    });
  }

  function updateScenarioMap() {
    DATA.provinces.forEach((province) => {
      const node = provinceNodes.get(province.id);
      const state = scenario.provinceState[province.id];
      const realm = geography.realmById[state.controllerId];
      const terrain = DATA.terrainTypes[province.terrain];
      node.style.setProperty("--realm-color", realm.color);
      node.style.setProperty("--terrain-color", terrain.color);
      const relief = reliefNodes.get(province.id);
      relief.style.setProperty("--relief-realm-front", darkenHex(realm.color, 0.54));
      relief.style.setProperty("--relief-realm-side", darkenHex(realm.color, 0.4));
      relief.style.setProperty("--relief-terrain-front", darkenHex(terrain.color, 0.58));
      relief.style.setProperty("--relief-terrain-side", darkenHex(terrain.color, 0.42));
      node.dataset.realmId = realm.id;
      node.dataset.terrain = province.terrain;
      node.setAttribute("aria-label", provinceAriaLabel(province));
    });

    realmBorderNodes.forEach(({ node, edge }) => {
      const leftOwner = scenario.controllerByProvince[edge.a];
      const rightOwner = scenario.controllerByProvince[edge.b];
      const visible = leftOwner !== rightOwner;
      const playerRelation = leftOwner === "player-realm"
        ? realmRelation(rightOwner)
        : rightOwner === "player-realm" ? realmRelation(leftOwner) : "foreign";
      node.dataset.active = visible ? "true" : "false";
      node.dataset.playerRelation = playerRelation;
      node.style.display = visible ? "" : "none";
      node.classList.toggle("frontline", visible && mode === "military" && playerRelation === "hostile");
      node.classList.toggle("neutral-frontier", visible && mode === "military" && playerRelation === "neutral");
    });

    DATA.realms.forEach((realm) => {
      const capitalProvince = geography.provinceById[scenario.capitals[realm.id]];
      const capital = capitalNodes.get(realm.id);
      capital.dataset.realmId = realm.id;
      const owned = DATA.provinces.filter((province) => scenario.controllerByProvince[province.id] === realm.id);
      capital.style.display = capitalProvince ? "" : "none";
      if (capitalProvince) {
        capital.dataset.x = String(capitalProvince.center[0]);
        capital.dataset.y = String(capitalProvince.center[1]);
      }
      const weightTotal = owned.reduce((sum, province) => sum + scenario.provinceState[province.id].development, 0) || 1;
      const x = owned.reduce((sum, province) => sum + province.center[0] * scenario.provinceState[province.id].development, 0) / weightTotal;
      const y = owned.reduce((sum, province) => sum + province.center[1] * scenario.provinceState[province.id].development, 0) / weightTotal;
      const label = realmLabelNodes.get(realm.id);
      label.style.display = owned.length ? "" : "none";
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(y));
      label.textContent = localizedName(realm);
    });

    buildArmyNodes();
    syncSelectionStyles();
    updateMapCopy();
    renderMovementTargets();
    renderLegend();
    applyCamera();
    renderInspector();
  }

  function updateMapCopy() {
    document.querySelectorAll(".strategic-label").forEach((label) => {
      label.textContent = localizedName(geography.strategicRegionById[label.dataset.regionId]);
    });
    DATA.realms.forEach((realm) => {
      realmLabelNodes.get(realm.id).textContent = localizedName(realm);
    });
    DATA.provinces.forEach((province) => {
      const state = scenario.provinceState[province.id];
      const record = provinceLabelNodes.get(province.id);
      record.nameLine.textContent = localizedName(province);
      if (mode === "terrain") record.metaLine.textContent = localizedName(DATA.terrainTypes[province.terrain]);
      else if (mode === "military") record.metaLine.textContent = `DEF ${state.fortification}`;
      else record.metaLine.textContent = `DEV ${state.development}`;
      const node = provinceNodes.get(province.id);
      node.setAttribute("aria-label", provinceAriaLabel(province));
    });
    scenario.armies.forEach((army) => {
      armyNodes.get(army.id)?.setAttribute("aria-label", localizedArmyLabel(army));
    });
  }

  function updateStaticLanguage() {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.title = t("文明摇篮：地图实验室", "Cradles of Civilization: Map Lab");
    document.querySelectorAll("[data-zh][data-en]").forEach((node) => {
      node.textContent = t(node.dataset.zh, node.dataset.en);
    });
    document.querySelectorAll("[data-zh-label][data-en-label]").forEach((node) => {
      node.setAttribute("aria-label", t(node.dataset.zhLabel, node.dataset.enLabel));
    });
    dom.languageToggle.textContent = language === "en" ? "中" : "EN";
    dom.languageToggle.setAttribute("aria-label", t("切换到英文", "Switch to Chinese"));
    updateReliefControl();
    updateScenarioReadout();
    const returnUrl = new URL("../index.html", window.location.href);
    if (language === "en") returnUrl.searchParams.set("lang", "en");
    dom.returnLink.href = returnUrl.href;
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // The map remains usable when local storage is unavailable.
    }
    updateMapCopy();
    renderMovementTargets();
    renderLegend();
    renderInspector();
    updateUrl();
  }

  function updateReliefControl() {
    const enabled = reliefMode === "3d";
    dom.reliefToggle.textContent = enabled ? "3D" : "2D";
    dom.reliefToggle.setAttribute("aria-pressed", enabled ? "true" : "false");
    dom.reliefToggle.setAttribute("aria-label", enabled
      ? t("切换到平面地图", "Switch to flat map")
      : t("开启立体地形", "Enable relief map"));
  }

  function setReliefMode(nextMode, shouldAnnounce = true) {
    if (nextMode !== "2d" && nextMode !== "3d") return;
    reliefMode = nextMode;
    dom.body.dataset.relief = reliefMode;
    applyReliefProjection();
    updateReliefControl();
    try {
      localStorage.setItem(RELIEF_KEY, reliefMode);
    } catch {
      // The toggle remains usable when local storage is unavailable.
    }
    updateUrl();
    if (shouldAnnounce) announce(reliefMode === "3d"
      ? t("轻量立体地形已开启", "Lightweight relief enabled")
      : t("平面地图已开启", "Flat map enabled"));
  }

  function setMode(nextMode, shouldAnnounce = true) {
    if (!MODES.has(nextMode)) return;
    mode = nextMode;
    dom.body.dataset.mode = mode;
    dom.modeButtons.forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.mapMode === mode ? "true" : "false");
    });
    realmBorderNodes.forEach(({ node }) => {
      const active = node.dataset.active === "true" && mode === "military";
      node.classList.toggle("frontline", active && node.dataset.playerRelation === "hostile");
      node.classList.toggle("neutral-frontier", active && node.dataset.playerRelation === "neutral");
    });
    updateMapCopy();
    renderMovementTargets();
    renderLegend();
    renderInspector();
    updateUrl();
    if (shouldAnnounce) announce(t(`${modeName(mode)}地图已启用`, `${modeName(mode)} map enabled`));
  }

  function modeName(value) {
    return {
      political: t("政治", "Political"),
      terrain: t("地形", "Terrain"),
      military: t("军事", "Military")
    }[value];
  }

  function renderLegend() {
    dom.legendModeName.textContent = t(`${modeName(mode)}地图`, `${modeName(mode)} Map`);
    let items;
    if (mode === "political") {
      items = DATA.realms.map((realm) => ({
        color: realm.color,
        label: localizedName(realm),
        meta: DATA.provinces.filter((province) => scenario.controllerByProvince[province.id] === realm.id).length
      }));
    } else if (mode === "terrain") {
      items = Object.entries(DATA.terrainTypes).map(([id, terrain]) => ({
        color: terrain.color,
        label: localizedName(terrain),
        meta: `${terrain.attack >= 0 ? "+" : ""}${terrain.attack}/${terrain.defense >= 0 ? "+" : ""}${terrain.defense}`,
        id
      }));
    } else {
      items = [
        { color: "#70e5a7", label: t("可移动", "Move"), meta: t("相邻己方", "friendly") },
        { color: "#f08072", label: t("敌对目标", "Hostile target"), meta: t("点击开战", "engage") },
        { color: "#efc76e", label: t("中立目标", "Neutral target"), meta: t("进攻即敌对", "attack provokes") },
        { color: "#f3b067", label: t("前线", "Front line"), meta: t("敌对边界", "hostile") },
        { color: "#e1d7bd", label: t("军团", "Army"), meta: scenario.armies.length },
        { color: "#f4ddb1", label: t("首都", "Capital"), meta: DATA.realms.filter((realm) => scenario.capitals[realm.id]).length },
        { color: "#d2ad70", label: t("干道", "Route"), meta: DATA.routes.length }
      ];
    }
    dom.legendItems.replaceChildren(...items.map((item) => {
      const row = document.createElement("div");
      row.className = "legend-item";
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.setProperty("--swatch", item.color);
      const label = document.createElement("span");
      label.textContent = item.label;
      const meta = document.createElement("small");
      meta.textContent = item.meta;
      row.append(swatch, label, meta);
      return row;
    }));
  }

  function provinceAriaLabel(province) {
    const state = scenario.provinceState[province.id];
    const realm = geography.realmById[state.controllerId];
    const region = geography.strategicRegionById[province.strategicRegionId];
    const terrain = DATA.terrainTypes[province.terrain];
    return t(
      `${province.nameZh}，${region.nameZh}，${terrain.nameZh}，由${realm.nameZh}控制，关系${relationName(realm.id)}`,
      `${province.nameEn}, ${region.nameEn}, ${terrain.nameEn}, controlled by ${realm.nameEn}, relation ${relationName(realm.id)}`
    );
  }

  function localizedArmyLabel(army) {
    const realm = geography.realmById[army.realmId];
    const province = geography.provinceById[army.provinceId];
    const acted = army.realmId === "player-realm" && Number(army.lastActedTurn) >= Number(scenario.turn);
    return t(
      `${realm.nameZh}${army.nameZh}，驻扎${province.nameZh}，兵力${army.force}${acted ? "，本回合已行动" : ""}`,
      `${realm.nameEn} ${army.nameEn}, stationed in ${province.nameEn}, force ${army.force}${acted ? ", already acted this round" : ""}`
    );
  }

  function localizedArmyNameById(armyId) {
    const army = scenario.armies.find((candidate) => candidate.id === armyId);
    if (army) return localizedName(army);
    if (armyId?.endsWith("-capital")) return t("首都卫队", "Capital Guard");
    if (armyId?.endsWith("-frontier")) return t("边境军团", "Frontier Host");
    return t("军团", "Army");
  }

  function compactNumber(value) {
    const number = Number(value) || 0;
    if (Math.abs(number) >= 1000) return `${(number / 1000).toFixed(number >= 10000 ? 0 : 1)}k`;
    return String(Math.round(number));
  }

  function armyTier(force) {
    if (force >= 14000) return "IV";
    if (force >= 10500) return "III";
    if (force >= 7500) return "II";
    return "I";
  }

  function setFact(index, labelZh, labelEn, value) {
    const fact = dom.provinceFacts[index];
    fact.querySelector("dt").textContent = t(labelZh, labelEn);
    fact.querySelector("dd").textContent = value;
  }

  function inspectorProvince() {
    const army = scenario.armies.find((candidate) => candidate.id === selectedArmyId);
    return geography.provinceById[army?.provinceId || selectedProvinceId] || null;
  }

  function recruitmentFeedback(report) {
    const armyName = localizedArmyNameById(report.armyId);
    const added = localizedNumber(report.forceAdded);
    const after = localizedNumber(report.forceAfter);
    const capped = report.capped ? t("，已达到兵力上限", "; force cap reached") : "";
    if (report.kind === "merge") {
      return t(
        `已并入${armyName}：增加 ${added}，现有 ${after}${capped}`,
        `Merged into ${armyName}: +${added}, now ${after}${capped}`
      );
    }
    if (report.kind === "rebuild") {
      return t(
        `已重建${armyName}：兵力 ${after}${capped}`,
        `${armyName} rebuilt with ${after} troops${capped}`
      );
    }
    return t(
      `已组建${armyName}：兵力 ${after}${capped}`,
      `${armyName} raised with ${after} troops${capped}`
    );
  }

  function renderRecruitment() {
    const province = inspectorProvince();
    const state = province ? scenario.provinceState[province.id] : null;
    const isOwned = state?.controllerId === "player-realm" && realmRelation(state.controllerId) === "player";
    dom.recruitPanel.hidden = !isOwned;
    if (!isOwned) {
      dom.recruitFeedback.hidden = true;
      return;
    }

    const modelAvailable = typeof MODEL.executeRecruitment === "function";
    const cooldown = Math.max(0, Math.round(Number(scenario.recruitment?.cooldown) || 0));
    const ready = modelAvailable && cooldown === 0;
    dom.recruitPanel.dataset.state = ready ? "ready" : "cooldown";
    dom.recruitButton.disabled = !ready;
    dom.recruitStatus.textContent = !modelAvailable
      ? t("征兵系统暂不可用", "Recruitment is unavailable")
      : cooldown > 0
        ? t(`冷却中 · 还需 ${cooldown} 回合`, `Cooldown · ${cooldown} rounds remaining`)
        : t(
          `可征召 ${localizedNumber(RECRUIT_FORCE)} · 使用后冷却 ${RECRUIT_COOLDOWN} 回合`,
          `Recruit ${localizedNumber(RECRUIT_FORCE)} · ${RECRUIT_COOLDOWN}-round cooldown`
        );
    dom.recruitButton.setAttribute("aria-label", ready
      ? t(
        `在${province.nameZh}征召${localizedNumber(RECRUIT_FORCE)}人，使用后冷却${RECRUIT_COOLDOWN}回合（快捷键 V）`,
        `Recruit ${localizedNumber(RECRUIT_FORCE)} troops in ${province.nameEn}; ${RECRUIT_COOLDOWN}-round cooldown (V)`
      )
      : t(
        `${province.nameZh}征兵冷却中，还需${cooldown}回合`,
        `Recruitment in ${province.nameEn} is on cooldown for ${cooldown} more rounds`
      ));

    const showFeedback = Boolean(lastRecruitReport?.recruited && lastRecruitReport.provinceId === province.id);
    dom.recruitFeedback.hidden = !showFeedback;
    if (showFeedback) dom.recruitFeedback.textContent = recruitmentFeedback(lastRecruitReport);
  }

  function battleScaleName(scale) {
    return {
      conflict: t("冲突", "SKIRMISH"),
      battle: t("战役", "BATTLE"),
      bloodbath: t("血战", "BLOODBATH")
    }[scale] || t("战役", "BATTLE");
  }

  function renderBattleReport() {
    if (!lastBattleReport) {
      dom.battleReport.hidden = true;
      return;
    }
    const report = lastBattleReport;
    const province = geography.provinceById[report.toProvinceId];
    const formerRealm = geography.realmById[report.previousControllerId];
    const numberLocale = language === "en" ? "en-US" : "zh-CN";
    const formatForce = (value) => Math.max(0, Math.round(Number(value) || 0)).toLocaleString(numberLocale);
    const scale = battleScaleName(report.scale);
    dom.battleReport.hidden = false;
    dom.battleReport.dataset.outcome = report.attackerWon ? "victory" : "defeat";
    dom.battleReportTitle.textContent = report.attackerWon
      ? t(`${scale}胜利 · 已攻占${province.nameZh}`, `${scale} VICTORY · ${province.nameEn} CAPTURED`)
      : t(`${scale}失利 · ${province.nameZh}守住`, `${scale} DEFEAT · ${province.nameEn} HELD`);
    const retreatNames = report.retreatProvinceIds
      .map((provinceId) => localizedName(geography.provinceById[provinceId]))
      .join(t("、", ", "));
    const retreatText = report.attackerWon && report.defenderArmyIds.length
      ? retreatNames
        ? t(`守军退往${retreatNames}。`, `Defenders retreated to ${retreatNames}.`)
        : t("守军残部已经溃散。", "The defending field armies were routed.")
      : "";
    const eliminationText = report.eliminatedRealmId
      ? t(`${formerRealm.nameZh}已经失去全部领土。`, `${formerRealm.nameEn} has lost all territory.`)
      : "";
    const provocationText = report.provokedRealmId
      ? t(`${formerRealm.nameZh}已由中立转为敌对。`, `${formerRealm.nameEn} has turned from neutral to hostile.`)
      : "";
    dom.battleReportText.textContent = t(
      `进攻方损失 ${formatForce(report.attackerCasualties)}，剩余 ${formatForce(report.attackerSurvivors)}；守方损失 ${formatForce(report.defenderCasualties)}，野战军剩余 ${formatForce(report.fieldDefenderSurvivors)}。${retreatText}${eliminationText}${provocationText}`,
      `Attacker lost ${formatForce(report.attackerCasualties)}, ${formatForce(report.attackerSurvivors)} remain; defender lost ${formatForce(report.defenderCasualties)}, ${formatForce(report.fieldDefenderSurvivors)} field troops remain. ${retreatText} ${eliminationText} ${provocationText}`
    ).trim();
  }

  function renderPhaseReport() {
    if (!lastPhaseReport) {
      dom.phaseReport.hidden = true;
      return;
    }
    const actions = lastPhaseReport.actions || [];
    const moveCount = actions.filter((action) => action.kind === "move").length;
    const battleCount = actions.filter((action) => action.kind === "battle").length;
    dom.phaseReport.hidden = false;
    dom.phaseReportTitle.textContent = t(
      `第 ${lastPhaseReport.turn} 回合 · ${actions.length} 国行动 · ${moveCount} 次移动 · ${battleCount} 场战斗`,
      `ROUND ${lastPhaseReport.turn} · ${actions.length} REALMS · ${moveCount} MOVES · ${battleCount} BATTLES`
    );
    dom.phaseReportActions.replaceChildren();
    actions.forEach((action) => {
      const realm = geography.realmById[action.realmId];
      const item = document.createElement("li");
      if (action.kind === "move") {
        const destination = geography.provinceById[action.toProvinceId];
        item.textContent = t(
          `${realm.nameZh}：${localizedArmyNameById(action.armyId)}移至${destination.nameZh}`,
          `${realm.nameEn}: ${localizedArmyNameById(action.armyId)} moved to ${destination.nameEn}`
        );
      } else if (action.kind === "battle") {
        const destination = geography.provinceById[action.toProvinceId];
        const battle = action.battle;
        item.textContent = t(
          `${realm.nameZh}：进攻${destination.nameZh}${battle.attackerWon ? "获胜" : "失利"}，损失${battle.attackerCasualties.toLocaleString("zh-CN")}`,
          `${realm.nameEn}: attacked ${destination.nameEn} and ${battle.attackerWon ? "won" : "lost"}; ${battle.attackerCasualties.toLocaleString("en-US")} lost`
        );
      } else {
        const reason = action.reason === "eliminated"
          ? t("已经灭亡", "eliminated")
          : action.reason === "no-army"
            ? t("无可用军团", "no available army")
            : t("原地固守", "held position");
        item.textContent = `${localizedName(realm)}：${reason}`;
      }
      dom.phaseReportActions.append(item);
    });
  }

  function renderInspector() {
    renderRecruitment();
    renderPhaseReport();
    renderBattleReport();
    const army = scenario.armies.find((candidate) => candidate.id === selectedArmyId);
    if (army) {
      const province = geography.provinceById[army.provinceId];
      const realm = geography.realmById[army.realmId];
      dom.inspectorEyebrow.textContent = t("军团情报", "ARMY INTELLIGENCE");
      dom.provinceCode.textContent = army.id.toUpperCase();
      dom.provinceName.textContent = localizedName(army);
      dom.provinceRegion.textContent = `${localizedName(realm)} · ${localizedName(province)}`;
      setFact(0, "阵营", "Realm", `${localizedName(realm)} · ${relationName(realm.id)}`);
      setFact(1, "驻地", "Station", localizedName(province));
      setFact(2, "兵力", "Force", army.force.toLocaleString(language === "en" ? "en-US" : "zh-CN"));
      setFact(3, "进攻", "Attack", army.attack);
      setFact(4, "防守", "Defense", army.defense);
      const acted = Number(army.lastActedTurn) >= Number(scenario.turn);
      setFact(5, "指令", "Command", army.realmId === "player-realm"
        ? acted ? t("本回合已行动", "Already acted") : t("可下令", "Ready")
        : t("仅观察", "Observer only"));
      renderProvinceArmies(province.id, army.id);
      dom.inspectorNote.textContent = army.realmId === "player-realm"
        ? acted
          ? t("这支军团本回合已经行动；请选择另一支军团，或结束玩家阶段。", "This army has already acted this round. Select another army or end the player phase.")
          : t("点击绿色相邻省份移动；点击红色相邻省份立即开战。每支军团每回合只能行动一次。", "Click a green adjacent province to move; click a red adjacent province to attack immediately. Each army gets one action per round.")
        : t("可以查看其他政权军团，但地图实验室只允许指挥绿色的玩家军团。", "Other realms can be inspected, but only the green player armies are commandable in the map lab.");
      return;
    }

    const province = geography.provinceById[selectedProvinceId] || DATA.provinces[0];
    const state = scenario.provinceState[province.id];
    const realm = geography.realmById[state.controllerId];
    const region = geography.strategicRegionById[province.strategicRegionId];
    const terrain = DATA.terrainTypes[province.terrain];
    dom.inspectorEyebrow.textContent = t("省份情报", "PROVINCE INTELLIGENCE");
    dom.provinceCode.textContent = province.id.toUpperCase();
    dom.provinceName.textContent = localizedName(province);
    dom.provinceRegion.textContent = `${localizedName(region)} · ${localizedName(terrain)}`;
    setFact(0, "控制者", "Controller", `${localizedName(realm)} · ${relationName(realm.id)}`);
    setFact(1, "发展", "Development", state.development);
    setFact(2, "工事", "Fortification", state.fortification);
    setFact(3, "补给", "Supply", `${state.supply}%`);
    setFact(4, "人口", "Population", `${state.population}k`);
    setFact(5, "接壤", "Borders", geography.neighbors[province.id].length);
    renderProvinceArmies(province.id, null);
    dom.inspectorNote.textContent = t(
      "这是交互原型：选择与镜头状态不会写入正式游戏存档。",
      "This is an interaction prototype. Selection and camera state never touch the main game save."
    );
  }

  function renderProvinceArmies(provinceId, selectedId) {
    const armies = scenario.armies.filter((army) => army.provinceId === provinceId);
    dom.provinceArmies.replaceChildren();
    if (!armies.length) {
      const empty = document.createElement("div");
      empty.className = "no-armies";
      empty.textContent = t("本省没有常驻军团。", "No field army is stationed in this province.");
      dom.provinceArmies.append(empty);
      return;
    }
    armies.forEach((army) => {
      const realm = geography.realmById[army.realmId];
      const card = document.createElement("div");
      card.className = "army-card";
      card.style.setProperty("--realm-color", realm.color);
      if (army.id === selectedId) card.dataset.selected = "true";
      const title = document.createElement("strong");
      title.textContent = `${localizedName(realm)} · ${localizedName(army)}`;
      const meta = document.createElement("span");
      const acted = army.realmId === "player-realm" && Number(army.lastActedTurn) >= Number(scenario.turn);
      meta.textContent = t(
        `兵力 ${army.force.toLocaleString("zh-CN")} · 攻 ${army.attack} · 防 ${army.defense}${acted ? " · 已行动" : ""}`,
        `Force ${army.force.toLocaleString("en-US")} · ATK ${army.attack} · DEF ${army.defense}${acted ? " · ACTED" : ""}`
      );
      card.append(title, meta);
      dom.provinceArmies.append(card);
    });
  }

  function syncSelectionStyles() {
    provinceNodes.forEach((node, id) => {
      node.classList.toggle("is-selected", id === selectedProvinceId);
      node.setAttribute("tabindex", id === selectedProvinceId ? "0" : "-1");
    });
    armyNodes.forEach((node, id) => node.classList.toggle("is-selected", id === selectedArmyId));
  }

  function selectProvince(provinceId, options = {}) {
    if (!geography.provinceById[provinceId]) return;
    selectedProvinceId = provinceId;
    selectedArmyId = null;
    renderMovementTargets();
    syncSelectionStyles();
    renderInspector();
    if (window.matchMedia("(max-width: 820px)").matches) setInspectorCollapsed(false);
    const province = geography.provinceById[provinceId];
    announce(t(`已选择${province.nameZh}`, `${province.nameEn} selected`));
    if (options.focus) provinceNodes.get(provinceId).focus({ preventScroll: true });
  }

  function selectArmy(armyId) {
    const army = scenario.armies.find((candidate) => candidate.id === armyId);
    if (!army) return;
    selectedArmyId = army.id;
    selectedProvinceId = army.provinceId;
    if (mode !== "military") setMode("military", false);
    syncSelectionStyles();
    renderMovementTargets();
    renderInspector();
    if (window.matchMedia("(max-width: 820px)").matches) setInspectorCollapsed(army.realmId === "player-realm");
    announce(t(`已选择${army.nameZh}`, `${army.nameEn} selected`));
  }

  function renderMovementTargets() {
    provinceNodes.forEach((node, provinceId) => {
      node.classList.remove("is-move-target", "is-attack-target", "is-neutral-target");
      node.setAttribute("aria-label", provinceAriaLabel(geography.provinceById[provinceId]));
    });
    scenario.armies.forEach((candidate) => {
      const marker = armyNodes.get(candidate.id);
      marker?.classList.remove("is-attack-target", "is-neutral-target");
      marker?.setAttribute("aria-label", localizedArmyLabel(candidate));
    });
    const army = scenario.armies.find((candidate) => candidate.id === selectedArmyId);
    if (!army || army.realmId !== "player-realm" || mode !== "military") return;
    (geography.neighbors[army.provinceId] || []).forEach((provinceId) => {
      const result = MODEL.classifyArmyDestination(scenario, geography, army.id, provinceId);
      const node = provinceNodes.get(provinceId);
      if (result.kind === "move") {
        node.classList.add("is-move-target");
        node.setAttribute("aria-label", `${provinceAriaLabel(geography.provinceById[provinceId])}${t("，可移动至此", ", available move destination")}`);
      } else if (result.kind === "attack") {
        const relation = realmRelation(result.controllerId);
        const targetClass = relation === "neutral" ? "is-neutral-target" : "is-attack-target";
        node.classList.add(targetClass);
        node.setAttribute("aria-label", `${provinceAriaLabel(geography.provinceById[provinceId])}${relation === "neutral"
          ? t("，中立攻击目标；进攻将使该政权转为敌对", ", neutral attack target; attacking will turn this realm hostile")
          : t("，相邻攻击目标，激活即开战", ", adjacent attack target; activate to engage immediately")}`);
        scenario.armies.filter((candidate) => candidate.provinceId === provinceId).forEach((candidate) => {
          const marker = armyNodes.get(candidate.id);
          marker?.classList.add(targetClass);
          marker?.setAttribute("aria-label", `${localizedArmyLabel(candidate)}${relation === "neutral"
            ? t("，激活即进攻并打破中立", "; activate to attack and break neutrality")
            : t("，激活即向该军团开战", "; activate to engage this army immediately")}`);
        });
      }
    });
  }

  function activateArmyMarker(armyId, options = {}) {
    const targetArmy = scenario.armies.find((candidate) => candidate.id === armyId);
    const commandArmy = scenario.armies.find((candidate) => candidate.id === selectedArmyId);
    if (mode === "military" && commandArmy?.realmId === "player-realm" && targetArmy && targetArmy.id !== commandArmy.id) {
      const result = MODEL.classifyArmyDestination(scenario, geography, commandArmy.id, targetArmy.provinceId);
      if (result.kind === "attack") {
        activateProvince(targetArmy.provinceId, options);
        return;
      }
      const adjacentHostile = targetArmy.realmId !== commandArmy.realmId
        && (geography.neighbors[commandArmy.provinceId] || []).includes(targetArmy.provinceId);
      if (result.kind === "spent" && adjacentHostile) {
        announce(t("这支军团本回合已经行动", "This army has already acted this round"));
        return;
      }
    }
    selectArmy(armyId);
  }

  function activateProvince(provinceId, options = {}) {
    const army = scenario.armies.find((candidate) => candidate.id === selectedArmyId);
    if (mode !== "military" || !army || army.realmId !== "player-realm") {
      selectProvince(provinceId, options);
      return;
    }
    const classification = MODEL.classifyArmyDestination(scenario, geography, army.id, provinceId);
    if (classification.kind === "move") {
      const origin = geography.provinceById[army.provinceId];
      const destination = geography.provinceById[provinceId];
      const result = MODEL.executeArmyMove(scenario, geography, army.id, provinceId);
      if (!result.moved) return;
      selectedProvinceId = provinceId;
      movementCount += 1;
      syncSelectionStyles();
      updateScenarioReadout();
      updateMapCopy();
      renderMovementTargets();
      applyCamera();
      renderInspector();
      announce(t(
        `${army.nameZh}已从${origin.nameZh}移动至${destination.nameZh}`,
        `${army.nameEn} moved from ${origin.nameEn} to ${destination.nameEn}`
      ));
      if (options.focusAfter) {
        window.requestAnimationFrame(() => provinceNodes.get(selectedProvinceId)?.focus({ preventScroll: true }));
      }
      return;
    }
    if (classification.kind === "attack") {
      if (Date.now() < combatLockedUntil) return;
      const destination = geography.provinceById[provinceId];
      const keyboardFocus = options.focusAfter || document.activeElement === provinceNodes.get(provinceId);
      const report = MODEL.executeArmyBattle(scenario, geography, army.id, provinceId);
      if (!report.attacked) {
        announce(t("这次进攻命令无法执行", "This attack order cannot be executed"));
        return;
      }
      combatLockedUntil = Date.now() + 400;
      lastBattleReport = report;
      const survivingArmy = scenario.armies.find((candidate) => candidate.id === army.id);
      selectedArmyId = survivingArmy?.id || null;
      selectedProvinceId = survivingArmy?.provinceId || report.fromProvinceId;
      updateScenarioReadout();
      updateScenarioMap();
      setInspectorCollapsed(false);
      dom.inspectorContent.scrollTop = 0;
      const provokedRealm = report.provokedRealmId ? geography.realmById[report.provokedRealmId] : null;
      const provocationSuffix = provokedRealm
        ? t(`；${provokedRealm.nameZh}已由中立转为敌对`, `; ${provokedRealm.nameEn} is now hostile`)
        : "";
      announce(report.attackerWon
        ? t(
          `${army.nameZh}攻占${destination.nameZh}；进攻方损失${report.attackerCasualties}，守方损失${report.defenderCasualties}${provocationSuffix}`,
          `${army.nameEn} captured ${destination.nameEn}; attacker lost ${report.attackerCasualties}, defender lost ${report.defenderCasualties}${provocationSuffix}`
        )
        : t(
          `${army.nameZh}进攻${destination.nameZh}失败；进攻方损失${report.attackerCasualties}，守方损失${report.defenderCasualties}${provocationSuffix}`,
          `${army.nameEn} failed to take ${destination.nameEn}; attacker lost ${report.attackerCasualties}, defender lost ${report.defenderCasualties}${provocationSuffix}`
        ));
      if (keyboardFocus) {
        window.requestAnimationFrame(() => provinceNodes.get(selectedProvinceId)?.focus({ preventScroll: true }));
      }
      return;
    }
    announce(classification.kind === "current"
      ? t("军团已驻扎在这里", "The army is already stationed here")
      : classification.kind === "spent"
        ? t("这支军团本回合已经行动", "This army has already acted this round")
      : t("这一版只能向相邻省份下令", "This prototype only accepts orders to adjacent provinces"));
  }

  function executeRecruitment() {
    const now = Date.now();
    if (now < recruitLockedUntil) return;
    const province = inspectorProvince();
    if (!province) return;
    if (dom.recruitPanel.hidden) {
      announce(t("只能在本国控制的省份征兵", "Recruitment is only available in a province you control"));
      return;
    }
    if (dom.recruitButton.disabled) {
      const cooldown = Math.max(0, Math.round(Number(scenario.recruitment?.cooldown) || 0));
      announce(cooldown > 0
        ? t(`征兵仍在冷却，还需 ${cooldown} 回合`, `Recruitment is on cooldown for ${cooldown} more rounds`)
        : t("征兵系统暂不可用", "Recruitment is unavailable"));
      return;
    }
    if (typeof MODEL.executeRecruitment !== "function") return;
    recruitLockedUntil = now + 450;
    const report = MODEL.executeRecruitment(scenario, geography, province.id);
    lastRecruitReport = report;
    if (!report.recruited) {
      renderRecruitment();
      const cooldown = Math.max(0, Math.round(Number(report.cooldown) || 0));
      announce(report.kind === "cooldown"
        ? t(`征兵仍在冷却，还需 ${cooldown} 回合`, `Recruitment is on cooldown for ${cooldown} more rounds`)
        : report.kind === "not-owned"
          ? t("只能在本国控制的省份征兵", "Recruitment is only available in a province you control")
          : t("这次征兵命令无法执行", "This recruitment order cannot be executed"));
      return;
    }

    selectedProvinceId = province.id;
    selectedArmyId = report.armyId;
    updateScenarioReadout();
    updateScenarioMap();
    setInspectorCollapsed(false);
    const armyName = localizedArmyNameById(report.armyId);
    const resultText = report.kind === "merge"
      ? t(
        `${province.nameZh}征召 ${localizedNumber(report.forceAdded)} 人并入${armyName}，现有兵力 ${localizedNumber(report.forceAfter)}`,
        `${localizedNumber(report.forceAdded)} troops recruited in ${province.nameEn} and merged into ${armyName}; current force ${localizedNumber(report.forceAfter)}`
      )
      : report.kind === "rebuild"
        ? t(
          `${armyName}已在${province.nameZh}重建，兵力 ${localizedNumber(report.forceAfter)}`,
          `${armyName} was rebuilt in ${province.nameEn} with ${localizedNumber(report.forceAfter)} troops`
        )
        : t(
          `${province.nameZh}已组建${armyName}，兵力 ${localizedNumber(report.forceAfter)}`,
          `${armyName} was raised in ${province.nameEn} with ${localizedNumber(report.forceAfter)} troops`
        );
    announce(t(
      `${resultText}；征兵冷却 ${report.cooldown} 回合`,
      `${resultText}; recruitment cooldown ${report.cooldown} rounds`
    ));
  }

  function endPlayerPhase(options = {}) {
    const now = Date.now();
    if (now < phaseLockedUntil || dom.endPhaseButton.disabled) return;
    phaseLockedUntil = now + 650;
    lastRecruitReport = null;
    const report = MODEL.executeAiPhase(scenario, geography, "player-realm");
    lastPhaseReport = report;
    const selectedArmy = scenario.armies.find((candidate) => candidate.id === selectedArmyId);
    if (selectedArmy) selectedProvinceId = selectedArmy.provinceId;
    else selectedArmyId = null;
    updateScenarioReadout();
    updateScenarioMap();
    setInspectorCollapsed(false);
    const moveCount = report.actions.filter((action) => action.kind === "move").length;
    const battleCount = report.actions.filter((action) => action.kind === "battle").length;
    dom.inspectorContent.scrollTop = Math.max(0, dom.phaseReport.offsetTop - 8);
    announce(t(
      `第 ${report.turn} 回合结束：${report.actions.length} 国行动，${moveCount} 次移动，${battleCount} 场战斗；第 ${report.nextTurn} 回合开始`,
      `Round ${report.turn} ended: ${report.actions.length} realms acted, ${moveCount} moves, ${battleCount} battles. Round ${report.nextTurn} begins`
    ));
    if (options.focusControl) {
      window.requestAnimationFrame(() => dom.endPhaseButton.focus({ preventScroll: true }));
    }
  }

  function setHoveredProvince(provinceId, pointerEvent) {
    provinceNodes.forEach((node, id) => node.classList.toggle("is-hovered", id === provinceId));
    if (!provinceId || !pointerEvent) {
      dom.mapTooltip.hidden = true;
      return;
    }
    const province = geography.provinceById[provinceId];
    const state = scenario.provinceState[provinceId];
    const realm = geography.realmById[state.controllerId];
    const region = geography.strategicRegionById[province.strategicRegionId];
    dom.mapTooltip.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = localizedName(province);
    const meta = document.createElement("span");
    meta.textContent = `${localizedName(region)} · ${localizedName(realm)}`;
    dom.mapTooltip.append(title, meta);
    const left = Math.min(window.innerWidth - 276, pointerEvent.clientX + 14);
    const top = Math.min(window.innerHeight - 74, pointerEvent.clientY + 14);
    dom.mapTooltip.style.left = `${Math.max(8, left)}px`;
    dom.mapTooltip.style.top = `${Math.max(8, top)}px`;
    dom.mapTooltip.hidden = false;
  }

  function handleProvinceKeydown(event, provinceId) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (event.repeat) return;
      activateProvince(provinceId, { focusAfter: true });
      return;
    }
    const directions = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const current = geography.provinceById[provinceId];
    const candidates = geography.neighbors[provinceId].map((id) => geography.provinceById[id]);
    const scored = candidates.map((candidate) => {
      const dx = candidate.center[0] - current.center[0];
      const dy = candidate.center[1] - current.center[1];
      const distance = Math.max(1, Math.hypot(dx, dy));
      return { candidate, alignment: (dx * direction[0] + dy * direction[1]) / distance, distance };
    }).filter((entry) => entry.alignment > 0.15)
      .sort((left, right) => right.alignment - left.alignment || left.distance - right.distance);
    if (!scored[0]) return;
    if (selectedArmyId) provinceNodes.get(scored[0].candidate.id).focus({ preventScroll: true });
    else selectProvince(scored[0].candidate.id, { focus: true });
  }

  function focusDirectionalNeighbor(event, provinceId) {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[event.key];
    if (!direction) return;
    event.preventDefault();
    const current = geography.provinceById[provinceId];
    const candidate = geography.neighbors[provinceId]
      .map((id) => geography.provinceById[id])
      .map((province) => {
        const dx = province.center[0] - current.center[0];
        const dy = province.center[1] - current.center[1];
        const distance = Math.max(1, Math.hypot(dx, dy));
        return { province, alignment: (dx * direction[0] + dy * direction[1]) / distance, distance };
      })
      .filter((entry) => entry.alignment > 0.15)
      .sort((left, right) => right.alignment - left.alignment || left.distance - right.distance)[0]?.province;
    candidate && provinceNodes.get(candidate.id).focus({ preventScroll: true });
  }

  function mapPointerRatio(event) {
    const metrics = mapViewportMetrics();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - metrics.left) / metrics.width)),
      y: Math.min(1, Math.max(0, (event.clientY - metrics.top) / metrics.height))
    };
  }

  function mapAspect() {
    const rect = dom.mapSvg.getBoundingClientRect();
    return Math.max(0.1, rect.width / Math.max(1, rect.height));
  }

  function mapViewportMetrics(view = MODEL.cameraView(camera, DATA.viewBox, mapAspect())) {
    const rect = dom.mapSvg.getBoundingClientRect();
    const scale = Math.max(1e-7, Math.min(rect.width / view.width, rect.height / view.height));
    const width = view.width * scale;
    const height = view.height * scale;
    return {
      left: rect.left + (rect.width - width) / 2,
      top: rect.top + (rect.height - height) / 2,
      width,
      height
    };
  }

  function applyCamera() {
    const viewportAspect = mapAspect();
    camera = MODEL.clampCamera(camera, DATA.viewBox, viewportAspect);
    const view = MODEL.cameraView(camera, DATA.viewBox, viewportAspect);
    dom.mapSvg.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);
    dom.zoomReadout.textContent = `${camera.zoom.toFixed(2)}×`;
    const mobileOffset = window.matchMedia("(max-width: 720px)").matches ? 0.65 : 0;
    const band = camera.zoom < 1.25 + mobileOffset ? "far" : camera.zoom < 2.2 + mobileOffset ? "mid" : "near";
    dom.body.dataset.zoomBand = band;
    const inverseScale = 1 / camera.zoom;
    capitalNodes.forEach((node) => {
      node.setAttribute("transform", `translate(${node.dataset.x} ${node.dataset.y}) scale(${inverseScale})`);
    });
    scenario.armies.forEach((army, index) => {
      const node = armyNodes.get(army.id);
      const province = geography.provinceById[army.provinceId];
      const stack = scenario.armies.filter((candidate) => candidate.provinceId === army.provinceId);
      const stackIndex = stack.findIndex((candidate) => candidate.id === army.id);
      const offsets = [[-10, 17], [12, 17], [-22, -10], [22, -10], [0, -24], [-30, 16], [30, 16]];
      const [offsetX, offsetY] = offsets[stackIndex] || [((stackIndex % 5) - 2) * 18, 17 - Math.floor(stackIndex / 5) * 28];
      node?.setAttribute("transform", `translate(${province.center[0] + offsetX * inverseScale} ${province.center[1] + offsetY * inverseScale}) scale(${inverseScale})`);
    });
  }

  function zoomBy(factor, pointer = { x: 0.5, y: 0.5 }) {
    camera = MODEL.zoomCameraAt(camera, camera.zoom * factor, pointer, DATA.viewBox, mapAspect());
    applyCamera();
  }

  function defaultCameraZoom() {
    const worldAspect = DATA.viewBox.width / DATA.viewBox.height;
    return Math.min(MODEL.MAX_ZOOM, Math.max(1, worldAspect / mapAspect() * 0.84));
  }

  function resetCamera() {
    camera = MODEL.clampCamera({
      cx: DATA.viewBox.x + DATA.viewBox.width / 2,
      cy: DATA.viewBox.y + DATA.viewBox.height / 2,
      zoom: defaultCameraZoom()
    }, DATA.viewBox, mapAspect());
    applyCamera();
    announce(t("镜头已重置", "Camera reset"));
  }

  function beginPinch() {
    const values = Array.from(pointers.values());
    if (values.length < 2) return;
    const [left, right] = values;
    const metrics = mapViewportMetrics();
    const midpoint = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
    pinchState = {
      distance: Math.hypot(left.x - right.x, left.y - right.y),
      camera: { ...camera },
      ratio: {
        x: Math.min(1, Math.max(0, (midpoint.x - metrics.left) / metrics.width)),
        y: Math.min(1, Math.max(0, (midpoint.y - metrics.top) / metrics.height))
      },
      midpoint
    };
    dragState = null;
  }

  function setInspectorCollapsed(collapsed) {
    dom.inspector.classList.toggle("is-collapsed", collapsed);
    dom.body.dataset.inspectorCollapsed = collapsed ? "true" : "false";
    dom.inspectorToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    window.requestAnimationFrame(applyCamera);
  }

  dom.mapSvg.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const provinceNode = event.target.closest?.(".province-shape");
    const armyNode = event.target.closest?.(".army-marker");
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dom.mapSvg.setPointerCapture(event.pointerId);
    dom.mapSvg.classList.add("is-dragging");
    dom.mapTooltip.hidden = true;
    if (pointers.size >= 2) {
      beginPinch();
      return;
    }
    dragState = {
      x: event.clientX,
      y: event.clientY,
      total: 0,
      provinceId: provinceNode?.dataset.provinceId || null,
      armyId: armyNode?.dataset.armyId || null
    };
  });

  dom.mapSvg.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) {
      const provinceNode = event.target.closest?.(".province-shape");
      setHoveredProvince(provinceNode?.dataset.provinceId || null, event);
      return;
    }
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && pinchState) {
      const values = Array.from(pointers.values());
      const [left, right] = values;
      const distance = Math.max(1, Math.hypot(left.x - right.x, left.y - right.y));
      const midpoint = { x: (left.x + right.x) / 2, y: (left.y + right.y) / 2 };
      const nextZoom = pinchState.camera.zoom * distance / Math.max(1, pinchState.distance);
      const viewportAspect = mapAspect();
      let nextCamera = MODEL.zoomCameraAt(pinchState.camera, nextZoom, pinchState.ratio, DATA.viewBox, viewportAspect);
      const view = MODEL.cameraView(nextCamera, DATA.viewBox, viewportAspect);
      const metrics = mapViewportMetrics(view);
      nextCamera.cx -= (midpoint.x - pinchState.midpoint.x) / metrics.width * view.width;
      nextCamera.cy -= (midpoint.y - pinchState.midpoint.y) / metrics.height * view.height;
      camera = MODEL.clampCamera(nextCamera, DATA.viewBox, viewportAspect);
      suppressClick = true;
      applyCamera();
      return;
    }
    if (!dragState) return;
    const dx = event.clientX - dragState.x;
    const dy = event.clientY - dragState.y;
    const viewportAspect = mapAspect();
    const view = MODEL.cameraView(camera, DATA.viewBox, viewportAspect);
    const metrics = mapViewportMetrics(view);
    camera = MODEL.clampCamera({
      cx: camera.cx - dx / metrics.width * view.width,
      cy: camera.cy - dy / metrics.height * view.height,
      zoom: camera.zoom
    }, DATA.viewBox, viewportAspect);
    dragState.x = event.clientX;
    dragState.y = event.clientY;
    dragState.total += Math.hypot(dx, dy);
    if (dragState.total > 5) suppressClick = true;
    applyCamera();
  });

  function finishPointer(event) {
    const tapTarget = event.type === "pointerup" && pointers.size === 1 && !pinchState && dragState?.total <= 5
      ? { provinceId: dragState.provinceId, armyId: dragState.armyId }
      : null;
    pointers.delete(event.pointerId);
    if (pointers.size === 1) {
      const remaining = Array.from(pointers.values())[0];
      dragState = { x: remaining.x, y: remaining.y, total: 6 };
      pinchState = null;
    } else if (!pointers.size) {
      dragState = null;
      pinchState = null;
      dom.mapSvg.classList.remove("is-dragging");
      if (tapTarget?.armyId || tapTarget?.provinceId) {
        suppressClick = true;
        if (tapTarget.armyId) activateArmyMarker(tapTarget.armyId);
        else activateProvince(tapTarget.provinceId);
      }
      window.setTimeout(() => { suppressClick = false; }, 0);
    }
  }

  dom.mapSvg.addEventListener("pointerup", finishPointer);
  dom.mapSvg.addEventListener("pointercancel", finishPointer);
  dom.mapSvg.addEventListener("pointerleave", (event) => {
    if (!pointers.has(event.pointerId)) setHoveredProvince(null, null);
  });

  dom.mapSvg.addEventListener("click", (event) => {
    if (suppressClick) return;
    const armyNode = event.target.closest?.(".army-marker");
    if (armyNode) {
      activateArmyMarker(armyNode.dataset.armyId);
      return;
    }
    const provinceNode = event.target.closest?.(".province-shape");
    if (provinceNode) activateProvince(provinceNode.dataset.provinceId);
  });

  dom.mapSvg.addEventListener("wheel", (event) => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0014);
    zoomBy(factor, mapPointerRatio(event));
  }, { passive: false });

  dom.modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mapMode)));
  dom.zoomInButton.addEventListener("click", () => zoomBy(1.25));
  dom.zoomOutButton.addEventListener("click", () => zoomBy(0.8));
  dom.zoomResetButton.addEventListener("click", resetCamera);
  dom.endPhaseButton.addEventListener("click", () => endPlayerPhase({ focusControl: true }));
  dom.recruitButton.addEventListener("click", executeRecruitment);
  dom.inspectorToggle.addEventListener("click", () => setInspectorCollapsed(!dom.inspector.classList.contains("is-collapsed")));
  dom.reliefToggle.addEventListener("click", () => setReliefMode(reliefMode === "3d" ? "2d" : "3d"));
  dom.languageToggle.addEventListener("click", () => {
    language = language === "en" ? "zh" : "en";
    updateStaticLanguage();
    announce(t("已切换为中文", "English enabled"));
  });
  dom.seedForm.addEventListener("submit", (event) => {
    event.preventDefault();
    scenario = MODEL.createScenario(DATA, geography, dom.seedInput.value || Date.now());
    dom.seedInput.value = String(scenario.seed);
    movementCount = 0;
    lastBattleReport = null;
    lastPhaseReport = null;
    lastRecruitReport = null;
    combatLockedUntil = 0;
    phaseLockedUntil = 0;
    recruitLockedUntil = 0;
    updateScenarioReadout();
    selectedArmyId = null;
    updateScenarioMap();
    updateUrl();
    announce(t(`局势已按种子 ${scenario.seed} 重排；地理保持不变`, `Scenario reshuffled with seed ${scenario.seed}; geography unchanged`));
  });

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    if (target?.matches?.("input, textarea, select") || target?.isContentEditable) return;
    if (event.key.toLowerCase() === "v") {
      event.preventDefault();
      if (!event.repeat) executeRecruitment();
      return;
    }
    if (event.key.toLowerCase() === "e") {
      event.preventDefault();
      if (!event.repeat) endPlayerPhase({ focusControl: true });
      return;
    }
    if (["1", "2", "3"].includes(event.key)) {
      setMode(["political", "terrain", "military"][Number(event.key) - 1]);
      return;
    }
    if (event.key === "0") {
      event.preventDefault();
      resetCamera();
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1.25);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomBy(0.8);
    } else if (event.key === "Escape") {
      selectedArmyId = null;
      armyNodes.forEach((node) => node.classList.remove("is-selected"));
      renderMovementTargets();
      renderInspector();
      setInspectorCollapsed(true);
    }
  });

  window.addEventListener("resize", () => {
    applyReliefProjection();
    applyCamera();
  });

  buildStaticMap();
  setReliefMode(reliefMode, false);
  dom.seedInput.value = String(scenario.seed);
  updateScenarioReadout();
  updateScenarioMap();
  updateStaticLanguage();
  setMode(mode, false);
  selectProvince(selectedProvinceId);
  resetCamera();
})();
