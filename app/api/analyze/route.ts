import { NextResponse } from "next/server"
import { execa } from "execa"
import { getCache, setCache } from "@/lib/cache"
import { checkRateLimit } from "@/lib/rateLimit"
import { getYtDlpPath } from "@/lib/paths"

export async function POST(req: Request) {

    try {

        const ip =
            req.headers.get("x-forwarded-for") ||
            "unknown"

        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Too many requests. Try again later." },
                { status: 429 }
            )
        }

        const { url } = await req.json()

        if (!url) {
            return NextResponse.json({ error: "URL required" }, { status: 400 })
        }

        // Check cache first
        const cached = getCache(url)

        if (cached) {
            return NextResponse.json(cached)
        }

        // Use environment variable for path on Render, fallback to local path
        const ytDlpPath = getYtDlpPath()

        // extract video info using yt-dlp
        const { stdout } = await execa(ytDlpPath, [
            "--cookies",
            "cookies.txt",
            "-J",
            "--no-warnings",
            "--no-playlist",
            url
        ])

        const info = JSON.parse(stdout)

        // Filter and sort formats — all qualities (audio merged at download time)
        const formats = info.formats
            .filter((f: any) =>
                f.ext === "mp4" &&
                f.height &&
                f.url
            )
            .map((f: any) => ({
                format_id: f.format_id,
                quality: `${f.height}p`,
                fps: f.fps || null,
                filesize: f.filesize || null,
                url: f.url
            }))
            // sort highest resolution first, deduplicate
            .sort((a: any, b: any) => b.height - a.height)
            .filter((f: any, index: number, self: any[]) =>
                index === self.findIndex((t: any) => t.quality === f.quality)
            )

        const result = {
            title: info.title,
            thumbnail: info.thumbnail,
            duration: info.duration,
            formats
        }

        // Store in cache for 1 hour
        setCache(url, result, 3600)

        return NextResponse.json(result)

    } catch (error: any) {

        console.error("Analyze Error:", error)

        return NextResponse.json({
            error: `Failed to extract video: ${error?.message || error}`
        }, { status: 500 })

    }
}
