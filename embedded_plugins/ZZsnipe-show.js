// Snipe Show
//
// ddy_mainland


import {
    EMPTY_ADDRESS
} from 'https://cdn.skypack.dev/@darkforest_eth/constants';


let oneMinute = 60;
let oneHour = 60 * oneMinute;

export let getEnergyPercent = (planet) => {
    if (!planet) return 0;
    return Math.floor(planet.energy / planet.energyCap * 100);
}


class VoyageTime {
    constructor() {
        this.energyPercent = 55;
        this.estimatedTime = document.createElement('div');
        this.estimatedTime.innerText = '?????';
        this.estimatedTime.style.textAlign = 'center';
        this.estimatedTimeSeconds = document.createElement('div');
        this.estimatedTimeSeconds.innerText = '';
        this.estimatedTimeSeconds.style.textAlign = 'center';
        this.estimatedEnergy = document.createElement('div');
        this.estimatedEnergy.innerText = '?????';
        this.estimatedEnergy.style.textAlign = 'center';


        this.toPlanetEnergyPercent = document.createElement('div');

        this.toPlanetEnergyPercent.innerText = '';
        this.toPlanetEnergyPercent.style.textAlign = 'center';


        this.captureWaitTime = document.createElement('div');

        this.captureWaitTime.innerText = '???';
        this.captureWaitTime.style.textAlign = 'center';


        this.getScore = document.createElement('div');

        this.getScore.innerText = '';
        this.getScore.style.textAlign = 'center';

        this.res = document.createElement('div');
        this.res.style.color = 'yellow';
        this.res.innerText = '';
        this.res.style.textAlign = 'center';






    }

    calcVoyageTime = () => {
        let fromPlanet = ui.getSelectedPlanet();
        if (fromPlanet) {
            let toPlanet = ui.getHoveringOverPlanet();

            if (toPlanet && fromPlanet !== toPlanet) {
                // In seconds
                let time = Math.ceil(
                    df.getTimeForMove(fromPlanet.locationId, toPlanet.locationId)
                );
                let hours = Math.floor(time / oneHour);
                let minutes = Math.floor(time % oneHour / 60);
                let seconds = Math.ceil(time % oneHour % oneMinute);
                if (hours >= 1) {
                    this.estimatedTime.innerText = `${hours} hrs, ${minutes} mins, ${seconds} secs`;
                } else if (minutes >= 1) {
                    this.estimatedTime.innerText = `${minutes} mins, ${seconds} secs`;
                } else {
                    this.estimatedTime.innerText = `${seconds} secs`;
                }
                this.estimatedTimeSeconds.innerText = `${time} secs`;

                // Energy
                let sendEnergy = (fromPlanet.energyCap * this.energyPercent / 100);
                let arriveEnergy = df.getEnergyArrivingForMove(fromPlanet.locationId, toPlanet.locationId, undefined, sendEnergy);
                if (toPlanet.owner !== df.getAccount()) {
                    arriveEnergy = arriveEnergy * 100 / toPlanet.defense
                }
                sendEnergy = Math.ceil(sendEnergy);
                arriveEnergy = Math.ceil(arriveEnergy);
                if (sendEnergy > 1000000) {
                    sendEnergy = (sendEnergy / 1000000).toFixed(1) + 'M';
                } else if (sendEnergy > 1000) {
                    sendEnergy = (sendEnergy / 1000).toFixed(1) + 'K';
                }
                if (arriveEnergy > 1000000) {
                    arriveEnergy = (arriveEnergy / 1000000).toFixed(1) + 'M';
                } else if (arriveEnergy > 1000) {
                    arriveEnergy = (arriveEnergy / 1000).toFixed(1) + 'K';
                }
                this.estimatedEnergy.innerText = `Send ${sendEnergy} arrive ${arriveEnergy}`;

                // aim planet capture wait time 

                let planet = toPlanet;

                if (planet.invader === EMPTY_ADDRESS) {
                    this.captureWaitTime.innerText = `Not Invade :-C`;

                } else if (planet.invader !== EMPTY_ADDRESS && planet.capturer !== EMPTY_ADDRESS) {
                    this.captureWaitTime.innerText = `Capture Before :-C`;
                } else if (planet.capturer === EMPTY_ADDRESS) {

                    let currentBlockNumber = df.contractsAPI.ethConnection.blockNumber;
                    let beginBlockNumber = planet.invadeStartBlock;
                    let delta = df.contractConstants.CAPTURE_ZONE_HOLD_BLOCKS_REQUIRED;//256*8;
                    let lastBlock = beginBlockNumber + delta - currentBlockNumber;

                    lastBlock = Math.max(lastBlock, 0);
                    let energyPercent = getEnergyPercent(planet);
                    this.toPlanetEnergyPercent.innerText = `Energy percent is about ${energyPercent} %`;


                    let lastTime = Math.floor(lastBlock * 5.5);
                    this.captureWaitTime.innerText = `${lastTime} secs`;




                    let scoresList = df.contractConstants.CAPTURE_ZONE_PLANET_LEVEL_SCORE;
                    let score = scoresList[planet.planetLevel];

                    this.getScore.innerText = `Can Get ${score} Score(s)`;



                    if (time < lastTime) {
                        this.res.style.color = 'pink';
                        this.res.innerText = ':-) you can arrive before capture';
                        console.log('df-gaia snipe');

                    } else {
                        this.res.style.color = 'lightgreen';
                        this.res.innerText = ':-C you can\'t arrive before capture';
                    }










                }




            } else {
                this.estimatedTime.innerText = '?????';
                this.estimatedTimeSeconds.innerText = ``;
                this.estimatedEnergy.innerText = '?????';
                this.res.innerText = '';


                this.toPlanetEnergyPercent.innerText = '';
                this.captureWaitTime.innerText = 'df-gaia :-|';
                this.getScore.innerText = '';
                this.res.innerText = '';

            }


        } else {
            this.estimatedTime.innerText = '?????';
            this.estimatedTimeSeconds.innerText = ``;
            this.estimatedEnergy.innerText = '?????';

            this.toPlanetEnergyPercent.innerText = '';
            this.captureWaitTime.innerText = 'df-gaia :-|';
            this.getScore.innerText = '';
            this.res.innerText = '';

        }
    }

