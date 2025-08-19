import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage, Rect } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Crop, RotateCcw, Download, X, Link, Scissors, Check } from "lucide-react";
import { toast } from "sonner";
import { removeBackground, loadImage } from "@/utils/backgroundRemoval";

interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

const PRESET_SIZES = [
  { name: "Small Icon", width: 64, height: 64 },
  { name: "Medium Icon", width: 128, height: 128 },
  { name: "Square Logo", width: 300, height: 300 },
  { name: "Large Logo", width: 512, height: 512 },
  { name: "Rectangle Logo", width: 400, height: 200 },
  { name: "Banner", width: 800, height: 200 },
];

export const ImageEditor = ({ file, onSave, onCancel }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);
  const [trulyOriginalImage, setTrulyOriginalImage] = useState<FabricImage | null>(null);
  const [rotation, setRotation] = useState([0]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({ width: 300, height: 300 });
  const [outputWidth, setOutputWidth] = useState(300);
  const [outputHeight, setOutputHeight] = useState(300);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [hasTransparentBackground, setHasTransparentBackground] = useState(false);
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 300,
      height: 300,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    // Load the image
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imageUrl = e.target?.result as string;
        
        if (!imageUrl) {
          throw new Error("Failed to read image file");
        }

        console.log("Loading image from:", imageUrl.substring(0, 50) + "...");
        
        const img = await FabricImage.fromURL(imageUrl, {
          crossOrigin: 'anonymous'
        });
        
        console.log("Image loaded successfully:", img.width, "x", img.height);

        // Scale image to fit canvas initially with increased scale (90% instead of 80%)
        const canvasWidth = 300;
        const canvasHeight = 300;
        const imageAspect = (img.width || 1) / (img.height || 1);
        const canvasAspect = canvasWidth / canvasHeight;

        let scaleFactor;
        if (imageAspect > canvasAspect) {
          scaleFactor = (canvasWidth * 0.9) / (img.width || 1);
        } else {
          scaleFactor = (canvasHeight * 0.9) / (img.height || 1);
        }

        img.set({
          scaleX: scaleFactor,
          scaleY: scaleFactor,
          originX: 'center',
          originY: 'center',
        });
        
        canvas.centerObject(img);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        setOriginalImage(img);
        // Store the image source for reset functionality
        setTrulyOriginalImage(img);
        setOriginalAspectRatio((img.width || 1) / (img.height || 1));
        
        // Check if the loaded image has transparency (for PNG files)
        if (file.type === 'image/png') {
          console.log("Checking PNG for transparency...");
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCanvas.width = img.width || 1;
            tempCanvas.height = img.height || 1;
            tempCtx.drawImage(img.getElement(), 0, 0);
            
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const hasAlpha = imageData.data.some((_, index) => index % 4 === 3 && imageData.data[index] < 255);
            
            console.log("PNG transparency check result:", hasAlpha);
            
            if (hasAlpha) {
              console.log("Setting transparent background for canvas");
              setHasTransparentBackground(true);
              // Set Fabric.js canvas background to transparent
              canvas.backgroundColor = 'rgba(0,0,0,0)';
              canvas.renderAll();
              console.log("Canvas background set to transparent");
              toast.success("PNG with transparency loaded!");
            }
          }
        }
        
        setIsLoading(false);
        if (!hasTransparentBackground) {
          toast.success("Image loaded! Use controls to adjust size and position.");
        }
        
      } catch (error) {
        console.error("Error loading image:", error);
        setError("Failed to load image. Please try a different file.");
        setIsLoading(false);
        toast.error("Failed to load image");
      }
    };

    reader.onerror = () => {
      setError("Failed to read the selected file");
      setIsLoading(false);
      toast.error("Failed to read file");
    };

    reader.readAsDataURL(file);

    return () => {
      canvas.dispose();
    };
  }, [file]); // Removed canvasSize dependency to prevent recreation

  const handleImageSizeChange = (newWidth: number, newHeight: number) => {
    if (!originalImage || !fabricCanvas) return;
    
    // Update output size state only
    setOutputWidth(newWidth);
    setOutputHeight(newHeight);
    
    // Calculate scale factor for the image based on desired output size
    const imageOriginalWidth = originalImage.width || 1;
    const imageOriginalHeight = originalImage.height || 1;
    
    // Scale the image to match the desired output dimensions
    const scaleX = newWidth / imageOriginalWidth;
    const scaleY = newHeight / imageOriginalHeight;
    
    originalImage.set({
      scaleX: scaleX,
      scaleY: scaleY,
      originX: 'center',
      originY: 'center',
    });
    
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
  };

  const handleWidthChange = (value: string) => {
    const newWidth = Math.max(32, Math.min(2048, parseInt(value) || 32));
    if (newWidth === outputWidth) return;
    
    let newHeight = outputHeight;
    if (maintainAspectRatio && originalAspectRatio) {
      newHeight = Math.round(newWidth / originalAspectRatio);
      newHeight = Math.max(32, Math.min(2048, newHeight));
    }
    
    handleImageSizeChange(newWidth, newHeight);
  };

  const handleHeightChange = (value: string) => {
    const newHeight = Math.max(32, Math.min(2048, parseInt(value) || 32));
    if (newHeight === outputHeight) return;
    
    let newWidth = outputWidth;
    if (maintainAspectRatio && originalAspectRatio) {
      newWidth = Math.round(newHeight * originalAspectRatio);
      newWidth = Math.max(32, Math.min(2048, newWidth));
    }
    
    handleImageSizeChange(newWidth, newHeight);
  };

  const handleRotationChange = (value: number[]) => {
    if (!originalImage || !fabricCanvas) return;
    
    const newRotation = value[0];
    setRotation(value);
    
    originalImage.set({ angle: newRotation });
    fabricCanvas.renderAll();
  };

  const handlePresetSelect = (preset: string) => {
    setSelectedPreset(preset);
    const presetData = PRESET_SIZES.find(p => p.name === preset);
    if (presetData) {
      handleImageSizeChange(presetData.width, presetData.height);
    }
  };

  const handleFitToCanvas = () => {
    if (!fabricCanvas || !originalImage) return;
    
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    const imageAspect = (originalImage.width || 1) / (originalImage.height || 1);
    const canvasAspect = canvasWidth / canvasHeight;

    // Scale to fit (maintain aspect ratio, may have empty space)
    let scaleFactor;
    if (imageAspect > canvasAspect) {
      scaleFactor = canvasWidth / (originalImage.width || 1);
    } else {
      scaleFactor = canvasHeight / (originalImage.height || 1);
    }

    originalImage.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      originX: 'center',
      originY: 'center',
    });
    
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
    toast.success("Image fitted to canvas");
  };

  const handleFillCanvas = () => {
    if (!fabricCanvas || !originalImage) return;
    
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    const imageAspect = (originalImage.width || 1) / (originalImage.height || 1);
    const canvasAspect = canvasWidth / canvasHeight;

    // Scale to fill (maintain aspect ratio, may crop edges)
    let scaleFactor;
    if (imageAspect > canvasAspect) {
      scaleFactor = canvasHeight / (originalImage.height || 1);
    } else {
      scaleFactor = canvasWidth / (originalImage.width || 1);
    }

    originalImage.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      originX: 'center',
      originY: 'center',
    });
    
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
    toast.success("Image scaled to fill canvas");
  };

  const handleReset = async () => {
    if (!trulyOriginalImage || !fabricCanvas) return;
    
    try {
      // Clear the canvas and restore the truly original image
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = hasTransparentBackground ? 'rgba(0,0,0,0)' : '#ffffff';
      
      // Get the original image source and recreate it
      const originalElement = trulyOriginalImage.getElement() as HTMLImageElement;
      const resetImage = await FabricImage.fromURL(originalElement.src, {
        crossOrigin: 'anonymous'
      });
      
      setRotation([0]);
      resetImage.set({ angle: 0 });
      
      // Reset to fit canvas with original scaling
      const canvasWidth = canvasSize.width;
      const canvasHeight = canvasSize.height;
      const imageAspect = (resetImage.width || 1) / (resetImage.height || 1);
      const canvasAspect = canvasWidth / canvasHeight;

      let scaleFactor;
      if (imageAspect > canvasAspect) {
        scaleFactor = (canvasWidth * 0.9) / (resetImage.width || 1);
      } else {
        scaleFactor = (canvasHeight * 0.9) / (resetImage.height || 1);
      }

      resetImage.set({
        scaleX: scaleFactor,
        scaleY: scaleFactor,
        originX: 'center',
        originY: 'center',
      });
      
      fabricCanvas.centerObject(resetImage);
      fabricCanvas.add(resetImage);
      fabricCanvas.setActiveObject(resetImage);
      fabricCanvas.renderAll();
      
      // Update the working image reference
      setOriginalImage(resetImage);
      
      toast.success("Image reset to original");
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error("Failed to reset image. Please try again.");
    }
  };

  const handleRemoveBackground = async () => {
    if (!fabricCanvas || !originalImage) return;

    // Check if image already has transparency
    if (hasTransparentBackground) {
      toast.info("This image already has a transparent background!");
      return;
    }

    setIsRemovingBackground(true);
    toast.info("Removing background... This may take a moment.");

    try {
      // Convert canvas to blob to get current image
      const currentCanvas = fabricCanvas.toCanvasElement();
      const blob = await new Promise<Blob>((resolve) => {
        currentCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to get image data');
      }

      // Load image and remove background
      const imageElement = await loadImage(blob);
      const processedBlob = await removeBackground(imageElement);

      // Create new fabric image from processed blob
      const processedImageUrl = URL.createObjectURL(processedBlob);
      const newImage = await FabricImage.fromURL(processedImageUrl, {
        crossOrigin: 'anonymous'
      });

      // Replace the current image with the processed one
      fabricCanvas.remove(originalImage);
      
      // Set Fabric.js canvas background to transparent
      fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';
      fabricCanvas.renderAll();
      console.log("Canvas background set to transparent after background removal");
      
      // Scale and position the new image
      const canvasWidth = canvasSize.width;
      const canvasHeight = canvasSize.height;
      const imageAspect = (newImage.width || 1) / (newImage.height || 1);
      const canvasAspect = canvasWidth / canvasHeight;

      let scaleFactor;
      if (imageAspect > canvasAspect) {
        scaleFactor = (canvasWidth * 0.8) / (newImage.width || 1);
      } else {
        scaleFactor = (canvasHeight * 0.8) / (newImage.height || 1);
      }

      newImage.set({
        scaleX: scaleFactor,
        scaleY: scaleFactor,
        originX: 'center',
        originY: 'center',
      });

      fabricCanvas.centerObject(newImage);
      fabricCanvas.add(newImage);
      fabricCanvas.setActiveObject(newImage);
      fabricCanvas.renderAll();

      setOriginalImage(newImage);
      setHasTransparentBackground(true);
      toast.success("Background removed successfully!");

      // Clean up the temporary URL
      URL.revokeObjectURL(processedImageUrl);

    } catch (error) {
      console.error('Background removal failed:', error);
      toast.error("Failed to remove background. Please try again.");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleCropStart = () => {
    if (!fabricCanvas || !originalImage) return;
    
    setIsCropMode(true);
    
    // Create crop rectangle overlay
    const imageLeft = originalImage.left || 0;
    const imageTop = originalImage.top || 0;
    const imageWidth = (originalImage.width || 0) * (originalImage.scaleX || 1);
    const imageHeight = (originalImage.height || 0) * (originalImage.scaleY || 1);
    
    const cropWidth = Math.min(imageWidth * 0.8, 200);
    const cropHeight = Math.min(imageHeight * 0.8, 200);
    
    const rect = new Rect({
      left: imageLeft - cropWidth / 2,
      top: imageTop - cropHeight / 2,
      width: cropWidth,
      height: cropHeight,
      fill: 'rgba(0, 0, 0, 0.3)',
      stroke: '#3B82F6',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: true,
      evented: true,
    });
    
    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    setCropRect(rect);
    fabricCanvas.renderAll();
    
    toast.info("Drag and resize the blue rectangle to set crop area");
  };

  const handleCropApply = () => {
    if (!fabricCanvas || !originalImage || !cropRect) return;
    
    try {
      // Remove the crop rectangle from canvas before processing
      fabricCanvas.remove(cropRect);
      fabricCanvas.renderAll();
      
      // Get the actual displayed crop rectangle bounds
      const cropBounds = cropRect.getBoundingRect();
      console.log('Crop bounds:', cropBounds);
      console.log('Canvas size:', fabricCanvas.width, fabricCanvas.height);
      console.log('Image bounds:', originalImage.getBoundingRect());
      
      // Instead of cropping from canvas, crop directly from the original image
      const imageElement = originalImage.getElement() as HTMLImageElement;
      const imageBounds = originalImage.getBoundingRect();
      
      // Calculate the crop area relative to the image
      const relativeLeft = Math.max(0, (cropBounds.left - imageBounds.left) / imageBounds.width);
      const relativeTop = Math.max(0, (cropBounds.top - imageBounds.top) / imageBounds.height);
      const relativeWidth = Math.min(1 - relativeLeft, cropBounds.width / imageBounds.width);
      const relativeHeight = Math.min(1 - relativeTop, cropBounds.height / imageBounds.height);
      
      console.log('Relative crop area:', { relativeLeft, relativeTop, relativeWidth, relativeHeight });
      
      // Calculate actual pixel coordinates on the original image
      const sourceWidth = imageElement.naturalWidth;
      const sourceHeight = imageElement.naturalHeight;
      const sourceLeft = relativeLeft * sourceWidth;
      const sourceTop = relativeTop * sourceHeight;
      const sourceCropWidth = relativeWidth * sourceWidth;
      const sourceCropHeight = relativeHeight * sourceHeight;
      
      console.log('Source crop coordinates:', { sourceLeft, sourceTop, sourceCropWidth, sourceCropHeight });

      // Create a temporary canvas for cropping
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = Math.round(sourceCropWidth);
      tempCanvas.height = Math.round(sourceCropHeight);
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) throw new Error('Failed to get temp canvas context');
      
      // Set transparent background
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the cropped portion from the original image
      tempCtx.drawImage(
        imageElement,
        Math.round(sourceLeft),
        Math.round(sourceTop),
        Math.round(sourceCropWidth),
        Math.round(sourceCropHeight),
        0,
        0,
        Math.round(sourceCropWidth),
        Math.round(sourceCropHeight)
      );
      
      const dataUrl = tempCanvas.toDataURL('image/png');

      // Create new image from the cropped data URL
      fetch(dataUrl)
        .then((res) => res.blob())
        .then(async (blob) => {
          if (!blob) throw new Error('Failed to create cropped image');

          const croppedImageUrl = URL.createObjectURL(blob);
          const newImage = await FabricImage.fromURL(croppedImageUrl, {
            crossOrigin: 'anonymous',
          });

          // Reset canvas and add the cropped image
          fabricCanvas.clear();
          fabricCanvas.backgroundColor = hasTransparentBackground ? 'rgba(0,0,0,0)' : '#ffffff';

          // Fit the new image nicely into the editor view
          const canvasWidth = 300;
          const canvasHeight = 300;
          const imageAspect = (newImage.width || 1) / (newImage.height || 1);
          const canvasAspect = canvasWidth / canvasHeight;

          let scaleFactor;
          if (imageAspect > canvasAspect) {
            scaleFactor = (canvasWidth * 0.9) / (newImage.width || 1);
          } else {
            scaleFactor = (canvasHeight * 0.9) / (newImage.height || 1);
          }

          newImage.set({
            scaleX: scaleFactor,
            scaleY: scaleFactor,
            originX: 'center',
            originY: 'center',
          });

          fabricCanvas.centerObject(newImage);
          fabricCanvas.add(newImage);
          fabricCanvas.setActiveObject(newImage);
          fabricCanvas.renderAll();

          setOriginalImage(newImage);
          setOriginalAspectRatio((newImage.width || 1) / (newImage.height || 1));
          setOutputWidth(newImage.width || 300);
          setOutputHeight(newImage.height || 300);

          setCropRect(null);
          setIsCropMode(false);
          URL.revokeObjectURL(croppedImageUrl);
          toast.success('Image cropped successfully!');
        })
        .catch((error) => {
          console.error('Crop failed:', error);
          toast.error('Failed to crop image. Please try again.');
        });
    } catch (error) {
      console.error('Crop failed:', error);
      toast.error('Failed to crop image. Please try again.');
    }
  };

  const handleCropCancel = () => {
    if (!fabricCanvas || !cropRect) return;
    
    fabricCanvas.remove(cropRect);
    fabricCanvas.renderAll();
    setCropRect(null);
    setIsCropMode(false);
    
    toast.info("Crop cancelled");
  };

  const handleSave = () => {
    if (!originalImage) {
      console.error("No image available for save");
      toast.error("Editor not ready. Please try again.");
      return;
    }

    console.log("Starting direct image save (no canvas margins)...");
    console.log("Output dimensions:", outputWidth, "x", outputHeight);
    console.log("Has transparent background:", hasTransparentBackground);

    try {
      // Draw directly from the source image element to avoid any editor borders/margins
      const imageElement = originalImage.getElement() as HTMLImageElement;

      const out = document.createElement('canvas');
      out.width = outputWidth;
      out.height = outputHeight;
      const ctx = out.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context for output');

      if (!hasTransparentBackground) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, outputWidth, outputHeight);
      } else {
        ctx.clearRect(0, 0, outputWidth, outputHeight);
      }

      // Scale the raw image to the requested output size (no outer padding)
      ctx.drawImage(
        imageElement,
        0,
        0,
        imageElement.naturalWidth,
        imageElement.naturalHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      out.toBlob((blob) => {
        if (blob) {
          const editedFile = new File([blob], file.name, { type: 'image/png' });
          onSave(editedFile);
          toast.success('Image saved successfully!');
        } else {
          console.error('Failed to create blob from canvas');
          toast.error('Failed to save image. Please try again.');
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Error during save process:', error);
      toast.error('Failed to save image. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Image Editor</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex flex-1 gap-6 min-h-0">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg min-h-0">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading image...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="text-center p-4">
                  <p className="text-destructive mb-2">{error}</p>
                  <Button variant="outline" onClick={onCancel}>Close</Button>
                </div>
              </div>
            )}
            <div className={`relative ${hasTransparentBackground ? 'checkerboard-bg' : ''}`}>
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-full ${
                  hasTransparentBackground ? 'canvas-transparent' : ''
                }`}
              />
              {hasTransparentBackground && (
                <div className="absolute inset-0 pointer-events-none checkerboard-pattern" />
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-80 space-y-6 overflow-y-auto">
            {/* Output Size Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Output Size</Label>
                <div className="flex items-center space-x-2">
                  <Link className="h-4 w-4" />
                  <Switch
                    checked={maintainAspectRatio}
                    onCheckedChange={setMaintainAspectRatio}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <Input
                    type="number"
                    value={outputWidth}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    min={32}
                    max={2048}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <Input
                    type="number"
                    value={outputHeight}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    min={32}
                    max={2048}
                    className="h-8"
                  />
                </div>
              </div>
            </div>

            {/* Preset Sizes */}
            <div className="space-y-3">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-1">
                {PRESET_SIZES.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetSelect(preset.name)}
                    className="text-xs p-2 h-auto"
                  >
                    <div className="text-center">
                      <div className="font-medium">{preset.width}×{preset.height}</div>
                      <div className="text-muted-foreground">{preset.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-3">
              <Label>Rotation: {rotation[0]}°</Label>
              <Slider
                value={rotation}
                onValueChange={handleRotationChange}
                min={-180}
                max={180}
                step={1}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleFitToCanvas}
                  className="text-xs"
                  size="sm"
                >
                  <Crop className="w-3 h-3 mr-1" />
                  Fit to Canvas
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleFillCanvas}
                  className="text-xs"
                  size="sm"
                >
                  <Crop className="w-3 h-3 mr-1" />
                  Fill Canvas
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={handleRemoveBackground}
                disabled={isRemovingBackground}
                className="w-full"
              >
                {isRemovingBackground ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    Removing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4 mr-2" />
                    Remove Background
                  </>
                )}
              </Button>
              
              {!isCropMode ? (
                <Button 
                  onClick={handleCropStart}
                  variant="outline"
                  className="w-full"
                >
                  <Crop className="w-4 h-4 mr-2" />
                  Crop
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCropApply}
                    size="sm"
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Apply
                  </Button>
                  <Button 
                    onClick={handleCropCancel}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* File Info */}
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
              <p><strong>Output:</strong> {outputWidth}×{outputHeight}px</p>
              <p><strong>Original:</strong> {file.name}</p>
              <p><strong>Size:</strong> {(file.size / 1024).toFixed(1)}KB</p>
              {maintainAspectRatio && (
                <p><strong>Aspect:</strong> Locked</p>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};