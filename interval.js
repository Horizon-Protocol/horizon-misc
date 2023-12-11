const pm2 = require('pm2');

// Restart 2nd keeper outside safe memory,
// Don't run this file using pm2 as it will indefinitely run this,
// use linux cron which is sufficient to do the job
const manageSecondaryPerps = async () => {

    const PRIMARY_KEEPER = 'perps-keeper-testnet';
    const SECONDARY_KEEPER = 'secondary-perps-keeper-testnet';

    // All intervals should be in milliseconds
    const SAFE_HOURS = 5 * 3600 * 1_000;    // 5 hours
    const SAFE_BUFFER = 5 * 60 * 1_000;     // 5 minutes
    const LOWER_SAFE_UPTIME = 3 * 60 * 1_000; // 3 imutes
    const UPPER_SAFE_UPTIME = SAFE_HOURS - SAFE_BUFFER; // Assuming Keeper is restarted after this point)

    // Tests
    // const LOWER_SAFE_UPTIME = 120_000;
    // const UPPER_SAFE_UPTIME = 480_000; // Assuming Keeper is restarted after this point)

    try {
        // Always disconnet pm2 after job
        pm2.connect(async function (err) {
            if (err) {
                console.error(err);
                return pm2.disconnect();
            }
            pm2.list(async (err, list) => {
                if (err == null) {

                    // console.log(list);
                    let mainKeeper = list.find(function (element) {
                        return (element.name === PRIMARY_KEEPER);
                    });

                    let secondKeeper = list.find(function (element) {
                        return (element.name === SECONDARY_KEEPER);
                    });

                    let mainKeeperUptime = Date.now() - mainKeeper?.pm2_env?.pm_uptime;

                    console.log(`Primary Keeper is online for ${mainKeeperUptime / 1000} seconds`);

                    // Eg: If primary-keeper is up for 3 mins and less than 55 mins stop the second-keeper
                    if (mainKeeperUptime > LOWER_SAFE_UPTIME && mainKeeperUptime < UPPER_SAFE_UPTIME) {
                        if (secondKeeper?.pm2_env?.status == 'online') {
                            pm2.stop(SECONDARY_KEEPER, function (err, app) {
                                if (err) {
                                    console.log(err);
                                    return pm2.disconnect();
                                }
                                const timeElapsed = Date.now();
                                const current = new Date(timeElapsed);
                                console.log(`Primary Keeper is online for ${LOWER_SAFE_UPTIME / 1000}s after a recent restart. Stopping secondary keeper at ${current.toUTCString()}`);
                                return pm2.disconnect();
                            })
                        }
                        else {
                            const timeElapsed = Date.now();
                            const current = new Date(timeElapsed);
                            console.log(`Primary Keeper is running in safe-intervals <${LOWER_SAFE_UPTIME / 1000}s/${UPPER_SAFE_UPTIME / 1000}s> -  No action required at ${current.toUTCString()}`);
                            return pm2.disconnect();
                        }
                    }
                    else {
                        if (secondKeeper?.pm2_env?.status != 'online') {
                            pm2.restart(SECONDARY_KEEPER, function (err, app) {
                                if (err) {
                                    console.log(err);
                                    return pm2.disconnect();
                                }
                                const timeElapsed = Date.now();
                                const current = new Date(timeElapsed);
                                console.log(`Primary Keeper has either restarted just now or going to restart soon!! Restarting secondary keeper now as backup at ${current.toUTCString()}`);
                                return pm2.disconnect();
                            })
                        }
                        else {
                            const timeElapsed = Date.now();
                            const current = new Date(timeElapsed);
                            console.log(`Primary Keeper not in safe intervals <${LOWER_SAFE_UPTIME / 1000}s/${UPPER_SAFE_UPTIME / 1000}s> but Secondary Keeper is already running as a backup - No action required at ${current.toUTCString()}`);
                            return pm2.disconnect();
                        }
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

module.exports = {
    manageSecondaryPerps,
}