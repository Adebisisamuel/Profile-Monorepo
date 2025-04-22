import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, XCircle, RefreshCw, CropIcon, RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import Cropper from 'react-easy-crop'
import { Area, Point } from 'react-easy-crop'
import { Slider } from "@/components/ui/slider"

// Helper function to create a cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', error => reject(error))
    image.src = url
  })

// Helper function to get cropped canvas
const getCroppedImg = async (
  imageSrc: string, 
  pixelCrop: Area, 
  rotation = 0,
  mimeType = 'image/jpeg'
): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  // Set proper canvas dimensions before transform & export
  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  // Translate canvas context to center of canvas
  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate(getRadianAngle(rotation))
  ctx.translate(-safeArea / 2, -safeArea / 2)

  // Draw rotated image to context
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  )

  // Create croppable image to work with
  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  // Set canvas width to final size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Re-draw cropped image onto canvas
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  )

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Canvas is empty'))
        return
      }
      resolve(blob)
    }, mimeType, 0.85)
  })
}

// Convert degrees to radians
const getRadianAngle = (degreeValue: number): number => {
  return (degreeValue * Math.PI) / 180
}

interface ImageUploadProps {
  currentImageUrl?: string | null
  name: string // Used for the initials in the avatar fallback
  size?: 'sm' | 'md' | 'lg'
  onImageUploaded?: (imageUrl: string) => void
  uploadUrl: string
  circular?: boolean
  className?: string
  maxSizeMB?: number
}

