const axios = require('axios');

const launches = require('./launches.mongo');
const planets = require('./planets.mongo'); 

const DEFAULT_FLIGHT_NUMBER = 99;
const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function fetchSpaceXLaunchData() {
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: "rocket",
                    select: {
                        name: 1
                    }
                },
                {
                    path: "payloads",
                    select: {
                        customers: 1
                    }
                }
            ]
        }
    })

    if(response.status !== 200) {
        console.log('Problem fetching sapceX launch data');
        throw new Error('spaceX Launch data downlad failed!')
    }

    return response.data.docs;
}

async function populateLaunches(launchDocs) {
    let num = 1;
    launchDocs.forEach((launchDoc) => {
        const customers = launchDoc.payloads.flatMap((payload) => payload.customers);

        const launch = {
            flightNumber: launchDoc.flight_number,
            mission: launchDoc.name,
            rocket: launchDoc.rocket.name,
            launchDate: launchDoc.date_local,
            upcoming: launchDoc.upcoming,
            success: launchDoc.success,
            customers 
        }
        
        saveLaunch(launch);
    })
}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    })

    if(firstLaunch) {
        console.log('launch data already loaded');
    } else {
        const launchDocs = await fetchSpaceXLaunchData();
        await populateLaunches(launchDocs);
    }
}

async function getAllLaunches(skip, limit) {
    return await launches
    .find({}, {'-id': 0, '__v': 0})
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit)
}

async function addnewLaunch(launch) {
    const newFlightNumber = await getLatesFlightNumber() + 1;

    Object.assign(launch, {
        upcoming: true,
        success: true,
        customers: ['ZTM', 'NASA'],
        flightNumber: newFlightNumber  
    })

    saveLaunch(launch);
}

async function AbortLaunchById(launchId) {
    const aborted = await launches.updateOne({
        flightNumber: launchId
    }, {
        upcoming: false,
        success: false
    })

    return aborted.modifiedCount === 1;
}

async function existsLaunchById(launchId) {
    return await findLaunch({
        flightNumber: launchId
    })
}


async function getLatesFlightNumber() {
    const latestLaunch =  await launches.findOne()
    .sort("-flightNumber");

    if(!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function findLaunch(filter) {
    return await launches.findOne(filter);
}

async function saveLaunch(launch) {
    await launches.findOneAndUpdate({
        flightNumber: launch.flightNumber      
    }, launch, {
        upsert: true
    }) 
}



module.exports = {
    loadLaunchData,
    getAllLaunches,
    addnewLaunch,
    AbortLaunchById,
    existsLaunchById
};
