'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { decodeMessage } from '@/lib/crypto'

export default function DecodeSection() {
  const [key, setKey] = useState('')
  const [decodedMessage, setDecodedMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDecode = async () => {
    const fileInput = fileInputRef.current
    if (fileInput && fileInput.files && fileInput.files[0] && key) {
      const file = fileInput.files[0]
      const message = await decodeMessage(file, key)
      setDecodedMessage(message)
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
          <Label htmlFor="decode-image" className="text-sm font-medium text-gray-700">Upload Grid Image</Label>
          <Input
            id="decode-image"
            type="file"
            accept="image/png, image/jpeg"
            ref={fileInputRef}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="decode-key" className="text-sm font-medium text-gray-700">Key</Label>
          <Input
            id="decode-key"
            type="text"
            placeholder="Enter the key used for encoding..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="mt-1"
          />
        </div>
        <Button onClick={handleDecode} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Decode Message
        </Button>
      </div>
      {decodedMessage && (
        <motion.div
          className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900">Decoded Message:</h3>
          <p className="text-gray-700">{decodedMessage}</p>
        </motion.div>
      )}
    </motion.div>
  )
}

