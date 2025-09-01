import * as ImageManipulator from "expo-image-manipulator";

export interface ImageProcessingResult {
  uri: string;
  width?: number;
  height?: number;
  compressed: boolean;
}

class ImageUtils {
  /**
   * Compress and resize image for optimal upload
   */
  public static async processImageForUpload(
    imageUri: string,
    maxWidth: number = 1024,
    quality: number = 0.7
  ): Promise<ImageProcessingResult> {
    try {
      console.log("🔄 Processing image for upload...");
      
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: maxWidth } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      console.log("✅ Image processing successful:", {
        originalUri: imageUri,
        processedUri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
      });

      return {
        uri: manipulatedImage.uri,
        width: manipulatedImage.width,
        height: manipulatedImage.height,
        compressed: true,
      };
    } catch (error) {
      console.warn("⚠️ Image processing failed, using original:", error);
      return {
        uri: imageUri,
        compressed: false,
      };
    }
  }

  /**
   * Validate image URI format
   */
  public static isValidImageUri(uri: string): boolean {
    return !!uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http'));
  }

  /**
   * Create FormData for image upload
   */
  public static createImageFormData(imageUri: string, fieldName: string = "image"): FormData {
    const formData = new FormData();
    formData.append(fieldName, {
      uri: imageUri,
      type: "image/jpeg",
      name: "food-image.jpg",
    } as any);
    return formData;
  }
}

export default ImageUtils;
