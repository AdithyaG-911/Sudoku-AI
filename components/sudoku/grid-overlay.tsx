"use client"

import { useEffect, useRef } from "react"

interface GridOverlayProps {
    previewImage: string
    corners: {
        topLeft: [number, number]
        topRight: [number, number]
        bottomRight: [number, number]
        bottomLeft: [number, number]
    }
}

export function GridOverlay({ previewImage, corners }: GridOverlayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = previewImage

        img.onload = () => {
            // Set canvas size to image size (or scaled down)
            // For display, max width 100%
            canvas.width = img.width
            canvas.height = img.height

            // Draw Image
            ctx.drawImage(img, 0, 0)

            // Draw Grid
            ctx.strokeStyle = "#00ff00" // Green
            ctx.lineWidth = 4
            ctx.beginPath()
            ctx.moveTo(corners.topLeft[0], corners.topLeft[1])
            ctx.lineTo(corners.topRight[0], corners.topRight[1])
            ctx.lineTo(corners.bottomRight[0], corners.bottomRight[1])
            ctx.lineTo(corners.bottomLeft[0], corners.bottomLeft[1])
            ctx.closePath()
            ctx.stroke()

            // Draw Dots
            const drawDot = (x: number, y: number, color: string) => {
                ctx.fillStyle = color
                ctx.beginPath()
                ctx.arc(x, y, 6, 0, Math.PI * 2)
                ctx.fill()
            }

            drawDot(corners.topLeft[0], corners.topLeft[1], "red")
            drawDot(corners.topRight[0], corners.topRight[1], "yellow")
            drawDot(corners.bottomRight[0], corners.bottomRight[1], "blue")
            drawDot(corners.bottomLeft[0], corners.bottomLeft[1], "orange")
        }
    }, [previewImage, corners])

    return (
        <canvas
            ref={canvasRef}
            className="w-full h-auto bg-black"
        />
    )
}
