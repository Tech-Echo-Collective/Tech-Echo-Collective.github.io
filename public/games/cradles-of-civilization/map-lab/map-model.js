"use strict";

(function installMapLabModel(global) {
  const EPSILON = 1e-7;
  const MIN_ZOOM = 0.8;
  const MAX_ZOOM = 4;
  const PLAYER_REALM_ID = "player-realm";
  const RECRUITMENT_FORCE = 5200;
  const RECRUITMENT_COOLDOWN = 4;
  const MILITARY_FORCE_CAP = 120000;
  const NEUTRAL_REALM_IDS = new Set(["polaris-see", "free-cities"]);
  const HOSTILE_REALM_IDS = new Set(["solar-court", "ash-confederacy"]);

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function round(value, precision = 3) {
    const scale = 10 ** precision;
    return Math.round(value * scale) / scale;
  }

  function fnv1a(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeSeed(value) {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    if (Number.isFinite(parsed)) return Math.max(1, Math.abs(parsed) % 2147483647);
    return Math.max(1, fnv1a(String(value || "1058")) % 2147483647);
  }

  function hashUnit(seed, ...parts) {
    return fnv1a(`${normalizeSeed(seed)}|${parts.join("|")}`) / 4294967296;
  }

  function initialRealmRelations(data) {
    return Object.fromEntries(data.realms.map((realm) => {
      if (realm.id === PLAYER_REALM_ID) return [realm.id, "player"];
      if (NEUTRAL_REALM_IDS.has(realm.id)) return [realm.id, "neutral"];
      if (HOSTILE_REALM_IDS.has(realm.id)) return [realm.id, "hostile"];
      return [realm.id, "neutral"];
    }));
  }

  function polygonArea(points) {
    let area = 0;
    points.forEach((point, index) => {
      const next = points[(index + 1) % points.length];
      area += point.x * next.y - next.x * point.y;
    });
    return Math.abs(area) / 2;
  }

  function clipPolygonToBisector(points, site, other) {
    const a = 2 * (other.x - site.x);
    const b = 2 * (other.y - site.y);
    const c = other.x * other.x + other.y * other.y - site.x * site.x - site.y * site.y;
    const inside = (point) => a * point.x + b * point.y <= c + EPSILON;
    const intersection = (start, end) => {
      const denominator = a * (end.x - start.x) + b * (end.y - start.y);
      if (Math.abs(denominator) < EPSILON) return { x: start.x, y: start.y };
      const ratio = clamp((c - a * start.x - b * start.y) / denominator, 0, 1);
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio
      };
    };

    const clipped = [];
    points.forEach((current, index) => {
      const previous = points[(index + points.length - 1) % points.length];
      const currentInside = inside(current);
      const previousInside = inside(previous);
      if (currentInside) {
        if (!previousInside) clipped.push(intersection(previous, current));
        clipped.push(current);
      } else if (previousInside) {
        clipped.push(intersection(previous, current));
      }
    });
    return clipped;
  }

  function buildVoronoiCells(data) {
    const { x, y, width, height } = data.viewBox;
    const margin = Math.max(width, height) * 0.08;
    const bounds = [
      { x: x - margin, y: y - margin },
      { x: x + width + margin, y: y - margin },
      { x: x + width + margin, y: y + height + margin },
      { x: x - margin, y: y + height + margin }
    ];
    const sites = data.provinces.map((province) => ({
      id: province.id,
      x: province.center[0],
      y: province.center[1]
    }));

    return sites.map((site) => {
      let points = bounds.map((point) => ({ ...point }));
      sites.forEach((other) => {
        if (other.id === site.id || points.length < 3) return;
        points = clipPolygonToBisector(points, site, other);
      });
      return {
        provinceId: site.id,
        points: points.map((point) => ({ x: round(point.x), y: round(point.y) }))
      };
    });
  }

  function pointKey(point) {
    return `${round(point.x, 2)},${round(point.y, 2)}`;
  }

  function edgeKey(left, right) {
    return [pointKey(left), pointKey(right)].sort().join("|");
  }

  function buildSharedEdges(cells, provinceById) {
    const buckets = new Map();
    cells.forEach((cell) => {
      cell.points.forEach((start, index) => {
        const end = cell.points[(index + 1) % cell.points.length];
        const key = edgeKey(start, end);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push({ provinceId: cell.provinceId, start, end });
      });
    });

    const sharedEdges = [];
    buckets.forEach((records) => {
      const unique = Array.from(new Map(records.map((record) => [record.provinceId, record])).values());
      if (unique.length !== 2) return;
      const [left, right] = unique;
      const a = provinceById[left.provinceId];
      const b = provinceById[right.provinceId];
      sharedEdges.push({
        a: a.id,
        b: b.id,
        start: left.start,
        end: left.end,
        strategicBoundary: a.strategicRegionId !== b.strategicRegionId
      });
    });
    return sharedEdges;
  }

  function buildNeighborIndex(provinceIds, sharedEdges) {
    const neighbors = Object.fromEntries(provinceIds.map((id) => [id, []]));
    sharedEdges.forEach((edge) => {
      neighbors[edge.a].push(edge.b);
      neighbors[edge.b].push(edge.a);
    });
    Object.values(neighbors).forEach((values) => values.sort());
    return neighbors;
  }

  function connectedComponents(provinceIds, neighbors) {
    const remaining = new Set(provinceIds);
    const components = [];
    while (remaining.size) {
      const first = remaining.values().next().value;
      const queue = [first];
      const component = [];
      remaining.delete(first);
      while (queue.length) {
        const current = queue.shift();
        component.push(current);
        (neighbors[current] || []).forEach((neighbor) => {
          if (!remaining.has(neighbor)) return;
          remaining.delete(neighbor);
          queue.push(neighbor);
        });
      }
      components.push(component);
    }
    return components;
  }

  function bridgeDisconnectedComponents(data, neighbors, sharedEdges) {
    const provinceById = Object.fromEntries(data.provinces.map((province) => [province.id, province]));
    let components = connectedComponents(data.provinces.map((province) => province.id), neighbors);
    while (components.length > 1) {
      const left = components[0];
      let best = null;
      components.slice(1).forEach((right) => {
        left.forEach((leftId) => {
          right.forEach((rightId) => {
            const leftPoint = provinceById[leftId].center;
            const rightPoint = provinceById[rightId].center;
            const distance = Math.hypot(leftPoint[0] - rightPoint[0], leftPoint[1] - rightPoint[1]);
            if (!best || distance < best.distance) best = { leftId, rightId, distance };
          });
        });
      });
      neighbors[best.leftId].push(best.rightId);
      neighbors[best.rightId].push(best.leftId);
      sharedEdges.push({
        a: best.leftId,
        b: best.rightId,
        start: { x: provinceById[best.leftId].center[0], y: provinceById[best.leftId].center[1] },
        end: { x: provinceById[best.rightId].center[0], y: provinceById[best.rightId].center[1] },
        strategicBoundary: provinceById[best.leftId].strategicRegionId !== provinceById[best.rightId].strategicRegionId,
        synthetic: true
      });
      neighbors[best.leftId].sort();
      neighbors[best.rightId].sort();
      components = connectedComponents(data.provinces.map((province) => province.id), neighbors);
    }
  }

  function geographySignature(data, cells, sharedEdges) {
    const payload = JSON.stringify({
      id: data.id,
      revision: data.geometryRevision,
      landPath: data.landPath,
      provinces: data.provinces.map((province) => [province.id, province.center, province.terrain, province.strategicRegionId]),
      cells: cells.map((cell) => [cell.provinceId, cell.points.map((point) => [point.x, point.y])]),
      connections: sharedEdges.map((edge) => [edge.a, edge.b]).sort()
    });
    return fnv1a(payload).toString(16).padStart(8, "0");
  }

  function buildGeography(data) {
    const provinceById = Object.fromEntries(data.provinces.map((province) => [province.id, province]));
    const cells = buildVoronoiCells(data);
    const sharedEdges = buildSharedEdges(cells, provinceById);
    const neighbors = buildNeighborIndex(data.provinces.map((province) => province.id), sharedEdges);
    bridgeDisconnectedComponents(data, neighbors, sharedEdges);
    return {
      cells,
      cellByProvinceId: Object.fromEntries(cells.map((cell) => [cell.provinceId, cell])),
      sharedEdges,
      connections: sharedEdges.map((edge) => ({ a: edge.a, b: edge.b, type: edge.synthetic ? "pass" : "land", cost: edge.synthetic ? 1.4 : 1 })),
      neighbors,
      provinceById,
      strategicRegionById: Object.fromEntries(data.strategicRegions.map((region) => [region.id, region])),
      realmById: Object.fromEntries(data.realms.map((realm) => [realm.id, realm])),
      terrainById: data.terrainTypes,
      signature: geographySignature(data, cells, sharedEdges)
    };
  }

  function selectCapitals(data, seed) {
    const selected = new Set();
    const capitals = {};
    data.realms.forEach((realm) => {
      const candidates = data.provinces
        .filter((province) => realm.capitalRegionIds.includes(province.strategicRegionId) && !selected.has(province.id))
        .sort((left, right) => hashUnit(seed, realm.id, left.id, "capital") - hashUnit(seed, realm.id, right.id, "capital"));
      const capital = candidates[0] || data.provinces.find((province) => !selected.has(province.id));
      capitals[realm.id] = capital.id;
      selected.add(capital.id);
    });
    return capitals;
  }

  function createScenario(data, geography, seedValue) {
    const seed = normalizeSeed(seedValue);
    const capitals = selectCapitals(data, seed);
    const controllerByProvince = {};
    const territories = Object.fromEntries(data.realms.map((realm) => [realm.id, new Set()]));
    data.realms.forEach((realm) => {
      const capitalId = capitals[realm.id];
      controllerByProvince[capitalId] = realm.id;
      territories[realm.id].add(capitalId);
    });

    const unassigned = new Set(data.provinces.map((province) => province.id).filter((id) => !controllerByProvince[id]));
    const baseTarget = Math.floor(data.provinces.length / data.realms.length);
    const targets = Object.fromEntries(data.realms.map((realm, index) => [
      realm.id,
      baseTarget + (index < data.provinces.length % data.realms.length ? 1 : 0)
    ]));
    let step = 0;

    while (unassigned.size) {
      const options = data.realms.map((realm) => {
        const frontier = new Set();
        territories[realm.id].forEach((provinceId) => {
          (geography.neighbors[provinceId] || []).forEach((neighborId) => {
            if (unassigned.has(neighborId)) frontier.add(neighborId);
          });
        });
        return {
          realm,
          frontier: Array.from(frontier),
          ratio: territories[realm.id].size / targets[realm.id],
          tie: hashUnit(seed, step, realm.id, "turn")
        };
      }).filter((option) => option.frontier.length);

      if (!options.length) throw new Error("Scenario expansion could not reach every province.");
      options.sort((left, right) => left.ratio - right.ratio || left.tie - right.tie);
      const option = options[0];
      const capitalProvince = geography.provinceById[capitals[option.realm.id]];
      const preferredRegions = new Set(option.realm.capitalRegionIds);
      option.frontier.sort((leftId, rightId) => {
        const score = (provinceId) => {
          const province = geography.provinceById[provinceId];
          const distance = Math.hypot(
            province.center[0] - capitalProvince.center[0],
            province.center[1] - capitalProvince.center[1]
          );
          return (preferredRegions.has(province.strategicRegionId) ? 0.9 : 0) - distance / 1200 + hashUnit(seed, option.realm.id, provinceId, step) * 0.55;
        };
        return score(rightId) - score(leftId);
      });
      const provinceId = option.frontier[0];
      controllerByProvince[provinceId] = option.realm.id;
      territories[option.realm.id].add(provinceId);
      unassigned.delete(provinceId);
      step += 1;
    }

    const provinceState = {};
    data.provinces.forEach((province) => {
      const developmentSwing = Math.floor(hashUnit(seed, province.id, "development") * 7) - 3;
      const fortificationSwing = Math.floor(hashUnit(seed, province.id, "fortification") * 13) - 6;
      const supplySwing = Math.floor(hashUnit(seed, province.id, "supply") * 15) - 7;
      provinceState[province.id] = {
        controllerId: controllerByProvince[province.id],
        development: Math.max(1, province.base.development + developmentSwing),
        fortification: Math.max(10, province.base.fortification + fortificationSwing),
        supply: clamp(province.base.supply + supplySwing, 15, 100),
        population: Math.max(20, province.base.population + Math.floor(hashUnit(seed, province.id, "population") * 41) - 20),
        resourceRoll: round(hashUnit(seed, province.id, "resource"), 4)
      };
    });

    const armies = [];
    data.realms.forEach((realm) => {
      const owned = Array.from(territories[realm.id]);
      const capitalId = capitals[realm.id];
      const reserveId = owned
        .filter((provinceId) => provinceId !== capitalId)
        .sort((left, right) => {
          const leftScore = provinceState[left].development + hashUnit(seed, realm.id, left, "reserve") * 8;
          const rightScore = provinceState[right].development + hashUnit(seed, realm.id, right, "reserve") * 8;
          return rightScore - leftScore;
        })[0] || capitalId;
      [
        { suffix: "capital", provinceId: capitalId, nameZh: "首都卫队", nameEn: "Capital Guard", scale: 1.1 },
        { suffix: "frontier", provinceId: reserveId, nameZh: "边境军团", nameEn: "Frontier Host", scale: 0.78 }
      ].forEach((definition) => {
        const roll = hashUnit(seed, realm.id, definition.suffix, "army");
        armies.push({
          id: `${realm.id}-${definition.suffix}`,
          realmId: realm.id,
          provinceId: definition.provinceId,
          nameZh: definition.nameZh,
          nameEn: definition.nameEn,
          force: Math.round((7200 + roll * 7600) * definition.scale),
          attack: Math.round(38 + roll * 28),
          defense: Math.round(42 + hashUnit(seed, realm.id, definition.suffix, "defense") * 30),
          lastActedTurn: 0
        });
      });
    });

    const realmRelations = initialRealmRelations(data);
    const recruitment = { cooldown: 0, used: 0, lastUsedTurn: 0 };
    return {
      mapId: data.id,
      scenarioVersion: 1,
      seed,
      capitals,
      controllerByProvince,
      provinceState,
      armies,
      realmRelations,
      recruitment,
      turn: 1,
      battleCount: 0,
      signature: fnv1a(JSON.stringify({ seed, capitals, controllerByProvince, provinceState, armies, realmRelations, recruitment })).toString(16).padStart(8, "0")
    };
  }

  function isConnectedSubset(ids, neighbors) {
    const allowed = new Set(ids);
    if (!allowed.size) return false;
    const first = allowed.values().next().value;
    const visited = new Set([first]);
    const queue = [first];
    while (queue.length) {
      const current = queue.shift();
      (neighbors[current] || []).forEach((neighbor) => {
        if (!allowed.has(neighbor) || visited.has(neighbor)) return;
        visited.add(neighbor);
        queue.push(neighbor);
      });
    }
    return visited.size === allowed.size;
  }

  function realmRelation(scenario, realmId) {
    if (realmId === PLAYER_REALM_ID) return "player";
    const stored = scenario?.realmRelations?.[realmId];
    if (stored === "neutral" || stored === "hostile") return stored;
    if (HOSTILE_REALM_IDS.has(realmId)) return "hostile";
    return "neutral";
  }

  function canRealmAttack(scenario, attackerRealmId, defenderRealmId, playerRealmId = PLAYER_REALM_ID) {
    if (!attackerRealmId || !defenderRealmId || attackerRealmId === defenderRealmId) return false;
    return defenderRealmId !== playerRealmId || realmRelation(scenario, attackerRealmId) !== "neutral";
  }

  function ensureRealmRelations(scenario, geography) {
    if (!scenario.realmRelations || typeof scenario.realmRelations !== "object") scenario.realmRelations = {};
    Object.keys(geography.realmById).forEach((realmId) => {
      if (["player", "neutral", "hostile"].includes(scenario.realmRelations[realmId])) return;
      scenario.realmRelations[realmId] = realmId === PLAYER_REALM_ID
        ? "player"
        : HOSTILE_REALM_IDS.has(realmId) ? "hostile" : "neutral";
    });
    return scenario.realmRelations;
  }

  function recruitmentRecord(scenario) {
    const source = scenario?.recruitment && typeof scenario.recruitment === "object" ? scenario.recruitment : {};
    return {
      cooldown: Math.max(0, Math.round(Number(source.cooldown) || 0)),
      used: Math.max(0, Math.round(Number(source.used) || 0)),
      lastUsedTurn: Math.max(0, Math.round(Number(source.lastUsedTurn) || 0))
    };
  }

  function tickRecruitmentCooldown(scenario) {
    if (!scenario?.recruitment || typeof scenario.recruitment !== "object") {
      return { before: 0, after: 0 };
    }
    const record = recruitmentRecord(scenario);
    const before = record.cooldown;
    record.cooldown = Math.max(0, before - 1);
    scenario.recruitment = record;
    return { before, after: record.cooldown };
  }

  function recruitmentResultBase(scenario, realmId, provinceId) {
    const record = recruitmentRecord(scenario);
    return {
      realmId,
      provinceId,
      cooldown: record.cooldown,
      used: record.used
    };
  }

  function executeRecruitment(scenario, geography, provinceId, commandRealmId = PLAYER_REALM_ID) {
    const base = recruitmentResultBase(scenario, commandRealmId, provinceId);
    if (commandRealmId !== PLAYER_REALM_ID) {
      return { recruited: false, kind: "not-commandable", ...base };
    }
    if (!scenario || !Array.isArray(scenario.armies)) {
      return { recruited: false, kind: "invalid-scenario", ...base };
    }
    if (!geography?.provinceById?.[provinceId]) {
      return { recruited: false, kind: "invalid-province", ...base };
    }
    const controllerId = scenario.controllerByProvince?.[provinceId];
    if (controllerId !== commandRealmId) {
      return { recruited: false, kind: "not-owned", controllerId, ...base };
    }
    if (base.cooldown > 0) {
      return { recruited: false, kind: "cooldown", ...base };
    }

    const turn = Math.max(1, Math.round(Number(scenario.turn) || 1));
    const playerArmies = scenario.armies
      .filter((army) => army.realmId === commandRealmId && Number(army.force) > 0)
      .sort((left, right) => left.id.localeCompare(right.id));
    let army = playerArmies.find((candidate) => candidate.provinceId === provinceId) || null;
    let kind = "merge";
    const nextUsed = base.used + 1;

    if (!army) {
      const rebuilding = playerArmies.length === 0;
      kind = rebuilding ? "rebuild" : "new-army";
      const id = rebuilding ? `${PLAYER_REALM_ID}-capital` : `player-field-army-${turn}-${nextUsed}`;
      army = scenario.armies.find((candidate) => candidate.id === id) || {
        id,
        realmId: commandRealmId,
        provinceId,
        nameZh: rebuilding ? "新生军团" : "地方军团",
        nameEn: rebuilding ? "Reborn Legion" : "Local Legion",
        force: 0,
        attack: 42,
        defense: 46,
        lastActedTurn: turn - 1
      };
      army.realmId = commandRealmId;
      army.provinceId = provinceId;
      army.force = Math.max(0, Math.round(Number(army.force) || 0));
      army.attack = Math.round(Number(army.attack) || 42);
      army.defense = Math.round(Number(army.defense) || 46);
      army.lastActedTurn = turn - 1;
      if (!scenario.armies.includes(army)) scenario.armies.push(army);
    }

    const forceBefore = clamp(Math.round(Number(army.force) || 0), 0, MILITARY_FORCE_CAP);
    const forceAfter = clamp(forceBefore + RECRUITMENT_FORCE, 0, MILITARY_FORCE_CAP);
    army.force = forceAfter;
    scenario.recruitment = {
      cooldown: RECRUITMENT_COOLDOWN,
      used: nextUsed,
      lastUsedTurn: turn
    };
    return {
      recruited: true,
      kind,
      realmId: commandRealmId,
      provinceId,
      armyId: army.id,
      forceRequested: RECRUITMENT_FORCE,
      forceAdded: forceAfter - forceBefore,
      forceBefore,
      forceAfter,
      capped: forceAfter - forceBefore < RECRUITMENT_FORCE,
      cooldown: scenario.recruitment.cooldown,
      used: scenario.recruitment.used
    };
  }

  function classifyArmyDestination(scenario, geography, armyId, provinceId) {
    const army = scenario.armies.find((candidate) => candidate.id === armyId);
    if (!army || !geography.provinceById[provinceId]) return { kind: "invalid", army: army || null };
    if (army.provinceId === provinceId) return { kind: "current", army };
    const turn = Math.max(1, Math.round(Number(scenario.turn) || 1));
    if (Math.round(Number(army.lastActedTurn) || 0) >= turn) return { kind: "spent", army };
    if (!(geography.neighbors[army.provinceId] || []).includes(provinceId)) return { kind: "unreachable", army };
    const controllerId = scenario.controllerByProvince[provinceId];
    return {
      kind: controllerId === army.realmId ? "move" : "attack",
      army,
      controllerId
    };
  }

  function executeArmyMove(scenario, geography, armyId, provinceId, commandRealmId = "player-realm") {
    const classification = classifyArmyDestination(scenario, geography, armyId, provinceId);
    if (!classification.army) return { moved: false, kind: classification.kind };
    if (classification.army.realmId !== commandRealmId) {
      return { moved: false, kind: "not-commandable", army: classification.army };
    }
    if (classification.kind !== "move") return { moved: false, ...classification };
    const fromProvinceId = classification.army.provinceId;
    classification.army.provinceId = provinceId;
    classification.army.lastActedTurn = Math.max(1, Math.round(Number(scenario.turn) || 1));
    return {
      moved: true,
      kind: "move",
      army: classification.army,
      fromProvinceId,
      toProvinceId: provinceId
    };
  }

  function realmProvinceIds(scenario, realmId) {
    return Object.keys(scenario.controllerByProvince)
      .filter((provinceId) => scenario.controllerByProvince[provinceId] === realmId)
      .sort();
  }

  function strongestProvinceId(scenario, provinceIds) {
    return [...provinceIds].sort((leftId, rightId) => {
      const left = scenario.provinceState[leftId];
      const right = scenario.provinceState[rightId];
      return right.development - left.development || right.supply - left.supply || leftId.localeCompare(rightId);
    })[0] || null;
  }

  function battleSeed(scenario, armyId, originProvinceId, targetProvinceId, battleIndex) {
    return fnv1a([scenario.seed, battleIndex, armyId, originProvinceId, targetProvinceId, "battle"].join("|")) || 1;
  }

  function executeArmyBattle(scenario, geography, armyId, provinceId, commandRealmId = "player-realm") {
    const classification = classifyArmyDestination(scenario, geography, armyId, provinceId);
    const army = classification.army;
    if (!army) return { attacked: false, kind: classification.kind };
    if (army.realmId !== commandRealmId) return { attacked: false, kind: "not-commandable", army };
    if (classification.kind !== "attack") return { attacked: false, ...classification };
    if (!Number.isFinite(army.force) || army.force <= 0) return { attacked: false, kind: "no-force", army };
    if (scenario.controllerByProvince[army.provinceId] !== army.realmId) {
      return { attacked: false, kind: "invalid-origin", army };
    }
    const previousControllerId = classification.controllerId;
    if (!geography.realmById[previousControllerId]) return { attacked: false, kind: "invalid-controller", army };
    if (!canRealmAttack(scenario, army.realmId, previousControllerId)) {
      return {
        attacked: false,
        kind: "neutrality",
        army,
        previousControllerId,
        controllerId: previousControllerId
      };
    }
    const thirdPartyArmy = scenario.armies.find((candidate) => candidate.force > 0
      && candidate.provinceId === provinceId
      && candidate.realmId !== previousControllerId);
    if (thirdPartyArmy) return { attacked: false, kind: "contested", army, thirdPartyArmy };
    const resolver = global.CRADLES_BALANCE?.resolveBattleCasualties;
    if (typeof resolver !== "function") return { attacked: false, kind: "battle-model-unavailable", army };

    const originProvinceId = army.provinceId;
    const targetProvince = geography.provinceById[provinceId];
    const targetState = scenario.provinceState[provinceId];
    const terrain = geography.terrainById[targetProvince.terrain] || { attack: 0, defense: 0 };
    const fortificationBefore = clamp(Math.round(Number(targetState.fortification) || 0), 5, 140);
    const defenders = scenario.armies
      .filter((candidate) => candidate.force > 0
        && candidate.provinceId === provinceId
        && candidate.realmId === previousControllerId)
      .sort((left, right) => left.id.localeCompare(right.id));
    const fieldDefenderForce = defenders.reduce((sum, defender) => sum + Math.max(0, Math.round(defender.force)), 0);
    const garrisonForce = Math.round(350 + fortificationBefore * 28);
    const defenderEngagedForce = fieldDefenderForce + garrisonForce;
    const strongestDefense = defenders.reduce((maximum, defender) => Math.max(maximum, Number(defender.defense) || 0), 0);
    const defenseScore = (defenders.length ? strongestDefense + (defenders.length - 1) * 3 : 12)
      + Math.round(fortificationBefore * 0.2)
      + Number(terrain.defense || 0);
    const forceDifference = clamp(Math.round((army.force - fieldDefenderForce) / 2000), -12, 12);
    const combatDifference = Number(army.attack || 0) + Number(terrain.attack || 0) + forceDifference - defenseScore;
    const battleIndex = Math.max(0, Math.round(Number(scenario.battleCount) || 0));
    const seed = battleSeed(scenario, army.id, originProvinceId, provinceId, battleIndex);
    const result = resolver({
      attackerForce: army.force,
      defenderForce: defenderEngagedForce,
      combatDifference,
      technologyGap: 0,
      seed
    });

    const relationChanges = [];
    let provokedRealmId = null;
    if (army.realmId === PLAYER_REALM_ID && realmRelation(scenario, previousControllerId) === "neutral") {
      const relations = ensureRealmRelations(scenario, geography);
      relations[previousControllerId] = "hostile";
      provokedRealmId = previousControllerId;
      relationChanges.push({
        realmId: previousControllerId,
        from: "neutral",
        to: "hostile",
        reason: "player-attack"
      });
    }

    army.force = Math.max(0, Math.round(result.attackerSurvivors));
    const fieldCasualtyTarget = fieldDefenderForce > 0
      ? Math.min(fieldDefenderForce, Math.round(result.defenderCasualties * fieldDefenderForce / defenderEngagedForce))
      : 0;
    let assignedFieldCasualties = 0;
    defenders.forEach((defender, index) => {
      const remaining = fieldCasualtyTarget - assignedFieldCasualties;
      const plannedCasualties = index === defenders.length - 1
        ? remaining
        : Math.round(fieldCasualtyTarget * defender.force / fieldDefenderForce);
      const casualties = Math.min(defender.force, remaining, plannedCasualties);
      defender.force = Math.max(0, Math.round(defender.force - casualties));
      assignedFieldCasualties += casualties;
    });

    const attackerWon = Boolean(result.attackerWon && army.force > 0);
    const retreatProvinceIds = [];
    let eliminatedRealmId = null;
    if (attackerWon) {
      scenario.controllerByProvince[provinceId] = army.realmId;
      targetState.controllerId = army.realmId;
      army.provinceId = provinceId;
      const retreatProvinceId = (geography.neighbors[provinceId] || [])
        .filter((neighborId) => scenario.controllerByProvince[neighborId] === previousControllerId)
        .sort()[0] || null;
      defenders.forEach((defender) => {
        if (defender.force <= 0) return;
        if (retreatProvinceId) {
          defender.provinceId = retreatProvinceId;
          retreatProvinceIds.push(retreatProvinceId);
        } else {
          defender.force = 0;
        }
      });
      const remainingProvinceIds = realmProvinceIds(scenario, previousControllerId);
      if (!remainingProvinceIds.length) {
        eliminatedRealmId = previousControllerId;
        scenario.capitals[previousControllerId] = null;
        scenario.armies.forEach((candidate) => {
          if (candidate.realmId === previousControllerId) candidate.force = 0;
        });
      } else if (!remainingProvinceIds.includes(scenario.capitals[previousControllerId])) {
        scenario.capitals[previousControllerId] = strongestProvinceId(scenario, remainingProvinceIds);
      }
    }

    const heaviestLoss = Math.max(result.attackerCasualtyRate, result.defenderCasualtyRate);
    targetState.fortification = clamp(Math.round(fortificationBefore * (0.94 - heaviestLoss * 0.24)), 5, 140);
    army.lastActedTurn = Math.max(1, Math.round(Number(scenario.turn) || 1));
    scenario.battleCount = battleIndex + 1;
    scenario.armies = scenario.armies.filter((candidate) => Number.isFinite(candidate.force) && candidate.force > 0);
    const fieldDefenderSurvivors = scenario.armies
      .filter((candidate) => candidate.realmId === previousControllerId && defenders.some((defender) => defender.id === candidate.id))
      .reduce((sum, defender) => sum + defender.force, 0);

    return {
      attacked: true,
      kind: "battle",
      ...result,
      attackerWon,
      seed,
      battleIndex,
      attackerId: army.id,
      defenderArmyIds: defenders.map((defender) => defender.id),
      previousControllerId,
      controllerId: attackerWon ? army.realmId : previousControllerId,
      fromProvinceId: originProvinceId,
      toProvinceId: provinceId,
      attackerSurvivors: army.force,
      fieldDefenderCasualties: assignedFieldCasualties,
      fieldDefenderSurvivors,
      garrisonForce,
      fortificationBefore,
      fortificationAfter: targetState.fortification,
      retreatProvinceIds: [...new Set(retreatProvinceIds)],
      eliminatedRealmId,
      provokedRealmId,
      relationChanges
    };
  }

  function aiAttackScore(scenario, geography, army, provinceId) {
    const state = scenario.provinceState[provinceId];
    const terrain = geography.terrainById[geography.provinceById[provinceId].terrain] || { defense: 0 };
    const defenderForce = scenario.armies
      .filter((candidate) => candidate.provinceId === provinceId
        && candidate.realmId === scenario.controllerByProvince[provinceId]
        && candidate.force > 0)
      .reduce((sum, candidate) => sum + candidate.force, 0);
    return defenderForce / 900
      + state.fortification * 0.34
      + Number(terrain.defense || 0) * 1.8
      - army.force / 1100
      - army.attack * 0.42
      + hashUnit(scenario.seed, scenario.turn, army.id, provinceId, "ai-attack") * 2;
  }

  function firstStepTowardFrontier(scenario, geography, army, playerRealmId = PLAYER_REALM_ID) {
    const queue = [{ provinceId: army.provinceId, firstStepId: null, distance: 0 }];
    const visited = new Set([army.provinceId]);
    while (queue.length) {
      const current = queue.shift();
      if (current.provinceId !== army.provinceId
        && (geography.neighbors[current.provinceId] || []).some((neighborId) => {
          const defenderRealmId = scenario.controllerByProvince[neighborId];
          return canRealmAttack(scenario, army.realmId, defenderRealmId, playerRealmId);
        })) {
        return current;
      }
      const friendlyNeighbors = (geography.neighbors[current.provinceId] || [])
        .filter((neighborId) => scenario.controllerByProvince[neighborId] === army.realmId && !visited.has(neighborId))
        .sort();
      friendlyNeighbors.forEach((neighborId) => {
        visited.add(neighborId);
        queue.push({
          provinceId: neighborId,
          firstStepId: current.firstStepId || neighborId,
          distance: current.distance + 1
        });
      });
    }
    return null;
  }

  function executeRealmAiAction(scenario, geography, realmId) {
    const ownedProvinceIds = realmProvinceIds(scenario, realmId);
    if (!ownedProvinceIds.length) return { kind: "hold", realmId, reason: "eliminated" };
    const turn = Math.max(1, Math.round(Number(scenario.turn) || 1));
    const armies = scenario.armies
      .filter((army) => army.realmId === realmId
        && army.force > 0
        && scenario.controllerByProvince[army.provinceId] === realmId
        && Math.round(Number(army.lastActedTurn) || 0) < turn)
      .sort((left, right) => left.id.localeCompare(right.id));
    if (!armies.length) return { kind: "hold", realmId, reason: "no-army" };

    const attacks = armies.flatMap((army) => (geography.neighbors[army.provinceId] || [])
      .filter((provinceId) => canRealmAttack(scenario, realmId, scenario.controllerByProvince[provinceId]))
      .map((provinceId) => ({
        army,
        provinceId,
        score: aiAttackScore(scenario, geography, army, provinceId)
      })));
    attacks.sort((left, right) => left.score - right.score
      || left.army.id.localeCompare(right.army.id)
      || left.provinceId.localeCompare(right.provinceId));
    if (attacks[0]) {
      const order = attacks[0];
      const battle = executeArmyBattle(scenario, geography, order.army.id, order.provinceId, realmId);
      if (battle.attacked) {
        return {
          kind: "battle",
          realmId,
          armyId: order.army.id,
          fromProvinceId: battle.fromProvinceId,
          toProvinceId: battle.toProvinceId,
          battle
        };
      }
    }

    const marches = armies.map((army) => ({ army, route: firstStepTowardFrontier(scenario, geography, army) }))
      .filter((entry) => entry.route?.firstStepId)
      .sort((left, right) => left.route.distance - right.route.distance
        || left.army.id.localeCompare(right.army.id)
        || left.route.firstStepId.localeCompare(right.route.firstStepId));
    if (marches[0]) {
      const order = marches[0];
      const movement = executeArmyMove(scenario, geography, order.army.id, order.route.firstStepId, realmId);
      if (movement.moved) {
        return {
          kind: "move",
          realmId,
          armyId: order.army.id,
          fromProvinceId: movement.fromProvinceId,
          toProvinceId: movement.toProvinceId
        };
      }
    }
    return { kind: "hold", realmId, reason: "no-order" };
  }

  function executeAiPhase(scenario, geography, commandRealmId = "player-realm") {
    const turn = Math.max(1, Math.round(Number(scenario.turn) || 1));
    scenario.turn = turn;
    const actions = Object.keys(geography.realmById)
      .filter((realmId) => realmId !== commandRealmId)
      .sort()
      .map((realmId) => executeRealmAiAction(scenario, geography, realmId));
    const recruitmentCooldown = tickRecruitmentCooldown(scenario);
    scenario.turn = turn + 1;
    return { kind: "ai-phase", turn, nextTurn: scenario.turn, actions, recruitmentCooldown };
  }

  function cameraDimensions(zoom, viewBox, viewportAspect) {
    const worldAspect = viewBox.width / viewBox.height;
    const aspect = Number.isFinite(Number(viewportAspect)) && Number(viewportAspect) > 0
      ? Number(viewportAspect)
      : worldAspect;
    let width = viewBox.width;
    let height = viewBox.height;
    if (aspect > worldAspect) width = height * aspect;
    else height = width / aspect;
    return { width: width / zoom, height: height / zoom };
  }

  function cameraView(camera, viewBox, viewportAspect) {
    const requestedZoom = Number(camera.zoom);
    const zoom = clamp(Number.isFinite(requestedZoom) ? requestedZoom : 1, MIN_ZOOM, MAX_ZOOM);
    const { width, height } = cameraDimensions(zoom, viewBox, viewportAspect);
    return {
      x: camera.cx - width / 2,
      y: camera.cy - height / 2,
      width,
      height,
      zoom
    };
  }

  function clampCameraAxis(value, start, worldSize, visibleSize) {
    const midpoint = start + worldSize / 2;
    const margin = Math.min(worldSize * 0.08, visibleSize * 0.08);
    const minimum = start + visibleSize / 2 - margin;
    const maximum = start + worldSize - visibleSize / 2 + margin;
    if (minimum > maximum) return midpoint;
    return clamp(value, minimum, maximum);
  }

  function clampCamera(camera, viewBox, viewportAspect) {
    const requestedZoom = Number(camera.zoom);
    const zoom = clamp(Number.isFinite(requestedZoom) ? requestedZoom : 1, MIN_ZOOM, MAX_ZOOM);
    const { width, height } = cameraDimensions(zoom, viewBox, viewportAspect);
    const requestedX = Number(camera.cx);
    const requestedY = Number(camera.cy);
    const centerX = Number.isFinite(requestedX) ? requestedX : viewBox.x + viewBox.width / 2;
    const centerY = Number.isFinite(requestedY) ? requestedY : viewBox.y + viewBox.height / 2;
    return {
      cx: clampCameraAxis(centerX, viewBox.x, viewBox.width, width),
      cy: clampCameraAxis(centerY, viewBox.y, viewBox.height, height),
      zoom
    };
  }

  function zoomCameraAt(camera, nextZoom, pointer, viewBox, viewportAspect) {
    const currentView = cameraView(camera, viewBox, viewportAspect);
    const requestedX = Number(pointer?.x);
    const requestedY = Number(pointer?.y);
    const normalizedX = clamp(Number.isFinite(requestedX) ? requestedX : 0.5, 0, 1);
    const normalizedY = clamp(Number.isFinite(requestedY) ? requestedY : 0.5, 0, 1);
    const anchorX = currentView.x + currentView.width * normalizedX;
    const anchorY = currentView.y + currentView.height * normalizedY;
    const zoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const { width, height } = cameraDimensions(zoom, viewBox, viewportAspect);
    return clampCamera({
      cx: anchorX - width * normalizedX + width / 2,
      cy: anchorY - height * normalizedY + height / 2,
      zoom
    }, viewBox, viewportAspect);
  }

  global.CRADLES_MAP_LAB_MODEL = Object.freeze({
    MIN_ZOOM,
    MAX_ZOOM,
    RECRUITMENT_FORCE,
    RECRUITMENT_COOLDOWN,
    MILITARY_FORCE_CAP,
    normalizeSeed,
    hashUnit,
    polygonArea,
    buildGeography,
    createScenario,
    connectedComponents,
    isConnectedSubset,
    realmRelation,
    canRealmAttack,
    executeRecruitment,
    tickRecruitmentCooldown,
    classifyArmyDestination,
    executeArmyMove,
    executeArmyBattle,
    executeAiPhase,
    cameraView,
    clampCamera,
    zoomCameraAt
  });
})(typeof window !== "undefined" ? window : globalThis);
