// plugins/DevDdos.js
import { html as html2, render, useState, useLayoutEffect, useEffect } from "https://unpkg.com/htm/preact/standalone.module.js";

// plugins/infoUtils.js
import { html } from "https://unpkg.com/htm@3/preact/standalone.module.js";
var MAX_LOG_LENGTH = 1e3;
var infoMsg = [];
function addToLog(itemInfo2, setInfo) {
  infoMsg.push(itemInfo2);
  infoMsg = infoMsg.slice(-MAX_LOG_LENGTH);
  setInfo([...infoMsg]);
}
function refreshLast(itemInfo2, setInfo) {
  let lastOne = infoMsg.pop();
  addToLog(itemInfo2, setInfo);
}
var buttonStyle = {
  border: "1px solid #ffffff",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100px",
  height: "30px",
  margin: "5px",
  padding: "0 0.3em",
  color: "white",
  textAlign: "center",
  transition: "background-color 0.2s, color 0.2s",
  borderRadius: "3px"
};
var divStyle = {
  textAlign: "center",
  justifyContent: "space-around",
  width: "100%",
  marginTop: "10px"
};
var infoListStyle = {
  height: "400px",
  textAlign: "center",
  overflow: "scroll",
  background: "rgb(0,60,0)"
};
var colorInfo = (text, color) => {
  return html`<div style=${{ color }}>${text}</div>`;
};
var pinkInfo = (text) => {
  return colorInfo(text, "pink");
};
var normalInfo = (text) => {
  return colorInfo(text, "#AAC0CA");
};
function colorInfoWithFunc(content, color, onClick) {
  return html`<div 
        style=${{ color }}
        onClick=${() => {
    onClick();
  }}
        >${content}</div>`;
}

// plugins/logicForBasic.js
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var center = (plt) => {
  ui.centerLocationId(plt.locationId);
};
var beginTime;
var endTime;
var timer;
function beginSection(msg, setInfo) {
  let itemInfo2 = pinkInfo(msg);
  addToLog(itemInfo2, setInfo);
  beginTime = Date.now();
  timer = Date.now();
}
function endSection(msg, setInfo) {
  endTime = Date.now();
  let deltaTime = endTime - beginTime;
  let itemInfo2;
  deltaTime = Math.ceil(deltaTime);
  deltaTime *= 1e-3;
  itemInfo2 = normalInfo("delta time: " + deltaTime + "s");
  addToLog(itemInfo2, setInfo);
  itemInfo2 = pinkInfo(msg);
  addToLog(itemInfo2, setInfo);
}

// plugins/logicForArtifactState.js
import {
  ArtifactRarityNames,
  ArtifactTypeNames,
  ArtifactType
} from "https://cdn.skypack.dev/@darkforest_eth/types";

// plugins/cfgForBasic.js
var notOwnerAddress = "0x0000000000000000000000000000000000000000";
var mainAddress = "0xda3b0dffc6e7e07103d1f931f58c08c6db07c1a7";
var familyAddresses = [
  "0x9661491f283093046c1a5c1a2804d3b5d654a5d5",
  "0x6772b01b7d1197f0b7f923d7682cfef2971e839b",
  "0x19e63ee48e0df0534818398e68ac4c1fa68177fb",
  "0x102e277c34668e96cbed6169fa1195002c11d746",
  "0x19e63ee48e0df0534818398e68ac4c1fa68177fb",
  "0x7722b2bc715847a1684ae5fe66fb8f1e52736948"
];
var WORMHOLE_COOLDOWN_TIME = 48 * 60 * 60;
var ARTIFACT_COOLDOWN_TIME = 24 * 60 * 60;
var PHOTOID_CANNON_WAIT_TIME = df.contractConstants.PHOTOID_ACTIVATION_DELAY;
var MAX_WAIT_TIME_FOR_MOVE_SUBMIT = 20;
var MAX_WAIT_TIME_FOR_MOVE_CONFIRM = 20;
var MAX_MOVE_SILVER_TIME = 60 * 60 * 2;
var MAX_CATCH_INVADED_MOVE_TIME = 60 * 60;
var MAX_WAIT_TIME_FOR_CENTER_ENERGY = 60 * 60;
var MAX_WAIT_TIME_FOR_COLLECT_ENERGY = 60 * 60;
var MAX_WAIT_TIME_FOR_GOSSIP = 3 * 60 * 60;

