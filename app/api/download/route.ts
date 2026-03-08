import { NextResponse } from "next/server"
import { execa } from "execa"

export async function POST(req: Request) {
    try {

        const { url, format_id } = await req.json()

        if (!url || !format_id) {
            return NextResponse.json(
                { error: "Missing url or format_id" },
                { status: 400 }
            )
        }

        // generate direct video link
        const { stdout } = await execa("/home/naawkszi/python310/bin/yt-dlp", [
            "--cookies",
            "cookies.txt",
            "-g",
            "-f",
            format_id,
            "--no-playlist",
            url
        ])

        const directUrl = stdout.trim()

        return NextResponse.json({
            downloadUrl: directUrl
        })

    } catch (err) {

        console.error(err)

        return NextResponse.json(
            { error: "Download link generation failed" },
            { status: 500 }
        )
    }
}
