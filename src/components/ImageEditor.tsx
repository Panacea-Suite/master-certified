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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize.width,
      height: canvasSize.height,
      backgroundColor: "transparent",
    });

    setFabricCanvas(canvas);

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      FabricImage.fromURL(imageUrl).then((img) => {
        // Scale image to fit canvas initially
        const canvasWidth = canvas.width!;
        const canvasHeight = canvas.height!;
        const imageAspect = img.width! / img.height!;
        const canvasAspect = canvasWidth / canvasHeight;

        let scaleFactor;
        if (imageAspect > canvasAspect) {
          scaleFactor = (canvasWidth * 0.8) / img.width!;
        } else {
          scaleFactor = (canvasHeight * 0.8) / img.height!;
        }

        img.scale(scaleFactor);
        canvas.centerObject(img);
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setOriginalImage(img);
        toast("Image loaded! Use controls to adjust size and position.");
      });
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
    
    originalImage.scale(newScale);
    fabricCanvas.renderAll();
  };

  const handleRotationChange = (value: number[]) => {
    if (!originalImage || !fabricCanvas) return;
    
    const newRotation = value[0];
    setRotation(value);
    
    originalImage.rotate(newRotation);
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
    toast("Image centered and cropped to canvas size");
  };

  const handleReset = () => {
    if (!originalImage || !fabricCanvas) return;
    
    setScale([1]);
    setRotation([0]);
    originalImage.scale(1);
    originalImage.rotate(0);
    fabricCanvas.centerObject(originalImage);
    fabricCanvas.renderAll();
    toast("Image reset to original state");
  };

  const handleSave = () => {
    if (!fabricCanvas) return;

    // Export canvas as blob
    fabricCanvas.toCanvasElement().toBlob((blob) => {
      if (blob) {
        const editedFile = new File([blob], file.name, { type: "image/png" });
        onSave(editedFile);
        toast("Image saved successfully!");
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
            <canvas
              ref={canvasRef}
              className="border border-border rounded shadow-lg max-w-full max-h-full"
              style={{ backgroundColor: "white" }}
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