// plugins/logicForPlanetState.js
import {
  PlanetType,
  SpaceType
} from "https://cdn.skypack.dev/@darkforest_eth/types";
var destroyedFilter = (plt) => {
  return plt.location !== void 0 && plt.destroyed === false;
};
var radiusFilter = (plt) => {
  let radius = df.worldRadius;
  let centerCoords = { x: 0, y: 0 };
  let dist = df.getDistCoords(plt.location.coords, centerCoords);
  return dist < radius;
};
var inBlueSpace = (planet) => planet.spaceType === SpaceType.NEBULA;
var inDarkblueSpace = (planet) => planet.spaceType === SpaceType.SPACE;
var isFoundry = (planet) => planet.planetType === PlanetType.RUINS;

// plugins/cfgForColor.js
var WARN = "yellow";
var INFO = "#AAC0CA";
var ERROR = "lightGreen";
var colorForError = ERROR;
var colorForWarn = WARN;
var colorForInfo = INFO;
var ABANDON_PLANETS = "lightGreen";

// plugins/logicForMove.js
function getUnconfirmedMoves() {
  let unconfirmed = Array.from(df.getUnconfirmedMoves()).filter((tx) => {
    if (tx.state === "Fail")
      return false;
    if (tx.state === "Confirm")
      return false;
    return true;
  }).map((tx) => tx.intent);
  return unconfirmed;
}
function getUnconfirmedMovesWithMaxWaitTime() {
  let timeStamp = Date.now();
  let maxWaitTimeForMoveSubmit = MAX_WAIT_TIME_FOR_MOVE_SUBMIT * 1e3;
  let maxWaitTimeForMoveConfirm = MAX_WAIT_TIME_FOR_MOVE_CONFIRM * 1e3;
  let unconfirmed = Array.from(df.getUnconfirmedMoves()).filter((tx) => tx.state != "Fail").filter((tx) => {
    if (tx.state === "Submit") {
      return tx.lastUpdatedAt + maxWaitTimeForMoveSubmit >= timeStamp;
    } else if (tx.state === "Confirm") {
      return tx.lastUpdatedAt + maxWaitTimeForMoveConfirm >= timeStamp;
    } else
      return true;
  }).map((it) => it.intent);
  return unconfirmed;
}
var waitForMoveOnchain = async (setInfo) => {
  let content, onClick, itemInfo2;
  let unconfirmed = getUnconfirmedMovesWithMaxWaitTime();
  let cnt = 0;
  let MaxCnt = unconfirmed.length * MAX_WAIT_TIME_FOR_MOVE_CONFIRM;
  content = unconfirmed.length + " unconfirmed move(s)";
  itemInfo2 = pinkInfo(content);
  addToLog(itemInfo2, setInfo);
  while (true) {
    if (cnt >= MaxCnt)
      break;
    console.error("wait cnt:" + cnt);
    console.log("max cnt:" + MaxCnt);
    unconfirmed = getUnconfirmedMovesWithMaxWaitTime();
    content = unconfirmed.length + " unconfirmed move(s); " + cnt + "s";
    itemInfo2 = normalInfo(content);
    if (cnt === 0)
      addToLog(itemInfo2, setInfo);
    else
      refreshLast(itemInfo2, setInfo);
    if (unconfirmed.length === 0)
      break;
    await sleep(1e3);
    cnt++;
  }
};
function getTimeForMoveInString(fromId, toId, abandoning) {
  let time = Math.ceil(df.getTimeForMove(fromId, toId, abandoning));
  let oneMinute = 60;
  let oneHour = 60 * oneMinute;
  let hours = Math.floor(time / oneHour);
  let minutes = Math.floor(time % oneHour / 60);
  let seconds = Math.ceil(time % oneHour % oneMinute);
  let res = hours + " hour(s) " + minutes + " minute(s) " + seconds + " second(s)";
  return res;
}
function changeSecondsToString(time) {
  let oneMinute = 60;
  let oneHour = 60 * oneMinute;
  let hours = Math.floor(time / oneHour);
  let minutes = Math.floor(time % oneHour / 60);
  let seconds = Math.ceil(time % oneHour % oneMinute);
  let res = hours + " hour(s) " + minutes + " minute(s) " + seconds + " second(s)";
  return res;
}

