export const trimImage = (file: File, tolerance: number = 10): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      reject(new Error('Image trimming timed out'));
    }, 10000); // 10 second timeout

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(timeoutId);
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas to original image size
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Skip trimming for very large images to prevent hanging
        if (img.width * img.height > 2000000) { // 2 megapixels
          clearTimeout(timeoutId);
          resolve(file);
          return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Find bounds of non-transparent/non-white content
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        let hasContent = false;

        // Use sampling for better performance on larger images
        const step = Math.max(1, Math.floor(Math.sqrt(canvas.width * canvas.height) / 1000));

        for (let y = 0; y < canvas.height; y += step) {
          for (let x = 0; x < canvas.width; x += step) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Check if pixel is not transparent and not near-white
            const isTransparent = a < tolerance;
            const isWhite = r > (255 - tolerance) && g > (255 - tolerance) && b > (255 - tolerance);
            
            if (!isTransparent && !isWhite) {
              hasContent = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        // If no content found, return original
        if (!hasContent) {
          clearTimeout(timeoutId);
          resolve(file);
          return;
        }

        // Calculate trimmed dimensions
        const trimmedWidth = maxX - minX + 1;
        const trimmedHeight = maxY - minY + 1;

        // Create trimmed canvas
        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = trimmedWidth;
        trimmedCanvas.height = trimmedHeight;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        
        if (!trimmedCtx) {
          clearTimeout(timeoutId);
          reject(new Error('Could not get trimmed canvas context'));
          return;
        }

        // Copy trimmed region
        const trimmedImageData = ctx.getImageData(minX, minY, trimmedWidth, trimmedHeight);
        trimmedCtx.putImageData(trimmedImageData, 0, 0);

        // Convert to blob and create new file
        trimmedCanvas.toBlob((blob) => {
          clearTimeout(timeoutId);
          if (blob) {
            const trimmedFile = new File([blob], file.name, { type: file.type });
            resolve(trimmedFile);
          } else {
            reject(new Error('Failed to create trimmed image blob'));
          }
        }, file.type);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error during image trimming:', error);
        resolve(file); // Fallback to original file
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
};