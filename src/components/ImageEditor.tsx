import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Crop, RotateCcw, Download, X, Link, Scissors } from "lucide-react";
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

        // Scale image to fit canvas initially
        const canvasWidth = 300;
        const canvasHeight = 300;
        const imageAspect = (img.width || 1) / (img.height || 1);
        const canvasAspect = canvasWidth / canvasHeight;

        let scaleFactor;
        if (imageAspect > canvasAspect) {
          scaleFactor = (canvasWidth * 0.8) / (img.width || 1);
        } else {
          scaleFactor = (canvasHeight * 0.8) / (img.height || 1);
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
        setOriginalAspectRatio((img.width || 1) / (img.height || 1));
        setIsLoading(false);
        toast.success("Image loaded! Use controls to adjust size and position.");
        
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

  const handleSizeChange = (newWidth: number, newHeight: number) => {
    if (!originalImage || !fabricCanvas) return;
    
    // Update state
    setCanvasSize({ width: newWidth, height: newHeight });
    setOutputWidth(newWidth);
    setOutputHeight(newHeight);
    
    // Update canvas dimensions without recreating
    fabricCanvas.setDimensions({ width: newWidth, height: newHeight });
    
    // Scale image to fit new canvas size
    const imageAspect = (originalImage.width || 1) / (originalImage.height || 1);
    const canvasAspect = newWidth / newHeight;

    let scaleFactor;
    if (imageAspect > canvasAspect) {
      scaleFactor = (newWidth * 0.8) / (originalImage.width || 1);
    } else {
      scaleFactor = (newHeight * 0.8) / (originalImage.height || 1);
    }

    originalImage.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
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
    
    handleSizeChange(newWidth, newHeight);
  };

  const handleHeightChange = (value: string) => {
    const newHeight = Math.max(32, Math.min(2048, parseInt(value) || 32));
    if (newHeight === outputHeight) return;
    
    let newWidth = outputWidth;
    if (maintainAspectRatio && originalAspectRatio) {
      newWidth = Math.round(newHeight * originalAspectRatio);
      newWidth = Math.max(32, Math.min(2048, newWidth));
    }
    
    handleSizeChange(newWidth, newHeight);
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
      handleSizeChange(presetData.width, presetData.height);
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

  const handleReset = () => {
    if (!originalImage || !fabricCanvas) return;
    
    setRotation([0]);
    originalImage.set({ angle: 0 });
    
    // Reset to fit canvas
    const canvasWidth = canvasSize.width;
    const canvasHeight = canvasSize.height;
    const imageAspect = (originalImage.width || 1) / (originalImage.height || 1);
    const canvasAspect = canvasWidth / canvasHeight;

    let scaleFactor;
    if (imageAspect > canvasAspect) {
      scaleFactor = (canvasWidth * 0.8) / (originalImage.width || 1);
    } else {
      scaleFactor = (canvasHeight * 0.8) / (originalImage.height || 1);
    }

    originalImage.set({
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      originX: 'center',
      originY: 'center',
    });
    
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
    toast.success("Image reset to fit canvas");
  };

  const handleRemoveBackground = async () => {
    if (!fabricCanvas || !originalImage) return;

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

  const handleSave = () => {
    if (!fabricCanvas) return;

    // Export canvas as blob
    fabricCanvas.toCanvasElement().toBlob((blob) => {
      if (blob) {
        const editedFile = new File([blob], file.name, { type: "image/png" });
        onSave(editedFile);
        toast.success("Image saved successfully!");
      }
    }, "image/png", 1.0);
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
            <canvas
              ref={canvasRef}
              className="border border-border rounded shadow-lg max-w-full max-h-full"
            />
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