export function ImageUpload({
  currentImageUrl,
  name,
  size = 'md',
  onImageUploaded,
  uploadUrl,
  circular = true,
  className,
  maxSizeMB = 5
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imagePreviewRef = useRef<HTMLImageElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isCropMode, setIsCropMode] = useState(false)
  const [imageMetadata, setImageMetadata] = useState<{ width?: number; height?: number; size?: number; type?: string }>({})
  const { toast } = useToast()

  // Update preview URL when currentImageUrl changes
  useEffect(() => {
    if (currentImageUrl && !selectedFile) {
      setPreviewUrl(currentImageUrl)
    }
  }, [currentImageUrl])

  // Get initials from name
  const getInitials = () => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Size mapping for avatar
  const sizeClass = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSelectedFile(null)
    setPreviewUrl(currentImageUrl || null)
  }

  const openPreviewDialog = () => {
    if (selectedFile) {
      setShowPreviewDialog(true)
    }
  }

  // Compress image without losing quality too much
  const compressImage = async (file: File, maxWidth = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width
          let height = img.height
          
          if (width > maxWidth) {
            height = (maxWidth / width) * height
            width = maxWidth
          }

          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Get compressed image
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            file.type, 
            0.85 // Good quality, but still compressed
          )
        }
        img.onerror = () => reject(new Error('Failed to load image'))
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ongeldig bestandstype",
        description: "Selecteer een afbeeldingsbestand (JPG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max specified MB)
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Bestand te groot",
        description: `De afbeelding mag niet groter zijn dan ${maxSizeMB}MB`,
        variant: "destructive"
      })
      return
    }

    // Create local preview
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
    setSelectedFile(file)
    
    // Automatically open preview dialog for larger uploads
    if (file.size > 1 * 1024 * 1024) { // 1MB
      setTimeout(() => {
        setShowPreviewDialog(true)
      }, 200)
    }
  }
  
  // Handle crop complete event
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  // Apply crop to the image and get blob data
  const applyCrop = async (): Promise<Blob | null> => {
    if (!previewUrl || !croppedAreaPixels) return null
    
    try {
      const croppedImageBlob = await getCroppedImg(
        previewUrl,
        croppedAreaPixels,
        rotation,
        selectedFile?.type || 'image/jpeg'
      )
      return croppedImageBlob
    } catch (error) {
      console.error('Error applying crop:', error)
      return null
    }
  }

  // Toggle between crop mode and preview mode
  const toggleCropMode = () => {
    setIsCropMode(prev => !prev)
    if (isCropMode) {
      // Reset crop values when exiting
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    }
  }

  // Handle rotation in 90-degree increments
  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360)
  }

  // Reset zoom
  const resetZoom = () => {
    setZoom(1)
  }

  const uploadImage = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Prepare file - apply crop if available, otherwise compress original
      let fileToUpload = selectedFile
      
      // If crop is active and crop area is defined, apply it first
      if (isCropMode && croppedAreaPixels) {
        try {
          const croppedBlob = await applyCrop()
          if (croppedBlob) {
            fileToUpload = new File(
              [croppedBlob], 
              selectedFile.name, 
              { type: selectedFile.type || 'image/jpeg' }
            )
          }
        } catch (err) {
          console.warn('Failed to apply crop:', err)
          // Continue with original file if cropping fails
        }
      }
      
      // Compress image if it's a photo (not svg or gif)
      if (
        fileToUpload.type === 'image/jpeg' || 
        fileToUpload.type === 'image/png'
      ) {
        try {
          const compressedBlob = await compressImage(fileToUpload)
          fileToUpload = new File(
            [compressedBlob], 
            fileToUpload.name, 
            { type: fileToUpload.type }
          )
          console.log(`Original size: ${(selectedFile.size / 1024).toFixed(1)}KB, Compressed: ${(fileToUpload.size / 1024).toFixed(1)}KB`)
        } catch (err) {
          console.warn('Failed to compress image:', err)
          // Continue with original file if compression fails
        }
      }
      
      const formData = new FormData()
      formData.append('image', fileToUpload)
      
      // Use XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadUrl)
      xhr.withCredentials = true
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setUploadProgress(Math.round(percentComplete))
        }
      })
      
      // Handle response
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          
          if (onImageUploaded) {
            onImageUploaded(data.imageUrl)
          }
          
          toast({
            title: "Upload succesvol",
            description: "De afbeelding is succesvol geüpload",
          })
          
          // Close the dialog if it's open
          setShowPreviewDialog(false)
          
          // Reset file input but keep the preview
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          setSelectedFile(null)
        } else {
          throw new Error(`Fout bij uploaden: ${xhr.status} ${xhr.statusText}`)
        }
      }
      
      xhr.onerror = function() {
        throw new Error('Netwerk fout bij uploaden')
      }
      
      // Send the form data
      xhr.send(formData)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload mislukt",
        description: "Er is een fout opgetreden bij het uploaden",
        variant: "destructive"
      })
      // Revert to previous image if upload failed
      if (currentImageUrl) {
        setPreviewUrl(currentImageUrl)
      } else {
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="group relative">
        <Avatar 
          className={`${sizeClass[size]} cursor-pointer ${circular ? 'rounded-full' : 'rounded-md'} 
                     transition-opacity group-hover:opacity-90`} 
          onClick={handleClick}
        >
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={name} className="object-cover" />
          ) : null}
          <AvatarFallback className={circular ? 'rounded-full' : 'rounded-md'}>
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {selectedFile && (
          <button 
            className="absolute top-0 right-0 bg-gray-800 bg-opacity-70 rounded-full p-1 z-10 
                     opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              resetFileInput();
            }}
            type="button"
          >
            <XCircle className="h-4 w-4 text-white" />
          </button>
        )}
      </div>
      
      <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
        {isUploading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Camera className="h-3 w-3" />
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {selectedFile && (
        <div className="mt-2 flex justify-center gap-2">
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            className="h-7 px-2 text-xs"
            onClick={openPreviewDialog}
          >
            <CropIcon className="h-3 w-3 mr-1" />
            Voorbeeld
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="default" 
            className="h-7 px-2 text-xs"
            onClick={uploadImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
                Uploaden...
              </>
            ) : (
              <>Uploaden</>
            )}
          </Button>
        </div>
      )}
      
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCropMode ? 'Afbeelding bijsnijden' : 'Afbeelding voorbeeld'}
            </DialogTitle>
            <DialogDescription>
              {isCropMode
                ? 'Sleep, zoom en draai de afbeelding om deze bij te snijden.'
                : 'Bekijk de geselecteerde afbeelding voordat je deze uploadt.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className={`${isCropMode ? 'h-64 sm:h-80' : 'max-h-64 sm:max-h-80'} overflow-hidden p-2 flex justify-center relative`}>
            {previewUrl && isCropMode ? (
              <div className="relative h-full w-full">
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={circular ? 1 : 4 / 3}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape={circular ? 'round' : 'rect'}
                  showGrid={true}
                  objectFit="contain"
                />
              </div>
            ) : previewUrl && (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-full max-h-64 sm:max-h-80 h-auto object-contain"
                ref={imagePreviewRef}
              />
            )}
          </div>
          
          {isCropMode && (
            <div className="space-y-4 mt-2 p-2">
              <div className="space-y-1">
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between">
                  <label className="text-sm font-medium mb-1 xs:mb-0">Zoom</label>
                  <div className="flex items-center space-x-1">
                    <ZoomOut className="h-3 w-3 text-muted-foreground" />
                    <Slider 
                      value={[zoom]} 
                      min={1} 
                      max={3} 
                      step={0.1} 
                      onValueChange={values => setZoom(values[0])}
                      className="w-full xs:w-24"
                    />
                    <ZoomIn className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRotate}
                  type="button"
                  className="h-8 px-2 flex-1 sm:flex-none"
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Draaien</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetZoom}
                  type="button"
                  className="h-8 px-2 flex-1 sm:flex-none"
                >
                  <Maximize2 className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">Reset zoom</span>
                </Button>
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploaden...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFileInput}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleCropMode}
                className="flex-1"
              >
                <CropIcon className="h-4 w-4 mr-1" />
                {isCropMode ? 'Voorbeeld' : 'Bijsnijden'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowPreviewDialog(false)}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={uploadImage}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> 
                    Uploaden...
                  </>
                ) : (
                  <>Uploaden</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}