// plugins/MineCoordinate.ts
function mineCoords(x, y) {
  let coordsIn = { x, y };
  ui.centerCoords(coordsIn);
  let defaultChunkSize = df.minerManager.miningPattern.chunkSideLength;
  let chunkSize = 4;
  let coords = { x: coordsIn.x - chunkSize / 2, y: coordsIn.y - chunkSize / 2 };
  coords.x = coords.x - Math.sign(coords.x % 16);
  coords.y = coords.y - Math.sign(coords.y % 16);
  df.minerManager.miningPattern.fromChunk.bottomLeft = coords;
  function setChunkSize(size) {
    df.minerManager.miningPattern.chunkSideLength = size;
    df.minerManager.miningPattern.fromChunk.sideLength = size;
  }
  setChunkSize(chunkSize);
  function onMined(chunk, time) {
    df.minerManager.off("DiscoveredNewChunk", onMined);
    df.minerManager.stopExplore();
    setChunkSize(defaultChunkSize);
  }
  df.minerManager.on("DiscoveredNewChunk", onMined);
  df.minerManager.startExplore();
}
var MineCoordinate = class {
  async render(container) {
    let x = null;
    let y = null;
    const errorContainer = document.createElement("div");
    errorContainer.style.color = "red";
    const coordinateInput = document.createElement("input");
    coordinateInput.value = "0, 0";
    coordinateInput.style.color = "black";
    coordinateInput.oninput = () => {
      const inputStr = coordinateInput.value.replace(/[\(\)]/g, "");
      const coordinates = inputStr.split(",").map((c) => parseInt(c));
      if (coordinates.length !== 2 || coordinates.some((a) => isNaN(a))) {
        errorContainer.innerText = `${coordinateInput.value} is not a valid coordinates. Coordinates need to be in the form \`(x, y)\``;
        return;
      } else {
        errorContainer.innerText = "";
      }
      x = coordinates[0];
      y = coordinates[1];
    };
    const mineCoordinateButton = document.createElement("button");
    mineCoordinateButton.innerText = "Mine";
    mineCoordinateButton.onclick = () => {
      if (x === null || y === null) {
        errorContainer.innerText = "No x and y coordinate specified";
        return;
      }
      mineCoords(x, y);
    };
    container.append(coordinateInput, errorContainer, mineCoordinateButton);
  }
};
var MineCoordinate_default = MineCoordinate;
export {
  MineCoordinate_default as default
};
