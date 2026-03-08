import fs from "fs";
import path from "path";

export function getYtDlpPath(): string {
    if (process.env.YT_DLP_PATH) return process.env.YT_DLP_PATH;

    // Check root directory (Render fallback)
    const rootPath = path.join(process.cwd(), "yt-dlp");
    if (fs.existsSync(rootPath)) return rootPath;

    const rootPathExe = path.join(process.cwd(), "yt-dlp.exe");
    if (fs.existsSync(rootPathExe)) return rootPathExe;

    // Fallback original path
    return "/home/naawkszi/python310/bin/yt-dlp";
}

export function getFfmpegPath(): string {
    if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

    // Check root directory (Render fallback)
    const rootPath = path.join(process.cwd(), "ffmpeg");
    if (fs.existsSync(rootPath)) return rootPath;

    const rootPathExe = path.join(process.cwd(), "ffmpeg.exe");
    if (fs.existsSync(rootPathExe)) return rootPathExe;

    // Fallback original path
    return "C:\\Users\\Jamshaid\\Downloads\\ffmpeg-8.0.1-essentials_build\\ffmpeg-8.0.1-essentials_build\\bin\\ffmpeg.exe";
}
