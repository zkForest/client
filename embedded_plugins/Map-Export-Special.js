// # Map Export
// April 17 2022: hard coded to only export L2> planets if NOT within selection. Inside selection box everything will be exported. 

let viewport = ui.getViewport();
let cleanseSelection = true;  //hardcoded to yes
class Plugin {
  constructor() {
    this.beginCoords = null;
    this.endCoords = null;

    this.status = document.createElement('div');
    this.status.style.marginTop = '10px';
    this.status.style.textAlign = 'center';

    this.xyWrapper = document.createElement('div');
    this.xyWrapper.style.marginBottom = '10px';

    let msg = document.createElement('div');
    msg.innerText = `Select a box to export all planets inside the box. Outside this box, only planets >=L2 will be exported.`;

    //    msg.innerText = `Click on the map to pin selection. Cleanup flag is ${cleanseSelection}`;
    this.beginXY = document.createElement('div');
    this.endXY = document.createElement('div');

    let clear = document.createElement('button');
    clear.innerText = 'Clear selection';
    clear.style.width = '100%';
    clear.onclick = () => {
      this.beginCoords = null;
      this.beginXY.innerText = 'Begin: ???';
      this.endCoords = null;
      this.endXY.innerText = '';
    }

    this.xyWrapper.appendChild(msg);
    this.xyWrapper.appendChild(this.beginXY);
    this.xyWrapper.appendChild(this.endXY);
    this.xyWrapper.appendChild(clear);
  }

  async processMap(input) {
    let chunks;
    try {
      chunks = JSON.parse(input);
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Invalid map data. Check the data in your file.';
      this.status.style.color = 'red';
      return;
    }

    this.status.innerText = 'Importing, this will take awhile...';
    this.status.style.color = 'white';
    try {
      await df.bulkAddNewChunks(chunks)
      this.status.innerText = 'Successfully imported map!';
    } catch (err) {
      console.log(err);
      this.status.innerText = 'Encountered an unexpected error.';
      this.status.style.color = 'red';
    }
  }

  onImport = async () => {
    let input;
    try {
      input = await window.navigator.clipboard.readText();
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Unable to import map. Did you allow clipboard access?';
      this.status.style.color = 'red';
      return;
    }
    this.processMap(input);
  }

  onUpload = async () => {
    let inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.onchange = () => {
      try {
        var file = inputFile.files.item(0);
        var reader = new FileReader();
        reader.onload = () => {
          this.processMap(reader.result);
        };
        reader.readAsText(file);
      } catch (err) {
        console.error(err);
        this.status.innerText = 'Unable to upload map.';
        this.status.style.color = 'red';
        return;
      }
    }
    inputFile.click();
  }

  intersectsXY(chunk, begin, end) {
    const chunkLeft = chunk.chunkFootprint.bottomLeft.x;
    const chunkRight = chunkLeft + chunk.chunkFootprint.sideLength;
    const chunkBottom = chunk.chunkFootprint.bottomLeft.y;
    const chunkTop = chunkBottom + chunk.chunkFootprint.sideLength;

    return (
      chunkLeft >= begin.x &&
      chunkRight <= end.x &&
      chunkTop <= begin.y &&
      chunkBottom >= end.y
    );
  }

  generateMap() {

    if(cleanseSelection) {
        console.log ("Exporting only >=L2 except for inside selected area...");

        let chunks = ui.getExploredChunks();
        let chunksAsArray = Array.from(chunks);
        let chunksClone=[];
        let newChunk={};

        if (!this.beginCoords || !this.endCoords) {
            console.log ("Selection cannot be empty for cleansing operation. ");
            this.status.innerText = 'Please select an area.';
            this.status.style.color = 'red';
        }
        
        let begin = {
              x: Math.min(this.beginCoords.x, this.endCoords.x),
              y: Math.max(this.beginCoords.y, this.endCoords.y),
        };
        let end = {
              x: Math.max(this.beginCoords.x, this.endCoords.x),
              y: Math.min(this.beginCoords.y, this.endCoords.y),
        };

        for (let i=0; i<chunksAsArray.length; ++i) {
            if(this.intersectsXY(chunksAsArray[i], begin, end) ) {
               chunksClone.push(chunksAsArray[i]);
            } else {

//               console.log ("cleansing...", i);

               newChunk.chunkFootprint = chunksAsArray[i].chunkFootprint;
               newChunk.perlin = chunksAsArray[i].perlin;
                if(chunksAsArray[i].planetLocations.length >0)  {
                   let filtered =  chunksAsArray[i].planetLocations
                       .filter ((p) => this.isPlanetPlayable(p.hash));  //greater than Lvl3

//                   .filter ((p) => df.getPlanetWithId(p.hash).planetLevel >=3);  //greater than Lvl3

                newChunk.planetLocations = filtered;

//                    console.log(i, chunksAsArray[i], newChunk);
            chunksClone.push(Object.assign({}, newChunk));
                }
            }
        }
//        console.log(chunksClone);
        return chunksClone;

    }
    console.log("should never get here in cleansing mode...");
  }

