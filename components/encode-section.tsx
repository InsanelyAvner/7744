'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { encodeMessage } from '@/lib/crypto'

export default function EncodeSection() {
  const [message, setMessage] = useState('')
  const [key, setKey] = useState('')
  const [encodedImage, setEncodedImage] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleEncode = () => {
    if (message && key) {
      const canvas = canvasRef.current
      if (canvas) {
        encodeMessage(message, key, canvas)
        setEncodedImage(canvas.toDataURL('image/png'))
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="encode-message" className="text-sm font-medium text-gray-700">Message</Label>
          <Textarea
            id="encode-message"
            placeholder="Enter your message here (max 3,870 ASCII characters)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 resize-none"
            autoComplete="off"
          />
        </div>
        <div>
          <Label htmlFor="encode-key" className="text-sm font-medium text-gray-700">Key</Label>
          <Input
            id="encode-key"
            type="text"
            placeholder="Enter a key..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1"
            autoComplete="off"
          />
        </div>
        <Button onClick={handleEncode} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Encode & Generate Image
        </Button>
      </div>
      {encodedImage && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img src={encodedImage} alt="Encoded Grid" className="mx-auto rounded-lg shadow-md" />
          <a
            href={encodedImage}
            download="blue_grid.png"
            className="block text-center mt-4 text-blue-600 hover:text-blue-700 transition-colors"
          >
            Download Image
          </a>
        </motion.div>
      )}
      <canvas ref={canvasRef} width="450" height="450" className="hidden" />
    </motion.div>
  )
}

