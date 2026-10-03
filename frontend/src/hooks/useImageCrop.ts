import { useState, useRef, useCallback, useEffect } from 'react';
import { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { toast } from "@heroui/react";

export interface ImageCropResult {
  blob: Blob;
  previewUrl: string;
}

export interface UseImageCropOptions {
  aspectRatio?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  onCropComplete?: (result: ImageCropResult) => void;
  onError?: (error: string) => void;
}

export function useImageCrop(options: UseImageCropOptions = {}) {
  const {
    aspectRatio = 1,
    maxFileSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'],
    onCropComplete,
    onError
  } = options;

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Helper function to create initial crop
  const centerAspectCrop = useCallback((mediaWidth: number, mediaHeight: number, aspect: number) => {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(new RegExp(`^image/(${allowedTypes.map(type => type.split('/')[1]).join('|')})$`))) {
      const errorMsg = `Please upload only ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} images.`;
      toast("Invalid File Type", { description: errorMsg, variant: "danger" });
      onError?.(errorMsg);
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB.`;
      toast("File Too Large", { description: errorMsg, variant: "danger" });
      onError?.(errorMsg);
      return;
    }

    setUploadedFile(file);
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result?.toString() || '');
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
  }, [allowedTypes, maxFileSize, onError]);

  // Handle image load in crop modal
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }, [centerAspectCrop, aspectRatio]);

  // Generate cropped image
  const getCroppedImg = useCallback(async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not found');

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not found');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  }, []);

  // Handle crop confirmation
  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) {
      toast("Crop Error", { description: "Please select an area to crop.", variant: "danger" });
      onError?.("Please select an area to crop.");
      return;
    }

    try {
      setIsUploading(true);
      const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop);
      
      // Create preview URL
      const newPreviewUrl = URL.createObjectURL(croppedImageBlob);
      
      // Clean up old preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setPreviewUrl(newPreviewUrl);
      setShowCropModal(false);
      
      const result: ImageCropResult = {
        blob: croppedImageBlob,
        previewUrl: newPreviewUrl
      };
      
      onCropComplete?.(result);
      
      toast("Image Cropped", { description: "Image has been cropped successfully.", variant: "success" });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to crop image';
      toast("Crop Failed", { description: errorMsg, variant: "danger" });
      onError?.(errorMsg);
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, getCroppedImg, previewUrl, onCropComplete, onError]);

  // Handle crop cancellation
  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (uploadedFile) {
      setUploadedFile(null);
    }
  }, [uploadedFile]);

  // Reset crop state
  const resetCrop = useCallback(() => {
    setUploadedFile(null);
    setImageSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setShowCropModal(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  }, [previewUrl]);

  return {
    // State
    uploadedFile,
    isUploading,
    showCropModal,
    imageSrc,
    crop,
    completedCrop,
    previewUrl,
    
    // Refs
    imgRef,
    canvasRef,
    
    // Actions
    handleFileSelect,
    onImageLoad,
    handleCropConfirm,
    handleCropCancel,
    resetCrop,
    setCrop,
    setCompletedCrop,
  };
}
