"use strict";

(function exposeCradlesBalance(root) {
  const TERRAIN_EFFECTS = Object.freeze({
    tundra: { label: "冻原", attack: -3, defense: 3, attrition: 1.05 },
    coast: { label: "海岸", attack: -2, defense: 3, attrition: 1.02 },
    mountain: { label: "山地", attack: -5, defense: 6, attrition: 1.1 },
    plain: { label: "平原", attack: 4, defense: -2, attrition: 0.98 },
    basin: { label: "盆地", attack: 1, defense: 1, attrition: 1 },
    urban: { label: "城邦", attack: -4, defense: 6, attrition: 1.05 },
    salt: { label: "盐碱地", attack: 3, defense: -3, attrition: 1.07 },
    river: { label: "河谷", attack: -4, defense: 5, attrition: 1.06 },
    waste: { label: "荒原", attack: 2, defense: -3, attrition: 1.08 },
    canyon: { label: "峡谷", attack: -5, defense: 7, attrition: 1.08 }
  });

  const GOVERNOR_EFFECTS = Object.freeze({
    "east-asian-man": { populationGrowth: 1.08, defense: 6, beliefGrowth: 1, economyGrowth: 1, terrainMastery: 1, fullIntel: false },
    "white-woman": { populationGrowth: 1, defense: 0, attack: 6, beliefGrowth: 1.08, economyGrowth: 1, terrainMastery: 1, fullIntel: false },
    "black-man": { populationGrowth: 1, defense: 0, attack: 0, beliefGrowth: 1, economyGrowth: 1.1, terrainMastery: 1.35, fullIntel: false },
    listener: { populationGrowth: 1, defense: 0, attack: 0, beliefGrowth: 1, economyGrowth: 1, terrainMastery: 1, fullIntel: true }
  });

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function governorEffects(governorId) {
    return GOVERNOR_EFFECTS[governorId] || GOVERNOR_EFFECTS["east-asian-man"];
  }

  function terrainProfile(terrainId, governorId = null) {
    const base = TERRAIN_EFFECTS[terrainId] || TERRAIN_EFFECTS.plain;
    const mastery = governorEffects(governorId).terrainMastery || 1;
    const master = (value) => value >= 0 ? value * mastery : value / mastery;
    return {
      ...base,
      attack: Math.round(master(base.attack)),
      defense: Math.round(master(base.defense)),
      attrition: 1 + (base.attrition - 1) / mastery
    };
  }

  function casualtyProbability(combatDifference, engagementIntensity, hasEraAdvantage) {
    const minimum = 0.05;
    const maximum = hasEraAdvantage ? 0.95 : 0.8;
    const scale = hasEraAdvantage ? 16 : 24;
    const logistic = 1 / (1 + Math.exp(-Number(combatDifference || 0) / scale));
    const intensity = clamp(Number(engagementIntensity) || 0, 0, 1);
    return clamp(minimum + (maximum - minimum) * intensity * logistic, minimum, maximum);
  }

  function resolveBattleCasualties(input = {}) {
    const attackerForce = Math.max(0, Math.round(Number(input.attackerForce) || 0));
    const defenderForce = Math.max(0, Math.round(Number(input.defenderForce) || 0));
    const seed = Math.abs(Math.round(Number(input.seed) || 1));
    const technologyGap = Math.round(Number(input.technologyGap) || 0);
    const hasEraAdvantage = Math.abs(technologyGap) >= 1;
    const engagementIntensity = 0.08 + ((seed * 73) % 9201) / 10000;
    const randomSwing = ((seed * 37) % 17) - 8;
    const difference = Number(input.combatDifference || 0) + technologyGap * 18 + randomSwing;
    const defenderCasualtyRate = casualtyProbability(difference, engagementIntensity, hasEraAdvantage);
    const attackerCasualtyRate = casualtyProbability(-difference, engagementIntensity, hasEraAdvantage);
    const attackerCasualties = Math.min(attackerForce, Math.max(attackerForce > 0 ? 1 : 0, Math.round(attackerForce * attackerCasualtyRate)));
    const defenderCasualties = Math.min(defenderForce, Math.max(defenderForce > 0 ? 1 : 0, Math.round(defenderForce * defenderCasualtyRate)));
    const attackerSurvivors = attackerForce - attackerCasualties;
    const defenderSurvivors = defenderForce - defenderCasualties;
    const victoryProbability = 1 / (1 + Math.exp(-difference / 18));
    const victoryRoll = ((seed * 97) % 10000) / 10000;
    const attackerWon = victoryRoll < victoryProbability;
    const maximumCasualtyRate = Math.max(attackerCasualtyRate, defenderCasualtyRate);
    const scale = maximumCasualtyRate > 0.8
      ? "bloodbath"
      : maximumCasualtyRate > 0.1
        ? "battle"
        : "conflict";
    return {
      attackerWon,
      attackerSurvivors,
      defenderSurvivors,
      attackerCasualties,
      defenderCasualties,
      attackerCasualtyRate,
      defenderCasualtyRate,
      engagementIntensity,
      combatDifference: difference,
      victoryProbability,
      technologyGap,
      scale
    };
  }

  function territoryDevelopmentEffects(territoryCount) {
    const count = clamp(Math.round(Number(territoryCount) || 0), 0, 25);
    const expansion = Math.max(0, count - 5);
    return {
      carryingCapacity: expansion * 2200,
      outputMultiplier: 1 + Math.min(0.14, Math.sqrt(expansion) * 0.032),
      administrationCost: Math.round(Math.pow(expansion, 1.24) * 520),
      orderDrag: Math.round(Math.pow(Math.max(0, count - 8), 1.16) * 0.72)
    };
  }

  root.CRADLES_BALANCE = Object.freeze({
    TERRAIN_EFFECTS,
    GOVERNOR_EFFECTS,
    governorEffects,
    terrainProfile,
    casualtyProbability,
    resolveBattleCasualties,
    territoryDevelopmentEffects
  });
})(typeof window !== "undefined" ? window : globalThis);
