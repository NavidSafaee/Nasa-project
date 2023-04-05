const { 
    getAllLaunches,
    addnewLaunch,
    existsLaunchById,
    AbortLaunchById
} = require('../../models/launches.model');

const {
    getPagination
} = require('../../services/query')

async function httpGetAllLaunches(req, res) {
    const {skip, limit} = getPagination(req.query);
    const launches = await getAllLaunches(skip, limit);
    return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
    const launch = req.body;
    if(!launch.launchDate || !launch.target || !launch.rocket) {
        return res.status(400).json({
            error: "Missing required launch property"
        });
    }

    launch.launchDate = new Date(launch.launchDate);
    if(isNaN(launch.launchDate)) {
        return res.status(400).json({
            error: "invalid launch date"
        });
    }

    await addnewLaunch(launch);
    return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
    const launchId = +req.params.id;
    

    if(!await existsLaunchById(launchId)) {
        return res.status(404).json({
            error: "launch not found"
        })
    }

    const aborted = await AbortLaunchById(launchId);

    if(!aborted) {
        return res.status(400).json({
            error: 'launch not aborted'
        })
    }
    return res.status(200).json({
        ok: true 
    });
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch
}