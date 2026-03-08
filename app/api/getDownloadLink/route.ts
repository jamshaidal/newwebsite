import { NextResponse } from "next/server"
import { execa } from "execa"
import { getYtDlpPath } from "@/lib/paths"

export async function POST(req: Request) {

    try {

        const { url, format_id } = await req.json()

        if (!url || !format_id) {
            return NextResponse.json(
                { error: "Missing url or format_id" },
                { status: 400 }
            )
        }

        // Use environment variable for path on Render, fallback to local path
        const ytDlpPath = getYtDlpPath()

        // Generate fresh direct video link
        const { stdout } = await execa(ytDlpPath, [
            "--cookies", "cookies.txt",
            "--extractor-args", "youtube:player_client=android",
            "--user-agent", "Mozilla/5.0",
            "--extractor-retries", "3",
            "-g",
            "-f",
            format_id,
            "--no-playlist",
            url
        ])

        const directUrl = stdout.trim()

        return NextResponse.json({
            success: true,
            downloadUrl: directUrl
        })

    } catch (error: any) {

        console.error("Generate Link Error:", error)

        return NextResponse.json(
            { error: `Failed to generate download link: ${error?.message || error}` },
            { status: 500 }
        )
    }
}
