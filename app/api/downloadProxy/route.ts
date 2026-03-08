import { NextResponse } from "next/server"
import { execa } from "execa"
import fs from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { Readable } from "stream"

export async function POST(req: Request) {
    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

    const fileId = randomUUID()
    const outputPath = path.join(tempDir, `${fileId}.mp4`)

    try {
        const { url, format_id, quality, filename } = await req.json()

        if (!url || !format_id) {
            return NextResponse.json(
                { error: "Missing url or format_id" },
                { status: 400 }
            )
        }

        // Use original video title as filename, fallback to fuvideo
        const safeFilename = (filename || `fuvideo-${quality || format_id}.mp4`)
            .replace(/[^\w\s.\-\[\]()]/g, "-")

        // Use environment variable for path on Render, fallback to local path
        const ytDlpPath = process.env.YT_DLP_PATH || "/home/naawkszi/python310/bin/yt-dlp"
        const ffmpegPath = process.env.FFMPEG_PATH || "C:\\Users\\Jamshaid\\Downloads\\ffmpeg-8.0.1-essentials_build\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe"

        // yt-dlp downloads selected video + best audio and merges via FFmpeg
        await execa(ytDlpPath, [
            "--cookies", "cookies.txt",
            "--ffmpeg-location", ffmpegPath,
            "-f", `${format_id}+bestaudio/best`,
            "--merge-output-format", "mp4",
            "-o", outputPath,
            "--no-playlist",
            url
        ])

        const fileSize = fs.statSync(outputPath).size

        // Stream file to browser in chunks — enables progress tracking
        const nodeStream = fs.createReadStream(outputPath)
        const webStream = Readable.toWeb(nodeStream) as ReadableStream

        nodeStream.on("end", () => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        })
        nodeStream.on("error", () => {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        })

        return new NextResponse(webStream, {
            status: 200,
            headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="${safeFilename}"`,
                "Content-Length": fileSize.toString(),
            }
        })

    } catch (error: any) {
        console.error("Download Error:", error)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
        return NextResponse.json(
            { error: `Download failed: ${error?.message || error}` },
            { status: 500 }
        )
    }
}