// plugins/logicForArtifactState.js
var isWormhole = (artifact) => artifact.artifactType === 5;
var isPhotoidCannon = (artifact) => artifact.artifactType === 7;
var isNormalArtifact = (artifact) => artifact.artifactType >= 1 && artifact.artifactType <= 9;
var canUse = (artifact) => {
  if (artifact === void 0)
    return false;
  if (artifact.unconfirmedWithdrawArtifact)
    return false;
  if (artifact.unconfirmedMove)
    return false;
  if (artifact.unconfirmedDeactivateArtifact)
    return false;
  if (isNormalArtifact(artifact) === false)
    return false;
  return true;
};
var isActivate = (artifact) => {
  if (canUse(artifact) === false)
    return false;
  return artifact.lastDeactivated < artifact.lastActivated;
};
var canActivate = (artifact) => {
  if (canUse(artifact) === false)
    return false;
  if (isNormalArtifact(artifact) === false)
    return 0;
  if (artifact.lastActivated === 0)
    return true;
  if (artifact.lastDeactivated > artifact.lastActivated) {
    if (isWormhole(artifact)) {
      if (Date.now() > 1e3 * (artifact.lastDeactivated + WORMHOLE_COOLDOWN_TIME))
        return true;
      else
        return false;
    } else {
      if (Date.now() > 1e3 * (artifact.lastDeactivated + ARTIFACT_COOLDOWN_TIME))
        return true;
      else
        return false;
    }
  } else if (isActivate(artifact)) {
    return false;
  }
};
var hasArtifact = (planet) => planet.heldArtifactIds.length !== 0;
var hasArtifactsCanActivate = (plt) => {
  let artifacts = df.getArtifactsWithIds(plt.heldArtifactIds);
  artifacts = artifacts.filter(canActivate);
  return artifacts.length !== 0;
};
var PhotoidCannonCanFire = (artifact) => {
  if (artifact === void 0)
    return false;
  if (isPhotoidCannon(artifact) === false)
    return false;
  if (isActivate(artifact) === false)
    return false;
  let activatedTime = artifact.lastActivated * 1e3;
  let waitingtime = PHOTOID_CANNON_WAIT_TIME * 1e3;
  let timeStamp = Date.now();
  if (activatedTime + waitingtime <= timeStamp)
    return true;
  return false;
};
var planetWithOpenFire = (plt) => {
  let artifacts = df.getArtifactsWithIds(plt.heldArtifactIds);
  for (let i = 0; i < artifacts.length; i++) {
    let rhs = artifacts[i];
    if (PhotoidCannonCanFire(rhs) === true)
      return true;
  }
  return false;
};
function artifactFilter(planet) {
  if (planetWithOpenFire(planet) === true)
    return false;
  return true;
}

// plugins/logicForMoveEnergy.js
function getArrivalsToPlanet(plt) {
  let planetId = plt.locationId;
  let timestamp = Math.floor(Date.now() * 1e-3);
  const unconfirmed = getUnconfirmedMoves().filter((move) => move.to === planetId);
  const arrivals = df.getAllVoyages().filter((arrival) => arrival.toPlanet === planetId && arrival.arrivalTime > timestamp);
  return arrivals.length + unconfirmed.length;
}
function getAimPlanetsFromPlanet(plt) {
  let planetId = plt.locationId;
  let timestamp = Math.floor(Date.now() * 1e-3);
  const unconfirmed = getUnconfirmedMoves().filter((move) => move.to === planetId);
  const arrivals = df.getAllVoyages().filter((arrival) => arrival.toPlanet === planetId && arrival.arrivalTime > timestamp);
  let resPlanets = [];
  unconfirmed.forEach((tx) => {
    if (tx.methodName === "move") {
      let fromId = tx.from;
      let plt2 = df.getPlanetWithId(fromId);
      resPlanets.push(plt2);
    }
  });
  arrivals.forEach((tx) => {
    let fromId = tx.fromPlanet;
    let plt2 = df.getPlanetWithId(fromId);
    resPlanets.push(plt2);
  });
  return resPlanets;
}
var judgeRange = (from, to, fromEnergyPercent = 1) => {
  let fromId = from.locationId;
  let toId = to.locationId;
  let fromEnergy = getEnergyCanSend(from) * fromEnergyPercent;
  let arrivingEnergy = 5;
  let energyNeed = Math.ceil(df.getEnergyNeededForMove(fromId, toId, arrivingEnergy));
  return energyNeed < fromEnergy;
};
var getEnergyCanSend = (plt) => {
  let planetId = plt.locationId;
  plt = df.getPlanetWithId(plt.locationId);
  let energy = Math.max(0, Math.floor(plt.energy - 0.2 * plt.energyCap));
  const unconfirmed = getUnconfirmedMoves().filter((move) => move.from === planetId);
  unconfirmed.forEach((tx) => {
    if (tx.methodName === "move") {
      let sentEnergy = tx.forces;
      energy -= sentEnergy;
    }
  });
  let res = Math.max(0, Math.floor(energy - 1));
  return res;
};

