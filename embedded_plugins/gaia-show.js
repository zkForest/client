// plugins/DevShow.js
import {
  html as html2,
  render,
  useState,
  useLayoutEffect,
  useEffect
} from "https://unpkg.com/htm@3/preact/standalone.module.js";
import { PlanetLevel, PlanetType as PlanetType2, SpaceType as SpaceType2 } from "https://cdn.skypack.dev/@darkforest_eth/types";

// plugins/infoUtils.js
import { html } from "https://unpkg.com/htm@3/preact/standalone.module.js";
var MAX_LOG_LENGTH = 1e3;
var infoMsg = [];
function addToLog(itemInfo2, setInfo) {
  infoMsg.push(itemInfo2);
  infoMsg = infoMsg.slice(-MAX_LOG_LENGTH);
  setInfo([...infoMsg]);
}
function clearInfo(setInfo) {
  infoMsg = [];
  setInfo([...infoMsg]);
}
function getButtonStyle(width = "100px", height = "30px") {
  let res = {
    border: "1px solid #ffffff",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    width,
    height,
    margin: "5px",
    padding: "0 0.3em",
    color: "white",
    textAlign: "center",
    transition: "background-color 0.2s, color 0.2s",
    borderRadius: "2px"
  };
  return res;
}
var divStyle = {
  textAlign: "center",
  justifyContent: "space-around",
  width: "100%",
  marginTop: "10px"
};
function getInfoListStyle(height) {
  let resStyle = {
    height,
    textAlign: "center",
    overflow: "scroll",
    background: "rgb(0,60,0)"
  };
  return resStyle;
}
var selectStyle = {
  background: "rgb(8,8,8)",
  width: "100px",
  padding: "3px 5px",
  border: "1px solid white",
  borderRadius: "3px"
};
var checkbox = (value, setValue, text) => {
  return html`<div>
    <input type="checkbox" checked=${value} onChange=${() => setValue(!value)}/>
      ${" " + text} </div>`;
};
var colorInfo = (text, color) => {
  return html`<div style=${{ color }}>${text}</div>`;
};
var greenInfo = (text) => {
  return colorInfo(text, "#00FF66");
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
function drawCenter(ctx, tx, ty, color = "#FFC0CB", width = 1, alpha = 1) {
  const viewport = ui.getViewport();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = alpha;
  let coords = { x: tx, y: ty };
  const { x, y } = viewport.worldToCanvasCoords(coords);
  for (let i = 100; i <= df.worldRadius; i += 1e4) {
    const trueRange = viewport.worldToCanvasDist(i);
    ctx.beginPath();
    ctx.arc(x, y, trueRange, 0, 2 * Math.PI);
    ctx.stroke();
  }
}

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
var inBlackSpace = (planet) => planet.spaceType === SpaceType.DEEP_SPACE;
var inGreenSpace = (planet) => planet.spaceType === SpaceType.DEAD_SPACE;
var inBlueSpace = (planet) => planet.spaceType === SpaceType.NEBULA;
var inDarkblueSpace = (planet) => planet.spaceType === SpaceType.SPACE;
var isPlanet = (planet) => planet.planetType === PlanetType.PLANET;
var isAsteroidField = (planet) => planet.planetType === PlanetType.SILVER_MINE;
var isFoundry = (planet) => planet.planetType === PlanetType.RUINS;
var isSpacetimeRip = (planet) => planet.planetType === PlanetType.TRADING_POST;
var isQuasar = (planet) => planet.planetType === PlanetType.SILVER_BANK;
var isEnergyGrowthBonus = (planet) => planet.bonus[1];
var isRangeBonus = (planet) => planet.bonus[2];
var isSpeedBonus = (planet) => planet.bonus[3];
var inViewport = (planet) => {
  if (destroyedFilter(planet) === false)
    return false;
  const viewport = ui.getViewport();
  let left = viewport.getLeftBound();
  let right = viewport.getRightBound();
  let top = viewport.getTopBound();
  let bottom = viewport.getBottomBound();
  let { x, y } = planet.location.coords;
  return x >= left && x <= right && y >= bottom && y <= top;
};

// plugins/cfgForColor.js
var INVADE_BUT_NOT_CAPTURE = "pink";
var CAN_CAPTURE = "#FFFFCC";
var HAVE_CAPUTRED = "#005a9a";
var SPEED_BONUS = "yellow";
var RANGE_BONUS = "lightgreen";
var ENERGY_GROWTH_BONUS = "pink";
var HAVE_ARTIFACT = "pink";

// plugins/cfgForBasic.js
var notOwnerAddress = "0x0000000000000000000000000000000000000000";
var WORMHOLE_COOLDOWN_TIME = 48 * 60 * 60;
var ARTIFACT_COOLDOWN_TIME = 24 * 60 * 60;
var PHOTOID_CANNON_WAIT_TIME = df.contractConstants.PHOTOID_ACTIVATION_DELAY;
var MAX_MOVE_SILVER_TIME = 60 * 60 * 2;
var MAX_CATCH_INVADED_MOVE_TIME = 60 * 60;
var MAX_WAIT_TIME_FOR_CENTER_ENERGY = 60 * 60;
var MAX_WAIT_TIME_FOR_COLLECT_ENERGY = 60 * 60;
var MAX_WAIT_TIME_FOR_GOSSIP = 3 * 60 * 60;

// plugins/logicForInvadeAndCapture.js
function getConstantsForCaptureZonePlanetLevelScore() {
  return df.contractConstants.CAPTURE_ZONE_PLANET_LEVEL_SCORE;
}
function getCurrentBlockNumber() {
  return df.contractsAPI.ethConnection.blockNumber;
}
function getConstantsForCaptureZoneHoleBlocksRequired() {
  return df.contractConstants.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;
}
function getPlanetScore(p) {
  let scoresList = getConstantsForCaptureZonePlanetLevelScore();
  let score = scoresList[p.planetLevel];
  return score;
}
function getScoreOfPlanets(plts) {
  let score = 0;
  plts.forEach((p) => score += getPlanetScore(p));
  return score;
}
function invadeButNotCapture(p) {
  let aboutState = p.capturer === notOwnerAddress && p.invader !== notOwnerAddress;
  return aboutState;
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
function getPlanetLevelJunkList() {
  return df.contractConstants.PLANET_LEVEL_JUNK;
}
function getPlanetJunk(p) {
  let junkList = getPlanetLevelJunkList();
  return junkList[p.planetLevel];
}
function getJunkOfPlanets(plts) {
  let junk = 0;
  plts.forEach((p) => {
    junk += getPlanetJunk(p);
  });
  return junk;
}

// plugins/logicForArtifactState.js
import {
  ArtifactRarityNames,
  ArtifactTypeNames,
  ArtifactType
} from "https://cdn.skypack.dev/@darkforest_eth/types";
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
function planetWithActivePhotoidCannon(plt) {
  let artifacts = df.getArtifactsWithIds(plt.heldArtifactIds);
  for (let i = 0; i < artifacts.length; i++) {
    let rhs = artifacts[i];
    if (isPhotoidCannon(rhs) && isActivate(rhs))
      return true;
  }
  return false;
}
var planetWithOpenFire = (plt) => {
  let artifacts = df.getArtifactsWithIds(plt.heldArtifactIds);
  for (let i = 0; i < artifacts.length; i++) {
    let rhs = artifacts[i];
    if (PhotoidCannonCanFire(rhs) === true)
      return true;
  }
  return false;
};

// plugins/logicForArtifactOpen.js
function isProspectable(planet) {
  return df.isPlanetMineable(planet) && planet.prospectedBlockNumber === void 0 && planet.hasTriedFindingArtifact === false;
}

// plugins/sectionShow.js
var showPlanets = [];
var colorForShowPlanets = "pink";
function switchShowPlanets(planetFilter, setInfo) {
  let planets = Array.from(df.getAllPlanets()).filter(destroyedFilter).filter(radiusFilter).filter(planetFilter);
  clearInfo(setInfo);
  let content = planets.length + " planet(s)";
  let itemInfo2 = greenInfo(content);
  addToLog(itemInfo2, setInfo);
  let junkSum = getJunkOfPlanets(planets);
  content = "junk sum : " + junkSum;
  itemInfo2 = greenInfo(content);
  addToLog(itemInfo2, setInfo);
  let scoreSum = getScoreOfPlanets(planets);
  content = "score sum : " + scoreSum;
  itemInfo2 = greenInfo(content);
  addToLog(itemInfo2, setInfo);
  console.log(showPlanets.length);
  if (showPlanets.length === 0)
    showPlanets = planets;
  else
    showPlanets = [];
}
function sectionShowDraw(ctx) {
  showPlanets.forEach((p) => drawRound(ctx, p, colorForShowPlanets, 3, 1));
}
function switchShowSpeedBonus(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && isSpeedBonus(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = SPEED_BONUS;
}
function switchShowRangeBonus(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && isRangeBonus(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = RANGE_BONUS;
}
function switchShowEnergyGrowthBonus(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && isEnergyGrowthBonus(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = ENERGY_GROWTH_BONUS;
}
function switchShowInvadeButNotCapture(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && invadeButNotCapture(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = INVADE_BUT_NOT_CAPTURE;
}
function switchShowCanCapture(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && canCapture(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = CAN_CAPTURE;
}
function switchShowHaveCaptured(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && haveCaptured(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = HAVE_CAPUTRED;
}
function switchShowNotCaptureYet(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && haveCaptured(planet) === false;
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = "lightgreen";
}
function switchShowHaveArtifact(frontFilter, setInfo) {
  let planetFilter = (planet) => frontFilter(planet) && hasArtifactsCanActivate(planet);
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = HAVE_ARTIFACT;
}
function switchShowPlanetWithActivePhotoidCannon(frontFilter, setInfo) {
  let planetFilter = (p) => {
    return frontFilter(p) && planetWithActivePhotoidCannon(p);
  };
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = "lightgreen";
}
function switchShowPlanetWithOpenFire(frontFilter, setInfo) {
  let planetFilter = (p) => {
    return frontFilter(p) && planetWithOpenFire(p);
  };
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = "red";
}
function switchShowAllPlanets(frontFilter, setInfo) {
  let planetFilter = (p) => {
    if (isFoundry(p))
      return frontFilter(p) && isProspectable(p);
    return frontFilter(p);
  };
  switchShowPlanets(planetFilter, setInfo);
  colorForShowPlanets = "pink";
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
function isOther(p) {
  return isMine(p) === false && hasOwner(p);
}

// plugins/DevShow.js
function dfGaia() {
  const [info, setInfo] = useState(infoMsg);
  const [infoDownSign, setInfoDownSign] = useState(true);
  function pageDown() {
    let el = document.getElementById("devshow");
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
    return () => {
      clearInterval(interval);
    };
  }, [infoDownSign]);
  function changeInfoDownSign() {
    console.warn("XXX CHANGE_INFO_DOWN END XXX");
    if (infoDownSign === true)
      setInfoDownSign(false);
    else
      setInfoDownSign(true);
  }
  useEffect(() => {
    return () => {
      console.warn("XXX DF-GAIA END XXX");
    };
  }, []);
  const [leftLevel, setLeftLevel] = useState(3);
  const [rightLevel, setRightLevel] = useState(9);
  const [hasPlanet, setHasPlanet] = useState(true);
  const [hasAsteroidField, setHasAsteroidField] = useState(true);
  const [hasFoundry, setHasFoundry] = useState(true);
  const [hasSpacetimeRip, setHasSpacetimeRip] = useState(true);
  const [hasQuasar, setHasQuasar] = useState(false);
  const [ohBlackSpace, setOhBlackSpace] = useState(true);
  const [ohGreenSpace, setOhGreenSpace] = useState(true);
  const [ohBlueSpace, setOhBlueSpace] = useState(true);
  const [ohDarkblueSpace, setOhDarkblueSpace] = useState(true);
  const [hasMe, setHasMe] = useState(true);
  const [hasNoOwner, setHasNoOwner] = useState(true);
  const [hasOther, setHasOther] = useState(true);
  const [onlyInViewport, setOnlyInViewport] = useState(true);
  const PLANET_LEVELS = Object.values(PlanetLevel).map((level) => ({
    value: level,
    text: level.toString()
  }));
  const leftLevelSelect = html2`
    <select style=${selectStyle} value=${leftLevel} onChange=${(e) => setLeftLevel(e.target.value)}>
        ${PLANET_LEVELS.map(({ value, text }) => html2`<option value=${value}>${text}</option>`)}
    </select>
    `;
  const rightLevelSelect = html2`
    <select style=${selectStyle} value=${rightLevel} onChange=${(e) => setRightLevel(e.target.value)}>
        ${PLANET_LEVELS.map(({ value, text }) => html2`<option value=${value}>${text}</option>`)}
    </select>
    `;
  let levelComponent = html2`<div style=${{ marginTop: "5px", marginBottom: "5px" }}> 
      ${leftLevelSelect}
      ${" "}
      ${rightLevelSelect}
    </div>`;
  let planetCheckbox = checkbox(hasPlanet, setHasPlanet, "Planet");
  let asteroidFieldCheckbox = checkbox(hasAsteroidField, setHasAsteroidField, "AsteroidField");
  let foundryCheckbox = checkbox(hasFoundry, setHasFoundry, "Foundry");
  let spacetimeRipCheckbox = checkbox(hasSpacetimeRip, setHasSpacetimeRip, "SpacetimeRip");
  let quasarCheckbox = checkbox(hasQuasar, setHasQuasar, "quasar");
  let planetTypeComponent = html2`
        <div style=${{ marginLeft: "20px", textAlign: "left", float: "left" }}>
        ${planetCheckbox}
        ${asteroidFieldCheckbox}
        ${foundryCheckbox}
        ${spacetimeRipCheckbox}
        ${quasarCheckbox}
        </div>`;
  let blackSpaceCheckbox = checkbox(ohBlackSpace, setOhBlackSpace, "BlackSpace");
  let greenSpaceCheckbox = checkbox(ohGreenSpace, setOhGreenSpace, "GreenSpace");
  let blueSpaceCheckbox = checkbox(ohBlueSpace, setOhBlueSpace, "BlueSpace");
  let darkblueSpaceCheckbox = checkbox(ohDarkblueSpace, setOhDarkblueSpace, "DarkblueSpace");
  let sapceTypeComponent = html2`
    <div style=${{ marginRight: "40px", textAlign: "left", float: "right" }}>
      
        ${greenSpaceCheckbox}
        ${blackSpaceCheckbox}
        ${darkblueSpaceCheckbox}
        ${blueSpaceCheckbox}
    </div>`;
  let hasMeCheckbox = checkbox(hasMe, setHasMe, "has me");
  let hasNoOwnerCheckbox = checkbox(hasNoOwner, setHasNoOwner, "has no owner");
  let hasOtherCheckbox = checkbox(hasOther, setHasOther, "has other");
  let accountComponent = html2`
    <div style=${{ marginRight: "35px", textAlign: "left", float: "right" }}>
        ${hasNoOwnerCheckbox}
        ${hasMeCheckbox}
        ${hasOtherCheckbox}
    </div>`;
  let viewportCheckbox = checkbox(onlyInViewport, setOnlyInViewport, "only in view");
  let viewportComponent = html2`
    <div style=${{ marginLeft: "20px", textAlign: "left", float: "left" }}>
    <div style=${{ color: "pink" }}> about viewport</div>
        ${viewportCheckbox}
    </div>`;
  function judgeLevel(planet) {
    let minLevel = Math.min(leftLevel, rightLevel);
    let maxLevel = Math.max(leftLevel, rightLevel);
    return minLevel <= planet.planetLevel && planet.planetLevel <= maxLevel;
  }
  function judgePlanetType(planet) {
    if (hasPlanet && isPlanet(planet))
      return true;
    if (hasAsteroidField && isAsteroidField(planet))
      return true;
    if (hasFoundry && isFoundry(planet))
      return true;
    if (hasSpacetimeRip && isSpacetimeRip(planet))
      return true;
    if (hasQuasar && isQuasar(planet))
      return true;
    return false;
  }
  function judgeSpaceType(plt) {
    if (ohBlackSpace && inBlackSpace(plt))
      return true;
    if (ohGreenSpace && inGreenSpace(plt))
      return true;
    if (ohBlueSpace && inBlueSpace(plt))
      return true;
    if (ohDarkblueSpace && inDarkblueSpace(plt))
      return true;
    return false;
  }
  function judgeAccount(planet) {
    if (hasMe && isMine(planet))
      return true;
    if (hasNoOwner && isNoOwner(planet))
      return true;
    if (hasOther && isOther(planet))
      return true;
    return false;
  }
  function judgeViewport(planet) {
    if (onlyInViewport)
      return inViewport(planet);
    else
      return true;
  }
  function frontFilter(planet) {
    return judgeLevel(planet) && judgePlanetType(planet) && judgeSpaceType(planet) && judgeAccount(planet) && judgeViewport(planet);
  }
  function showSpeedBonus() {
    switchShowSpeedBonus(frontFilter, setInfo);
  }
  function showRangeBonus() {
    switchShowRangeBonus(frontFilter, setInfo);
  }
  function showEnergyGrowthBonus() {
    switchShowEnergyGrowthBonus(frontFilter, setInfo);
  }
  function showInvadeButNotCapture() {
    switchShowInvadeButNotCapture(frontFilter, setInfo);
  }
  function showCanCapture() {
    switchShowCanCapture(frontFilter, setInfo);
  }
  function showHaveCaptured() {
    switchShowHaveCaptured(frontFilter, setInfo);
  }
  function showNotCaptureYet() {
    switchShowNotCaptureYet(frontFilter, setInfo);
  }
  function showHaveArtifact() {
    switchShowHaveArtifact(frontFilter, setInfo);
  }
  function showActivePhotoidCannon() {
    switchShowPlanetWithActivePhotoidCannon(frontFilter, setInfo);
  }
  function showOpenFire() {
    switchShowPlanetWithOpenFire(frontFilter, setInfo);
  }
  function showAll() {
    console.log("showAll");
    switchShowAllPlanets(frontFilter, setInfo);
  }
  return html2`<div style=${divStyle} >
    <h1>DF GAIA SHOW</h1>
   
   
    <div>
    ${levelComponent}
    ${planetTypeComponent}
    ${sapceTypeComponent}
    
    ${accountComponent}
    ${viewportComponent} 
   
    </div>

    <div>
  
    </div>

    <button style=${getButtonStyle("150px", "25px")} onClick=${showSpeedBonus}> speed bonus </button>
    <button style=${getButtonStyle("150px", "25px")} onClick=${showRangeBonus}> range bonus </button>
    <button style=${getButtonStyle("200px", "25px")} onClick=${showEnergyGrowthBonus}> energy growth bonus </button>
    
   
    
    <button style=${getButtonStyle("150px", "25px")} onClick=${showCanCapture}> can capture </button>
    <button style=${getButtonStyle("150px", "25px")} onClick=${showHaveCaptured}> have captured  </button>
    <button style=${getButtonStyle("150px", "25px")} onClick=${showNotCaptureYet}> not capture yet </button>
    <button style=${getButtonStyle("200px", "25px")} onClick=${showInvadeButNotCapture}> invade but not capture </button>

    <button style=${getButtonStyle("200px", "25px")} onClick=${showHaveArtifact}>have artifact </button>
    <button style=${getButtonStyle("250px", "25px")} onClick=${showActivePhotoidCannon}> just active Photoid Cannon </button>
    <button style=${getButtonStyle("250px", "25px")} onClick=${showOpenFire}> Photoid Cannon Can Fire Now </button>
    <button style=${getButtonStyle("250px", "25px")} onClick=${showAll}> show all </button>

    <div id=devshow style=${getInfoListStyle("100px")}>${info}</div>
    </div>`;
}
var Plugin = class {
  constructor() {
    this.container = null;
  }
  async render(container) {
    this.container = container;
    container.style.width = "350px";
    container.style.height = "700px";
    render(html2`<${dfGaia}/>`, container);
  }
  draw(ctx) {
    drawCenter(ctx, 0, 0);
    sectionShowDraw(ctx);
  }
  destroy() {
    render(null, this.container);
  }
};
var DevShow_default = Plugin;
export {
  DevShow_default as default
};
