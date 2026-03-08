"use client"

import { useState } from "react"

const PLATFORM_ICONS: Record<string, string> = {
  youtube: "▶",
  instagram: "📷",
  tiktok: "🎵",
  facebook: "📘",
  unknown: "🌐",
}

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ff4444",
  instagram: "#e1306c",
  tiktok: "#69c9d0",
  facebook: "#1877f2",
  unknown: "#6c63ff",
}

function formatBytes(bytes: number) {
  if (!bytes) return ""
  const mb = bytes / 1024 / 1024
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || isNaN(seconds)) return ""
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function sanitizeFilename(title: string) {
  return title
    .replace(/[/\\?%*:|"<>]/g, "-")  // remove illegal chars
    .replace(/\s+/g, " ")            // collapse whitespace
    .trim()
    .slice(0, 100)                    // max 100 chars
}

export default function Home() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [videoData, setVideoData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [downloadPhase, setDownloadPhase] = useState<string>("")

  async function analyzeVideo() {
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setVideoData(null)
    setPlatform(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const platformRes = await fetch(`${apiUrl}/api/platform`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const platformData = await platformRes.json()
      setPlatform(platformData.platform)

      if (platformData.platform === "unknown") {
        setError("This platform is not supported. Try YouTube, Instagram, TikTok or Facebook.")
        setLoading(false)
        return
      }

      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
      } else {
        setVideoData(data)
      }
    } catch (err: any) {
      setError("Failed to analyze video. Please check the URL and try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function downloadVideo(formatId: string, quality: string, title: string) {
    if (!url || !formatId) return
    setDownloadingId(formatId)
    setDownloadProgress(0)
    setDownloadPhase("Preparing video (merging audio)...")

    const safeTitle = sanitizeFilename(title || "fuvideo")
    const filename = `${safeTitle} [${quality}].mp4`

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""
      const res = await fetch(`${apiUrl}/api/downloadProxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format_id: formatId, quality, filename }),
      })

      if (!res.ok) {
        alert("Download failed. Please try again.")
        setDownloadProgress(null)
        setDownloadPhase("")
        return
      }

      const contentLength = res.headers.get("content-length")
      const total = contentLength ? parseInt(contentLength, 10) : 0

      setDownloadPhase("Downloading to your device...")

      // Read stream chunk by chunk to track progress
      const reader = res.body!.getReader()
      const chunks: BlobPart[] = []
      let loaded = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value as BlobPart)
          loaded += value.length
          if (total > 0) {
            setDownloadProgress(Math.round((loaded / total) * 100))
          }
        }
      }

      // All chunks received — assemble blob and trigger save to device
      setDownloadPhase("Saving file...")
      const blob = new Blob(chunks, { type: "video/mp4" })
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      setDownloadProgress(100)
      setDownloadPhase("✅ Done!")
      setTimeout(() => {
        setDownloadProgress(null)
        setDownloadPhase("")
        setDownloadingId(null)
      }, 2500)

    } catch (err) {
      alert("Error downloading video.")
      console.error(err)
      setDownloadProgress(null)
      setDownloadPhase("")
      setDownloadingId(null)
    }
  }

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", padding: "0 16px 64px" }}>

      {/* Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 0 48px",
        flexDirection: "column",
        gap: "8px"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          background: "linear-gradient(135deg, #6c63ff, #63b3ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: "2.5rem",
          fontWeight: 800,
          letterSpacing: "-0.5px",
        }}>
          ⬇ FuVideo
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Download videos from YouTube, TikTok, Instagram &amp; Facebook
        </p>
      </header>

      {/* Main Card */}
      <main style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Search Box */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          marginBottom: "24px"
        }}>
          <label style={{
            display: "block",
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "10px"
          }}>
            Video URL
          </label>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && analyzeVideo()}
              style={{
                flex: 1,
                minWidth: "200px",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "var(--text-primary)",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <button
              onClick={analyzeVideo}
              disabled={loading || !url.trim()}
              style={{
                background: loading ? "var(--bg-input)" : "linear-gradient(135deg, #6c63ff, #63b3ff)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: !url.trim() && !loading ? 0.5 : 1,
                transition: "opacity 0.2s, transform 0.1s",
                whiteSpace: "nowrap",
                boxShadow: loading ? "none" : "0 4px 16px var(--accent-glow)",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    width: "14px", height: "14px",
                    border: "2px solid #ffffff55",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.8s linear infinite"
                  }} />
                  Analyzing...
                </span>
              ) : "Analyze"}
            </button>
          </div>

          {/* Platform badges */}
          <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            {["YouTube", "TikTok", "Instagram", "Facebook"].map(p => (
              <span key={p} style={{
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "12px",
            padding: "14px 18px",
            color: "#f87171",
            fontSize: "0.9rem",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Download Progress Bar */}
        {downloadProgress !== null && (
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "20px",
            animation: "fadeIn 0.3s ease"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                {downloadPhase}
              </span>
              <span style={{
                color: downloadProgress === 100 ? "var(--success)" : "var(--accent)",
                fontWeight: 700,
                fontSize: "0.9rem"
              }}>
                {downloadProgress}%
              </span>
            </div>

            {/* Progress track */}
            <div style={{
              width: "100%",
              height: "6px",
              background: "var(--bg-input)",
              borderRadius: "999px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${downloadProgress}%`,
                height: "100%",
                background: downloadProgress === 100
                  ? "var(--success)"
                  : "linear-gradient(90deg, #6c63ff, #63b3ff)",
                borderRadius: "999px",
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* Video Result */}
        {videoData && (
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.3s ease"
          }}>
            {/* Thumbnail */}
            <div style={{ position: "relative" }}>
              <img
                src={videoData.thumbnail}
                alt="Video thumbnail"
                style={{ width: "100%", display: "block", maxHeight: "320px", objectFit: "cover" }}
              />
              {platform && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: PLATFORM_COLORS[platform] || "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  {PLATFORM_ICONS[platform]} {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </div>
              )}
              {videoData.duration && (
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#fff"
                }}>
                  {formatDuration(videoData.duration)}
                </div>
              )}
            </div>

            {/* Info + Formats */}
            <div style={{ padding: "20px 24px" }}>
              <h2 style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "18px",
                lineHeight: 1.4,
              }}>
                {videoData.title}
              </h2>

              {videoData.formats && videoData.formats.length > 0 ? (
                <div>
                  <p style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "12px"
                  }}>
                    Available Formats
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {videoData.formats.map((f: any) => (
                      <button
                        key={f.format_id}
                        onClick={() => downloadVideo(f.format_id, f.quality, videoData.title)}
                        disabled={!!downloadingId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "var(--bg-input)",
                          border: `1px solid ${downloadingId === f.format_id ? "var(--accent)" : "var(--border)"}`,
                          borderRadius: "10px",
                          padding: "12px 16px",
                          cursor: downloadingId ? "not-allowed" : "pointer",
                          transition: "border-color 0.2s, background 0.2s",
                          color: "var(--text-primary)",
                          textAlign: "left",
                          opacity: downloadingId && downloadingId !== f.format_id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!downloadingId) {
                            e.currentTarget.style.borderColor = "var(--accent)"
                            e.currentTarget.style.background = "rgba(108,99,255,0.08)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (downloadingId !== f.format_id) {
                            e.currentTarget.style.borderColor = "var(--border)"
                            e.currentTarget.style.background = "var(--bg-input)"
                          }
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "8px",
                            background: "linear-gradient(135deg, #6c63ff22, #63b3ff22)",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            color: "var(--accent)",
                          }}>
                            {f.quality}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                              {f.quality} MP4
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              {f.fps ? `${f.fps}fps` : ""}
                              {f.fps && f.filesize ? " · " : ""}
                              {f.filesize ? formatBytes(f.filesize) : ""}
                            </div>
                          </div>
                        </div>

                        <div style={{
                          background: downloadingId === f.format_id
                            ? "rgba(108,99,255,0.2)"
                            : "linear-gradient(135deg, #6c63ff, #63b3ff)",
                          color: "#fff",
                          padding: "6px 14px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          boxShadow: downloadingId === f.format_id ? "none" : "0 2px 8px var(--accent-glow)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          whiteSpace: "nowrap",
                        }}>
                          {downloadingId === f.format_id ? (
                            <>
                              <span style={{
                                width: "12px", height: "12px",
                                border: "2px solid #ffffff55",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                display: "inline-block",
                                animation: "spin 0.8s linear infinite"
                              }} />
                              {downloadProgress !== null ? `${downloadProgress}%` : "..."}
                            </>
                          ) : "⬇ Download"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  No downloadable formats found for this video.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