// plugins/display.js
import { getPlayerColor } from "https://cdn.skypack.dev/@darkforest_eth/procedural";
function drawRound(ctx, p, color, width, alpha = 1) {
  if (!p)
    return "(???,???)";
  const viewport = ui.getViewport();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  const { x, y } = viewport.worldToCanvasCoords(p.location.coords);
  const range = p.range * 0.01 * 20;
  const trueRange = viewport.worldToCanvasDist(range);
  ctx.beginPath();
  ctx.arc(x, y, trueRange, 0, 2 * Math.PI);
  ctx.stroke();
  return `(${p.location.coords.x},${p.location.coords.y})`;
}

// plugins/logicForInvadeAndCapture.js
function getYellowZones() {
  return df.captureZoneGenerator.zones;
}
function getCurrentBlockNumber() {
  return df.contractsAPI.ethConnection.blockNumber;
}
function getConstantsForCaptureZoneHoleBlocksRequired() {
  return df.contractConstants.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;
}
function isInZones(planet) {
  let yellowZones = Array.from(getYellowZones());
  let coords = planet.location.coords;
  for (let i = 0; i < yellowZones.length; i++) {
    let zone = yellowZones[i];
    let dist = df.getDistCoords(zone.coords, coords);
    if (dist < zone.radius)
      return true;
  }
  return false;
}
function notInvade(planet) {
  return planet.invadeStartBlock === void 0;
}
function invadeButCanNotCapture(p) {
  let currentBlockNumber = getCurrentBlockNumber();
  let beginBlockNumber = p.invadeStartBlock;
  if (beginBlockNumber === void 0)
    return false;
  let delta = getConstantsForCaptureZoneHoleBlocksRequired();
  let aboutTime = beginBlockNumber + delta >= currentBlockNumber;
  let aboutState = p.capturer === notOwnerAddress && p.invader !== notOwnerAddress;
  return aboutTime && aboutState;
}
function canCapture(p) {
  let currentBlockNumber = getCurrentBlockNumber();
  let beginBlockNumber = p.invadeStartBlock;
  if (beginBlockNumber === void 0)
    return false;
  let delta = getConstantsForCaptureZoneHoleBlocksRequired();
  let aboutTime = beginBlockNumber + delta < currentBlockNumber;
  let aboutState = p.capturer === notOwnerAddress && p.invader !== notOwnerAddress;
  return aboutTime && aboutState;
}
function haveCaptured(p) {
  let aboutState = p.capturer !== notOwnerAddress && p.invader !== notOwnerAddress;
  return aboutState;
}

// plugins/logicForJunk.js
function getJunkEnabled() {
  return df.contractConstants.SPACE_JUNK_ENABLED;
}
function getPlanetLevelJunkList() {
  return df.contractConstants.PLANET_LEVEL_JUNK;
}
function getPlanetJunk(p) {
  let junkList = getPlanetLevelJunkList();
  return junkList[p.planetLevel];
}
function getMyJunk() {
  return df.getPlayerSpaceJunk(df.account);
}
function getMyJunkLimit() {
  return df.getPlayerSpaceJunkLimit(df.account);
}

// plugins/logicForAccount.js
function isMine(p) {
  return p.owner === df.account;
}
function isNoOwner(p) {
  return p.owner === notOwnerAddress;
}
function hasOwner(p) {
  return p.owner !== notOwnerAddress;
}
function isMain(p) {
  return p.owner === mainAddress;
}
function isFamily(p) {
  return familyAddresses.includes(p.owner);
}

// plugins/logicForAbandon.js
var judgeAbandonRange = (from, to) => {
  let fromId = from.locationId;
  let toId = to.locationId;
  let fromEnergy = Math.floor(from.energy);
  let arrivingEnergy = 3;
  let abandoning = true;
  let energyNeed = Math.ceil(df.getEnergyNeededForMove(fromId, toId, arrivingEnergy, abandoning));
  return energyNeed <= fromEnergy;
};