    render(container) {
        container.parentElement.style.minHeight = 'unset';
        container.style.width = '320px';
        container.style.height = '320px';

        container.style.minHeight = 'unset';
        window.addEventListener('mousemove', this.calcVoyageTime);

        let label = document.createElement('div');
        label.innerText = 'Estimated time:'
        label.style.textAlign = 'center';

        container.appendChild(label);
        container.appendChild(this.estimatedTime);
        container.appendChild(this.estimatedTimeSeconds);

        let stepperLabel = document.createElement('label');
        stepperLabel.innerText = 'Estimated energy spend:';
        stepperLabel.style.textAlign = 'center';
        stepperLabel.style.display = 'block';

        let stepper = document.createElement('input');
        stepper.type = 'range';
        stepper.min = '0';
        stepper.max = '100';
        stepper.step = '5';
        stepper.value = `${this.energyPercent}`;
        stepper.style.width = '80%';
        stepper.style.height = '24px';

        let percent = document.createElement('span');
        percent.innerText = `${stepper.value}%`;
        percent.style.float = 'right';

        stepper.onchange = (evt) => {
            percent.innerText = `${evt.target.value}%`;
            try {
                this.energyPercent = parseInt(evt.target.value, 10);
            } catch (e) {
                console.error('could not parse energy percent', e);
            }
        }

        container.appendChild(stepperLabel);
        container.appendChild(stepper);
        container.appendChild(percent);
        container.appendChild(this.estimatedEnergy);



        let stepperLabel2 = document.createElement('label');
        stepperLabel2.innerText = 'capture wait time For toPlanet';
        stepperLabel2.style.color = 'yellow';
        stepperLabel2.style.textAlign = 'center';
        stepperLabel2.style.display = 'block';

        container.appendChild(stepperLabel2);


        container.appendChild(this.toPlanetEnergyPercent);
        container.appendChild(this.captureWaitTime);
        container.appendChild(this.getScore);
        container.appendChild(this.res);
    }

    destroy() {
        window.removeEventListener('mousemove', this.calcVoyageTime);
        delete this.estimatedTime
        delete this.estimatedTimeSeconds
    }
}

export default VoyageTime;