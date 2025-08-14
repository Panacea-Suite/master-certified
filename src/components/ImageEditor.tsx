import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, FabricImage } from "fabric";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crop, RotateCcw, ZoomIn, ZoomOut, Download, X } from "lucide-react";
import { toast } from "sonner";

interface ImageEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

const PRESET_SIZES = [
  { name: "Square Logo", width: 300, height: 300 },
  { name: "Rectangle Logo", width: 400, height: 200 },
  { name: "Small Icon", width: 64, height: 64 },
  { name: "Large Display", width: 800, height: 600 },
];

export const ImageEditor = ({ file, onSave, onCancel }: ImageEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [originalImage, setOriginalImage] = useState<FabricImage | null>(null);
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState([0]);
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
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
        const canvasWidth = canvas.width || canvasSize.width;
        const canvasHeight = canvas.height || canvasSize.height;
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
        });
        
        canvas.centerObject(img);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        setOriginalImage(img);
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
  }, [file, canvasSize]);

  const handleScaleChange = (value: number[]) => {
    if (!originalImage || !fabricCanvas) return;
    
    const newScale = value[0];
    setScale(value);
    
    originalImage.set({
      scaleX: newScale,
      scaleY: newScale,
    });
    fabricCanvas.renderAll();
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
    if (presetData && fabricCanvas) {
      setCanvasSize({ width: presetData.width, height: presetData.height });
      fabricCanvas.setDimensions({ width: presetData.width, height: presetData.height });
      fabricCanvas.renderAll();
    }
  };

  const handleCrop = () => {
    if (!fabricCanvas || !originalImage) return;
    
    // Center the image and fit to canvas
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
    toast.success("Image centered and cropped to canvas size");
  };

  const handleReset = () => {
    if (!originalImage || !fabricCanvas) return;
    
    setScale([1]);
    setRotation([0]);
    originalImage.set({
      scaleX: 1,
      scaleY: 1,
      angle: 0,
    });
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
    toast.success("Image reset to original state");
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
            {/* Preset Sizes */}
            <div className="space-y-3">
              <Label>Preset Sizes</Label>
              <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset size" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_SIZES.map((preset) => (
                    <SelectItem key={preset.name} value={preset.name}>
                      {preset.name} ({preset.width}×{preset.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scale Control */}
            <div className="space-y-3">
              <Label>Scale: {scale[0].toFixed(2)}x</Label>
              <Slider
                value={scale}
                onValueChange={handleScaleChange}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
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
              <Button
                variant="outline"
                onClick={handleCrop}
                className="w-full"
              >
                <Crop className="w-4 h-4 mr-2" />
                Center & Crop
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

            {/* Canvas Size Info */}
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded">
              <p><strong>Output Size:</strong> {canvasSize.width}×{canvasSize.height}px</p>
              <p><strong>Original File:</strong> {file.name}</p>
              <p><strong>File Size:</strong> {(file.size / 1024).toFixed(1)}KB</p>
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