  isPlanetPlayable (planetId) {
    return df.getPlanetLevel(planetId) >=2;
  }

  //legacy code.  Could get fancy with filtering
  isPlanetPlayableXXX (planetId) {
    let planet = df.getPlanetWithId(planetId);
   
    return (planet
      && ((planet.planetLevel >=2)

//      || (df.isPlanetMineable(planet) && !planet.hasTriedFindingArtifact)
//          || (planet.heldArtifactIds && planet.heldArtifactIds.length > 0)
//          || (MyplanetHasBonus(planet) && planet.planetLevel >=2)   //this probally did not work
      )
  
      )
  }
     
  

  onExport = async () => {
    let mapRaw = this.generateMap();
    try {
      let map = JSON.stringify(mapRaw);
      await window.navigator.clipboard.writeText(map);
      this.status.innerText = 'Map copied to clipboard!';
      this.status.style.color = 'white';
        if(cleanseSelection) {
      this.status.innerText = 'CLEANSED Map copied to clipboard!';
      this.status.style.color = 'red';
        }
    } catch (err) {
      console.error(err);
      this.status.innerText = 'Failed to export map.';
      this.status.style.color = 'red';
    }
  }

  onDownload = async () => {
    let mapRaw = this.generateMap();
    try {
      let map = JSON.stringify(mapRaw);
      var blob = new Blob([map], { type: 'application/json' }),
          anchor = document.createElement('a');
      anchor.download = df.getContractAddress().substring(0, 6) + '_map.json';
      anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
      anchor.dataset.downloadurl = ['application/json', anchor.download, anchor.href].join(':');
      anchor.click();
      this.status.innerText = 'Saving map!';
      this.status.style.color = 'white';
          if(cleanseSelection) {
        this.status.innerText = 'CLEANSED Map saved!';
        this.status.style.color = 'red';
          }
      } catch (err) {
      console.error(err);
      this.status.innerText = 'Failed to download map.';
      this.status.style.color = 'red';
    }
  };

  onMouseMove = () => {
    let coords = ui.getHoveringOverCoords();
    if (coords) {
      if (this.beginCoords == null) {
        this.beginXY.innerText = `Begin: (${coords.x}, ${coords.y})`
        return;
      }

      if (this.endCoords == null) {
        this.endXY.innerText = `End: (${coords.x}, ${coords.y})`
        return;
      }
    }
  }

  onClick = () => {
    let coords = ui.getHoveringOverCoords();
    if (coords) {
      if (this.beginCoords == null) {
        this.beginCoords = coords;
        return;
      }

      if (this.endCoords == null) {
        this.endCoords = coords;
        return;
      }
    }
  }

  render(container) {
    container.parentElement.style.minHeight = 'unset';
    container.style.minHeight = 'unset';

    container.style.width = '400px';

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('click', this.onClick);

    let wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'space-between';
    wrapper.style.marginBottom = '10px';

    let wrapper2 = document.createElement('div');
    wrapper2.style.display = 'flex';
    wrapper2.style.justifyContent = 'space-between';

    let exportButton = document.createElement('button');
    exportButton.innerText = 'Copy Map to Clipboard';
    exportButton.onclick = this.onExport;

    let importButton = document.createElement('button');
    importButton.innerText = 'Load Map from Clipboard';
    importButton.onclick = this.onImport;

    let downloadButton = document.createElement('button');
    downloadButton.innerText = 'Download Map as File';
    downloadButton.onclick = this.onDownload;

    let uploadButton = document.createElement('button');
    uploadButton.innerText = 'Upload Map from File';
    uploadButton.onclick = this.onUpload;

    wrapper.appendChild(exportButton);
    wrapper.appendChild(importButton);
    wrapper2.appendChild(downloadButton);
    wrapper2.appendChild(uploadButton);

    container.appendChild(this.xyWrapper);
    container.appendChild(wrapper);
    container.appendChild(wrapper2);
    container.appendChild(this.status);
  }

  draw(ctx) {
    let begin = this.beginCoords;
    let end = this.endCoords || ui.getHoveringOverCoords();
    if (begin && end) {
      let beginX = Math.min(begin.x, end.x);
      let beginY = Math.max(begin.y, end.y);
      let endX = Math.max(begin.x, end.x);
      let endY = Math.min(begin.y, end.y);
      let width = endX - beginX;
      let height = beginY - endY;

      ctx.save();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        viewport.worldToCanvasX(beginX),
        viewport.worldToCanvasY(beginY),
        viewport.worldToCanvasDist(width),
        viewport.worldToCanvasDist(height)
      );
      ctx.restore();
    }
  }

  destroy() {
    window.removeEventListener('mousemove', this.onMouseMove);
  }
}

export default Plugin;