const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

const planets = require('./planets.mongo');

const rs = fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'Kopler_data.csv'));


const isHabitablePlanet = function(planet) {
    return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 
    && planet['koi_insol'] < 1.11 
    && planet['koi_prad'] < 1.6;  
}

let addNum = 1;

function loadPlanetsData() {
    return new Promise((resolve, reject) => {
        rs.pipe(parse({
            comment: '#',
            columns: true,
        }))
        .on('data', async function(data) {
            if(isHabitablePlanet(data)) {
                await savePlanet(data);
            }
        })
        .on('error', function(err) {
            reject(err);
        })
        .on('end', async function() {
            const countPlanetsFound = (await getAllPlanets()).length;
            console.log(`${countPlanetsFound} planets found`);
            resolve();
        })
    })
}

async function getAllPlanets() {
    return await planets.find({});
}

async function savePlanet(planet) {
    try {
        await planets.updateOne({
            keplerName: planet.kepler_name
        }, {
            keplerName: planet.kepler_name
        }, {
            upsert: true
        })
    } catch (error) {
        console.log(`Could not save planet ${error}`);
    }
}

module.exports = {
    getAllPlanets,
    loadPlanetsData
};
