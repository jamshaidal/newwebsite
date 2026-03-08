import puppeteer from "puppeteer"
import fs from "fs"

async function updateCookies() {

    const browser = await puppeteer.launch({
        headless: "new"
    })

    const page = await browser.newPage()

    await page.goto("https://www.youtube.com", {
        waitUntil: "networkidle2"
    })

    const cookies = await page.cookies()

    let cookieTxt = "# Netscape HTTP Cookie File\n"

    cookies.forEach(cookie => {

        cookieTxt += [
            cookie.domain,
            "TRUE",
            cookie.path,
            cookie.secure ? "TRUE" : "FALSE",
            cookie.expires || 0,
            cookie.name,
            cookie.value
        ].join("\t") + "\n"

    })

    fs.writeFileSync("cookies.txt", cookieTxt)

    await browser.close()

    console.log("Cookies updated successfully")

}

updateCookies()
