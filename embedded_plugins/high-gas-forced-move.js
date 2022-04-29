// Force Move
// Force performing moves with custom gas limit

class Plugin {
  
  constructor() {}

  async render(container) {
    let createButton = (label) => {
      let e = document.createElement("button");
      e.textContent = label;
      e.style.border = `1px solid #7f7f7f`;
      e.style.borderRadius = `3px`;
      e.style.padding = `2px 6px`;
      return e;
    };
    let createPlanetSelector = (i, cb) => {
      let selected;
      let e = document.createElement("div");
      let label = document.createElement("div");
      label.textContent = `#${i}: Not Selected`;
      label.style.verticalAlign = `middle`;
      
      let btn = createButton("Select Current");
      btn.style.float = "right";
      e.append(label, btn);
      
      e.style.position = `relative`;
      e.style.background = `#7f7f7f1e`;
      e.style.padding = `4px 8px`;
      e.style.borderRadius = `4px`;
      e.style.marginBottom = `4px`;
      
      btn.style.position = `absolute`;
      btn.style.right = `1px`;
      btn.style.top = `1px`;
      
      btn.onclick = () => {
        label.textContent = `#${i}: ${ui.selectedPlanetId.substring(0, 16)}...`;
        selected = ui.selectedPlanetId;
        if (cb) cb(selected);
      };
      label.onclick = () => {
        if (selected) ui.selectedPlanetId = selected;
      };
      return e;
    };
    
    container.append(
      createPlanetSelector(1, id => { this.planet1 = id; }),
      createPlanetSelector(2, id => { this.planet2 = id; })
    );
    
    // Here goes more UI stuffs
    let createInput = (placeholder, def) => {
      let e = document.createElement("input");
      if (def) e.value = def;
      e.placeholder = placeholder;
      e.type = "text";
      e.style.background = `transparent`;
      e.style.border = `1px solid #7f7f7f`;
      e.style.borderRadius = `3px`;
      e.style.padding = `4px 8px`;
      e.style.width = `100%`;
      e.style.marginBottom = `4px`;
      return e;
    };
    
    let gasLimitInput = createInput("Custom Gas Limit? = 2000000");
    let energyInput = createInput("Energy Amount? = 0");
    let silverInput = createInput("Silver Amount? = 0");
    let artifactIdInput = createInput("Artifact/Spaceship ID? = None");
    
    let sendBtn = createButton("Send Move");
    
    container.append(
      gasLimitInput,
      energyInput,
      silverInput,
      artifactIdInput,
      sendBtn
    );
    
    sendBtn.onclick = async () => {
      console.log("step 1: gather info");
      let planets = df.getPlanetsWithIds([this.planet1, this.planet2]);
      if (planets.length < 2) {
        sendBtn.textContent = "Please select 2 planets";
        setTimeout(() => { sendBtn.textContent = "Send Move"; }, 1500);
      }
      
      let coords = planets.map(v => v.location.coords);
      let xDiff = coords[1].x - coords[0].x;
      let yDiff = coords[1].y - coords[0].y;
      let distMax = Math.ceil(Math.sqrt(xDiff ** 2 + yDiff ** 2));
      let energy = parseInt(energyInput.value || "0") ?? 0;
      let silver = parseInt(silverInput.value || "0") ?? 0;
      let gasLimit = parseInt(gasLimitInput.value || "0") ?? 0;
      if (gasLimit == 0) gasLimit = 2_000_000;
      
      console.log("step 2: prove");
      sendBtn.textContent = `Proving...`;
      const CONTRACT_PRECISION = 1000; // https://github.com/darkforest-eth/packages/blob/master/constants/src/index.ts#L44
      let argsCalc = await df.snarkHelper.getMoveArgs(coords[0].x, coords[0].y, coords[1].x, coords[1].y, df.worldRadius, distMax);
      let args = [
        argsCalc[0],
        argsCalc[1],
        argsCalc[2],
        [
          ...argsCalc[3],
          (energy * CONTRACT_PRECISION).toString(),
          (silver * CONTRACT_PRECISION).toString(),
          '0',
          '0', // abandon flag
        ],
      ];
      
      console.log(args);
      
      console.log("step 3: submit");
      sendBtn.textContent = `Sending TX...`;
      await df.getContract().move(...args, {
        gasLimit
      });
      
      sendBtn.textContent = `Send Move`;
    };
  }

  destroy() {}
  
}

export default Plugin;