import { NextResponse } from "next/server"

function detectPlatform(url: string) {

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return "youtube"
    }

    if (url.includes("instagram.com")) {
        return "instagram"
    }

    if (url.includes("tiktok.com")) {
        return "tiktok"
    }

    if (url.includes("facebook.com") || url.includes("fb.watch")) {
        return "facebook"
    }

    return "unknown"
}

export async function POST(req: Request) {

    try {

        const { url } = await req.json()

        if (!url) {
            return NextResponse.json(
                { error: "URL required" },
                { status: 400 }
            )
        }

        const platform = detectPlatform(url)

        return NextResponse.json({
            platform
        })

    } catch (error) {

        console.error(error)

        return NextResponse.json(
            { error: "Platform detection failed" },
            { status: 500 }
        )
    }
}
