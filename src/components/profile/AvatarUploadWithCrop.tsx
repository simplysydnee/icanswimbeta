'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface AvatarUploadWithCropProps {
  userId: string
  currentAvatarUrl?: string | null
  userName?: string
  onUploadComplete?: (url: string) => void
}

export function AvatarUploadWithCrop({
  userId,
  currentAvatarUrl,
  userName,
  onUploadComplete
}: AvatarUploadWithCropProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const { toast } = useToast()
  const supabase = createClient()

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Optimize image before upload
  const optimizeImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // Calculate new dimensions (max 500px)
        let width = img.width
        let height = img.height
        const maxSize = 500

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        canvas.width = width
        canvas.height = height

        // Draw image with optimization
        ctx!.imageSmoothingEnabled = true
        ctx!.imageSmoothingQuality = 'high'
        ctx!.drawImage(img, 0, 0, width, height)

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to optimize image'))
            }
          },
          'image/jpeg',
          0.85 // 85% quality for good compression
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image must be less than 10MB')
      }

      // Show crop dialog for large images
      if (file.size > 1 * 1024 * 1024) {
        setSelectedFile(file)
        setPreviewUrl(URL.createObjectURL(file))
        setShowCropDialog(true)
        setZoom(1)
        setRotation(0)
        setPosition({ x: 0, y: 0 })
      } else {
        // Small image, upload directly
        await uploadAvatar(file)
      }

    } catch (error) {
      console.error('File selection error:', error)
      toast({
        title: 'Invalid file',
        description: error instanceof Error ? error.message : 'Please select a valid image file',
        variant: 'destructive',
      })
    }
  }

  const cropAndUpload = async () => {
    if (!selectedFile || !previewCanvasRef.current) return

    try {
      setUploading(true)

      // Get cropped image from canvas
      const canvas = previewCanvasRef.current
      const croppedBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob!),
          'image/jpeg',
          0.9
        )
      })

      // Create file from blob
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      // Upload the cropped file
      await uploadAvatar(croppedFile)

      setShowCropDialog(false)
      setSelectedFile(null)
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl('')

    } catch (error) {
      console.error('Crop and upload error:', error)
      toast({
        title: 'Upload failed',
        description: 'Failed to process and upload image',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true)

      // Optimize image
      const optimizedBlob = await optimizeImage(file)
      const optimizedFile = new File([optimizedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      const fileExt = 'jpg' // Always use jpg after optimization
      const fileName = `${userId}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, optimizedFile, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Add cache buster
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBuster })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(urlWithCacheBuster)
      onUploadComplete?.(urlWithCacheBuster)

      toast({
        title: 'Photo updated',
        description: 'Your profile photo has been updated successfully.',
      })

    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    try {
      setUploading(true)

      // Update profile to remove avatar
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error

      setAvatarUrl(null)
      onUploadComplete?.('')

      toast({
        title: 'Photo removed',
        description: 'Your profile photo has been removed.',
      })

    } catch (error) {
      console.error('Avatar remove error:', error)
      toast({
        title: 'Remove failed',
        description: 'Failed to remove photo',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  // Draw preview on canvas
  useEffect(() => {
    if (!showCropDialog || !imageRef.current || !previewCanvasRef.current) return

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    if (!ctx || !img.complete) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set canvas size to 200x200 (avatar size)
    canvas.width = 200
    canvas.height = 200

    // Calculate scaled dimensions
    const scale = zoom
    const scaledWidth = img.width * scale
    const scaledHeight = img.height * scale

    // Calculate center position
    const centerX = (canvas.width - scaledWidth) / 2 + position.x
    const centerY = (canvas.height - scaledHeight) / 2 + position.y

    // Save context, rotate, draw, restore
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
    ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight)
    ctx.restore()

    // Draw crop guide
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

  }, [showCropDialog, zoom, rotation, position, previewUrl])

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || undefined} alt={userName} />
            <AvatarFallback className="bg-[#0077B6] text-white text-xl">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4 mr-2" />
            {avatarUrl ? 'Change Photo' : 'Upload Photo'}
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeAvatar}
              disabled={uploading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview area */}
            <div className="relative">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-100 cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-64"
                />
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview"
                  className="hidden"
                  onLoad={() => {
                    // Trigger redraw when image loads
                    if (previewCanvasRef.current && imageRef.current) {
                      const canvas = previewCanvasRef.current
                      const ctx = canvas.getContext('2d')
                      if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height)
                      }
                    }
                  }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                Drag to position • Scroll to zoom • Photo will be cropped to square
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">Zoom: {Math.round(zoom * 100)}%</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation(rotation - 15)}
                  >
                    <RotateCw className="h-4 w-4 rotate-90" />
                  </Button>
                  <span className="text-sm">Rotate: {rotation}°</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation(rotation + 15)}
                  >
                    <RotateCw className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setZoom(1)
                    setRotation(0)
                    setPosition({ x: 0, y: 0 })
                  }}
                  className="flex-1"
                >
                  Reset All
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCropDialog(false)
                setSelectedFile(null)
                URL.revokeObjectURL(previewUrl)
                setPreviewUrl('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={cropAndUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Use This Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}