import { NextResponse } from "next/server"
import { execa } from "execa"
import fs from "fs"
import path from "path"
import { getYtDlpPath, getFfmpegPath } from "@/lib/paths"

export async function POST(req: Request) {

    try {

        const { url } = await req.json()

        if (!url) {
            return NextResponse.json(
                { error: "URL required" },
                { status: 400 }
            )
        }

        const tempDir = path.join(process.cwd(), "temp")

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir)
        }

        const videoPath = path.join(tempDir, "preview.mp4")
        const previewImage = path.join(tempDir, "preview.jpg")

        // Use environment variable for path on Render, fallback to local path
        const ytDlpPath = getYtDlpPath()
        const ffmpegPath = getFfmpegPath()

        // Download a low-quality preview video
        await execa(ytDlpPath, [
            "--cookies", "cookies.txt",
            "--extractor-args", "youtube:player_client=android",
            "--user-agent", "Mozilla/5.0",
            "--extractor-retries", "3",
            "-f",
            "18",
            "-o",
            videoPath,
            "--no-playlist",
            url
        ])

        // Generate thumbnail grid using FFmpeg
        await execa(ffmpegPath, [
            "-i",
            videoPath,
            "-vf",
            "fps=1,scale=160:-1,tile=10x10",
            "-frames:v",
            "1",
            previewImage
        ])

        return NextResponse.json({
            preview: "/temp/preview.jpg"
        })

    } catch (error: any) {

        console.error("Preview Error:", error)

        return NextResponse.json(
            { error: `Preview generation failed: ${error?.message || error}` },
            { status: 500 }
        )
    }
}
