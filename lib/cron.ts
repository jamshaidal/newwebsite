import cron from "node-cron"
import { exec } from "child_process"

cron.schedule("0 */6 * * *", () => {
    exec("node scripts/updateCookies.js")
})
