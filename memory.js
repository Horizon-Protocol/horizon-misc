const pm2 = require('pm2');

// Restart 2nd keeper outside safe memory,
// Don't run this file using pm2 as it will indefinitely run this,
// use linux cron which is sufficient to do the job

const manageSecondaryPerps = async () => {

    const PRIMARY_KEEPER = 'perps-keeper-testnet';
    const SECONDARY_KEEPER = 'secondary-perps-keeper-testnet';

    const SAFE_MEMORY_LIMIT = 950_000_000;  // should be less than 1GB
    const SAFE_UPTIME = 180_000; // in milliseconds

    try {
        // Always disconnet pm2 after job
        pm2.connect(async function (err) {
            if (err) {
                console.error(err);
                return pm2.disconnect();
            }
            pm2.list(async (err, list) => {
                if (err == null) {
                    let mainKeeper = list.find(function (element) {
                        return (element.name === PRIMARY_KEEPER);
                    });

                    let secondKeeper = list.find(function (element) {
                        return (element.name === SECONDARY_KEEPER);
                    });

                    let mainKeeperUptime = Date.now() - mainKeeper?.pm2_env?.pm_uptime;

                    if (mainKeeper?.pm2_env?.status == 'online') {
                        // If primary-keeper goes beyond safe limit, restart the second-keeper
                        if (mainKeeper?.monit?.memory > SAFE_MEMORY_LIMIT) {
                            if (secondKeeper?.pm2_env?.status != 'online') {
                                pm2.restart(SECONDARY_KEEPER, function (err, app) {
                                    if (err) {
                                        return pm2.disconnect();
                                    }
                                    console.log("Keeper beyond safe memory limit!! Restarting secondary keeper,", Date.now());
                                    return pm2.disconnect();
                                })
                            }
                            else {
                                return pm2.disconnect();
                            }
                        }
                        else {
                            // If primary is in safe limit and it's been restarted for like a minute or so, close the second keeper
                            if (mainKeeperUptime > SAFE_UPTIME) {
                                if (secondKeeper?.pm2_env?.status == 'online') {
                                    pm2.stop(SECONDARY_KEEPER, function (err, app) {
                                        if (err) {
                                            console.log(err);
                                            return pm2.disconnect();
                                        }
                                        console.log("Keeper is running safe, Stopping the secondary keeper,", Date.now());
                                        return pm2.disconnect();
                                    })
                                }
                                else {
                                    return pm2.disconnect();
                                }
                            }
                        }
                    }
                    // If primary is down, restart it asap,
                    else {
                        pm2.restart(PRIMARY_KEEPER, function (err, app) {
                            if (err) {
                                return pm2.disconnect();
                            }
                            return pm2.disconnect();
                        })
                    }
                }
                return
            })
        })

    } catch (error) {
        console.error(error);
        return pm2.disconnect();
    }
}


manageSecondaryPerps();