// plugins/sectionAbandon.js
var colorForAbandonPlanets = ABANDON_PLANETS;
var showAbandonPlanet = void 0;
var showAbandonPlanets = [];
var drawSign = true;
function canAbandonFilter(p) {
  return destroyedFilter(p) && radiusFilter(p) && artifactFilter(p) && p.isHomePlanet === false && getArrivalsToPlanet(p) === 0 && p.planetLevel >= 3 && p.planetLevel <= 5;
}
var sorted = (a, b) => {
  if (a.planetLevel != b.planetLevel)
    return a.planetLevel - b.planetLevel;
  let aScore = 0;
  let bScore = 0;
  if (isFoundry(a))
    aScore += 10;
  if (inBlueSpace(a))
    aScore += 100;
  if (inDarkblueSpace(a))
    aScore += 50;
  if (invadeButCanNotCapture(a))
    aScore += 100;
  if (haveCaptured(a))
    aScore += 1e3;
  if (hasArtifact(a))
    aScore = 0;
  if (isFoundry(b))
    bScore += 10;
  if (inBlueSpace(b))
    bScore += 100;
  if (inDarkblueSpace(b))
    bScore += 50;
  if (invadeButCanNotCapture(a))
    aScore += 100;
  if (haveCaptured(b))
    aScore += 1e3;
  if (hasArtifact(b))
    bScore = 0;
  return bScore - aScore;
};
async function opAbandon(plt, setInfo, attackOther = false, waitSign = false) {
  plt = df.getPlanetWithId(plt.locationId);
  let content, onClick, itemInfo2;
  if (canAbandonFilter(plt) === false) {
    content = "don not pass can abandon filter";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForWarn, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  let junkEnabled = getJunkEnabled();
  let myJunk = getMyJunk();
  let pltJunk = getPlanetJunk(plt);
  if (junkEnabled && myJunk < pltJunk) {
    content = "player junk is too low";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForWarn, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  if (isInZones(plt) && notInvade(plt) && plt.owner === df.account) {
    content = "in zone but not invade";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForWarn, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  if (canCapture(plt)) {
    content = "the planet can capture now!";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForWarn, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  if (hasArtifactsCanActivate(plt)) {
    content = "the planet has artifacts can activate";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForWarn, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  let aimPlanets2 = Array.from(df.getAllPlanets()).filter(destroyedFilter).filter(radiusFilter).filter((p) => p.planetLevel >= 3).filter((p) => getArrivalsToPlanet(p) < 6).filter((p) => judgeAbandonRange(plt, p)).filter((p) => p != plt).filter((p) => {
    if (isMine(p))
      return true;
    if (isFamily(p))
      return true;
    if (isMain(p))
      return true;
    if (attackOther && hasOwner(p))
      return true;
    return false;
  }).sort((a, b) => {
    let aDist = df.getDist(a.locationId, plt.locationId);
    let bDist = df.getDist(b.locationId, plt.locationId);
    return aDist - bDist;
  });
  if (aimPlanets2.length === 0) {
    content = "no abandon aim";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForWarn, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  let to = aimPlanets2[0];
  let artifactMoved = void 0;
  let abandoning = true;
  let forces = Math.floor(plt.energy);
  let silver = Math.floor(plt.silver);
  let value = getPlanetJunk(plt);
  content = "this plt = " + value + " junk(s)";
  onClick = () => center(plt);
  itemInfo2 = colorInfoWithFunc(content, colorForAbandonPlanets, onClick);
  addToLog(itemInfo2, setInfo);
  showAbandonPlanet = plt;
  try {
    await df.move(plt.locationId, to.locationId, forces, silver, artifactMoved, abandoning);
    if (waitSign)
      await waitForMoveOnchain(setInfo);
  } catch (e) {
    content = "move revert";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForError, onClick);
    addToLog(itemInfo2, setInfo);
    return -1;
  }
  return getPlanetJunk(plt);
}
async function sectionAbandon(setInfo, needJunk = -1, maxPlanetLevel = 4, stopJunkPercent = 0.5, dontAbandonPlanets = [], attackOther = false, abandonPlanets = []) {
  beginSection("== begin Auto Abandon ==", setInfo);
  drawSign = true;
  showAbandonPlanet = void 0;
  showAbandonPlanets = [];
  if (needJunk != -1) {
    beginSection("need " + needJunk + " junk(s)", setInfo);
  }
  let content, onClick, itemInfo2;
  let myPlanets = Array.from(df.getMyPlanets()).filter(canAbandonFilter).filter((p) => dontAbandonPlanets.includes(p) === false).sort(sorted);
  if (abandonPlanets.length !== 0) {
    myPlants = abandonPlanets.filter(canAbandonFilter).filter((p) => p.planetLevel <= maxPlanetLevel).filter((p) => dontAbandonPlanets.includes(p) === false).sort(sorted);
  }
  content = myPlanets.length + " candidate planet(s)";
  itemInfo2 = colorInfo(content, colorForAbandonPlanets);
  addToLog(itemInfo2, setInfo);
  let junkCount = 0;
  let cnt = 0;
  for (let i = 0; i < myPlanets.length; i++) {
    let myJunk = getMyJunk();
    let junkLimit = getMyJunkLimit();
    let junkEnabled = getJunkEnabled();
    if (junkEnabled === false) {
      content = "junk enabled === false";
      itemINfo = colorInfo(content, colorForWarn);
      addToLog(itemInfo2, setInfo);
      break;
    }
    if (myJunk <= Math.floor(junkLimit * stopJunkPercent)) {
      let percent = Math.floor(stopJunkPercent * 100);
      content = "your junk is less than " + percent + " %";
      itemInfo2 = colorInfo(content, colorForWarn);
      addToLog(itemInfo2, setInfo);
      break;
    }
    if (needJunk !== -1 && junkCount >= needJunk)
      break;
    let plt = myPlanets[i];
    plt = df.getPlanetWithId(plt.locationId);
    if (getArrivalsToPlanet(plt) !== 0)
      continue;
    content = "planet [" + i + "]";
    onClick = () => center(plt);
    itemInfo2 = colorInfoWithFunc(content, colorForInfo, onClick);
    addToLog(itemInfo2, setInfo);
    showAbandonPlanets.push(plt);
    let res = await opAbandon(plt, setInfo, attackOther, false);
    if (res != -1) {
      junkCount += res;
      cnt++;
    }
    if (cnt % 6 === 0)
      await waitForMoveOnchain(setInfo);
  }
  await waitForMoveOnchain(setInfo);
  content = junkCount + " junk(s) --";
  itemInfo2 = colorInfo(content, colorForInfo);
  addToLog(itemInfo2, setInfo);
  endSection("== end Auto Abandon ==", setInfo);
  drawSign = false;
  await sleep(1e3);
  return;
}

// plugins/logicForMoveSilver.js
function getSilverMoveToPlanet(plt) {
  let planetId = plt.locationId;
  plt = df.getPlanetWithId(plt.locationId);
  let timestamp = Math.floor(Date.now() * 1e-3);
  const unconfirmed = getUnconfirmedMoves().filter((move) => move.to === planetId);
  const arrivals = df.getAllVoyages().filter((arrival) => arrival.toPlanet === planetId && arrival.arrivalTime > timestamp);
  let silver = 0;
  unconfirmed.forEach((tx) => {
    if (tx.methodName === "move") {
      silver += tx.silver;
    }
  });
  arrivals.forEach((tx) => {
    silver += tx.silverMoved;
  });
  return silver;
}

// plugins/sectionDdos.js
var colorForAimPlanets = "red";
var colorForAroundPlanets = "pink";
var colorForSixPlanets = "yellow";
var ddosDrawSign = true;
var showAimPlanets = [];
var showAroundPlanets = [];
var showSixPlanets = [];
function sectionDdosDraw(ctx) {
  if (ddosDrawSign === false)
    return;
  showAimPlanets.forEach((p) => drawRound(ctx, p, colorForAimPlanets, 5, 1));
  showAroundPlanets.forEach((p) => drawRound(ctx, p, colorForAroundPlanets, 2, 0.7));
  showSixPlanets.forEach((p) => drawRound(ctx, p, colorForSixPlanets, 3, 1));
}
var aimPlanets = [];
function clearOne() {
  let plt = ui.getSelectedPlanet();
  if (plt === void 0)
    return;
  let rhs = aimPlanets;
  rhs = rhs.filter((p) => p.locationId !== plt.locationId);
  rhs = Array.from(new Set(rhs));
  aimPlanets = rhs;
  showAimPlanets = aimPlanets;
}
function addOne() {
  let plt = ui.getSelectedPlanet();
  if (plt === void 0)
    return;
  aimPlanets.push(plt);
  aimPlanets = Array.from(new Set(aimPlanets));
  showAimPlanets = aimPlanets;
}
function clearAll() {
  aimPlanets = [];
  showAimPlanets = [];
}
async function sectionDdos(setInfo) {
  beginSection("== begin ddos ==", setInfo);
  ddosDrawSign = true;
  let content, onClick, itemInfo2;
  aimPlanets = Array.from(new Set(aimPlanets));
  showAimPlanets = aimPlanets;
  if (aimPlanets.length === 0) {
    content = "no aim planet(s)";
    itemInfo2 = colorInfo(content, colorForInfo);
    addToLog(itemInfo2, setInfo);
    endSection("== end ddos ==", setInfo);
    await sleep(1e3);
    ddosDrawSign = false;
    return;
  }
  content = "wait for move on chain before";
  itemInfo2 = colorInfo(content, colorForWarn);
  addToLog(itemInfo2, setInfo);
  await waitForMoveOnchain(setInfo);
  await sleep(1e3);
  showAroundPlanets = [];
  showSixPlanets = [];
  for (let i = 0; i < aimPlanets.length; i++) {
    let aimPlanet = aimPlanets[i];
    content = "aim planet " + i + " is here";
    onClick = () => center(aimPlanet);
    itemInfo2 = colorInfoWithFunc(content, colorForAimPlanets, onClick);
    addToLog(itemInfo2, setInfo);
    if (getArrivalsToPlanet(aimPlanet) === 6) {
      content = "arrivals = 6";
      itemInfo2 = colorInfo(content, colorForInfo);
      addToLog(itemInfo2, setInfo);
      let timestamp = new Date().getTime();
      timestamp = Math.floor(timestamp * 1e-3);
      const arrivals = df.getAllVoyages().filter((arrival) => arrival.toPlanet === aimPlanet.locationId && arrival.arrivalTime > timestamp && arrival.player === df.account);
      for (const tx of arrivals) {
        content = changeSecondsToString(tx.arrivalTime - timestamp);
        itemInfo2 = colorInfo(content, colorForInfo);
        addToLog(itemInfo2, setInfo);
      }
      await sleep(1e3);
      continue;
    }
    let junkEnabled = getJunkEnabled();
    let needJunk = aimPlanet.spaceJunk;
    let myJunk = df.getPlayerSpaceJunk(df.account);
    let junkLimit = df.contractConstants.SPACE_JUNK_LIMIT;
    if (junkEnabled && isNoOwner(aimPlanet) && needJunk + myJunk > junkLimit) {
      content = "junk is not enough :-c";
      itemInfo2 = colorInfo(content, colorForWarn);
      addToLog(itemInfo2, setInfo);
      await sectionAbandon(setInfo, needJunk);
    }
    let myPlanets = Array.from(df.getMyPlanets()).filter(destroyedFilter).filter(radiusFilter).filter(artifactFilter).filter((p) => p.planetLevel >= 1 && p.planetLevel <= aimPlanet.planetLevel).filter((p) => aimPlanets.includes(p) === false).filter((p) => getArrivalsToPlanet(p) === 0).filter((p) => judgeRange(p, aimPlanet)).sort((a, b) => {
      let aTime = df.getTimeForMove(a.locationId, aimPlanet.locationId);
      let bTime = df.getTimeForMove(b.locationId, aimPlanet.locationId);
      return bTime - aTime;
    });
    showAroundPlanets = myPlanets;
    showSixPlanets = [];
    showSixPlanets = getAimPlanetsFromPlanet(aimPlanet);
    let arrivalsBefore = getArrivalsToPlanet(aimPlanet);
    content = arrivalsBefore + " arrival(s) before";
    itemInfo2 = colorInfo(content, colorForInfo);
    addToLog(itemInfo2, setInfo);
    let needMovesAmount = 6 - arrivalsBefore;
    needMovesAmount = Math.max(0, needMovesAmount);
    let movesAddCnt = 0;
    content = needMovesAmount + " move(s) need";
    itemInfo2 = colorInfo(content, colorForInfo);
    addToLog(itemInfo2, setInfo);
    for (let j = 0; j < myPlanets.length; j++) {
      if (movesAddCnt >= needMovesAmount)
        break;
      let fromPlanet = myPlanets[j];
      let toPlanet = aimPlanet;
      fromPlanet = df.getPlanetWithId(fromPlanet.locationId);
      toPlanet = df.getPlanetWithId(toPlanet.locationId);
      let energyBudget = getEnergyCanSend(fromPlanet);
      let energySpent = 0;
      let silverBudget = Math.floor(fromPlanet.silver);
      let silverSpent = 0;
      while (true) {
        if (movesAddCnt >= needMovesAmount)
          break;
        const energyArriving = 5;
        const energyNeeded = Math.ceil(df.getEnergyNeededForMove(fromPlanet.locationId, toPlanet.locationId, energyArriving));
        let energyLeft = Math.floor(energyBudget - energySpent);
        console.warn(energyLeft);
        if (energyLeft < energyNeeded)
          break;
        movesAddCnt++;
        energySpent += energyNeeded;
        let silverLeft = Math.floor(silverBudget - silverSpent);
        let toPlanetSilver = Math.floor(getSilverMoveToPlanet(toPlanet) + toPlanet.silver);
        toPlanetSilver = Math.min(toPlanetSilver, toPlanet.silverCap);
        let silverNeeded = Math.floor(toPlanet.silverCap - toPlanetSilver);
        silverNeeded = Math.min(silverNeeded, silverLeft);
        silverNeeded = Math.max(silverNeeded, 0);
        silverSpent += silverNeeded;
        console.warn("silverLeft:" + silverLeft);
        console.warn("silverNeeded:" + silverNeeded);
        content = "from planet " + j + " send " + movesAddCnt + " move(s)";
        onClick = () => center(fromPlanet);
        itemInfo2 = colorInfoWithFunc(content, colorForSixPlanets, onClick);
        addToLog(itemInfo2, setInfo);
        content = "from planet carry " + silverNeeded + " silver";
        itemInfo2 = colorInfo(content, colorForInfo);
        addToLog(itemInfo2, setInfo);
        content = getTimeForMoveInString(fromPlanet.locationId, toPlanet.locationId);
        itemInfo2 = colorInfo(content, colorForInfo);
        addToLog(itemInfo2, setInfo);
        showSixPlanets.push(fromPlanet);
        showSixPlanets = Array.from(new Set(showSixPlanets));
        try {
          await df.move(fromPlanet.locationId, toPlanet.locationId, energyNeeded, silverNeeded);
          await waitForMoveOnchain(setInfo);
        } catch (e) {
          content = "move revert";
          itemInfo2 = colorInfoWithFunc(content, colorForError);
          addToLog(itemInfo2, setInfo);
          await sleep(1e3);
        }
      }
    }
    await sleep(2e3);
    let arrivalsAfter = getArrivalsToPlanet(aimPlanet);
    if (arrivalsAfter === 6) {
      content = "this planet arrivals == 6";
      itemInfo2 = colorInfo(content, colorForInfo);
      addToLog(itemInfo2, setInfo);
    } else {
      content = arrivalsAfter + " arrival(s)";
      itemInfo2 = colorInfo(content, colorForWarn);
      addToLog(itemInfo2, setInfo);
    }
  }
  endSection("== end ddos ==", setInfo);
  await sleep(1e3);
  ddosDrawSign = false;
}

// plugins/DevDdos.js
var ddosLoopSign = true;
function dfEros() {
  const [info, setInfo] = useState(infoMsg);
  const [infoDownSign, setInfoDownSign] = useState(true);
  function pageDown() {
    let el = document.getElementById("ddos");
    el.scrollTop = el.scrollHeight;
  }
  useLayoutEffect(() => {
    let interval;
    if (infoDownSign) {
      interval = setInterval(() => {
        pageDown();
      }, 2e3);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [infoDownSign]);
  function changeInfoDownSign() {
    if (infoDownSign === true)
      setInfoDownSign(false);
    else
      setInfoDownSign(true);
  }
  useEffect(() => {
    return () => {
      ddosStopLoop();
      console.warn("df-eros DevDdos end");
    };
  }, []);
  async function ddos() {
    await sectionDdos(setInfo);
  }
  async function ddosLoop() {
    ddosLoopSign = true;
    while (true) {
      if (ddosLoopSign === false)
        break;
      await ddos();
      await sleep(1e3);
    }
  }
  function ddosStopLoop() {
    ddosLoopSign = false;
  }
  return html2`<div style=${divStyle} >
    <h1>Dev Ddos</h1>
    <button style=${buttonStyle} onClick=${changeInfoDownSign}> 下滑切换 </button>
    <div>
    <button style=${buttonStyle} onClick=${addOne}> addOne </button>
    <button style=${buttonStyle} onClick=${clearOne}> clearOne </button>
    <button style=${buttonStyle} onClick=${clearAll}> clearAll </button>
    <button style=${buttonStyle} onClick=${ddos}> ddos </button>
    <button style=${buttonStyle} onClick=${ddosLoop}> ddos loop</button>
    <button style=${buttonStyle} onClick=${ddosStopLoop}> ddos stop</button>
    </div>

    <div id=ddos style=${infoListStyle}> ${info}</div>
    </div>`;
}
var Plugin = class {
  constructor() {
    this.container = null;
  }
  async render(container) {
    this.container = container;
    container.style.width = "400px";
    container.style.height = "1000px";
    render(html2`<${dfEros}/>`, container);
  }
  draw(ctx) {
    sectionDdosDraw(ctx);
  }
  destroy() {
    render(null, this.container);
  }
};
var DevDdos_default = Plugin;
export {
  DevDdos_default as default
};
