import type { ContentBlock } from "~/types/content";
import type { Image } from "~/types/core";

export const useContentBlockImages = () => {
  /**
   * Get image from content block by type
   */
  const getImage = (
    contentBlock: ContentBlock | undefined | null,
    imageType?: Image["image_type"]
  ): Image | null => {
    if (!contentBlock?.images?.length) return null;

    if (imageType) {
      return (
        contentBlock.images.find((img) => img.image_type === imageType) || null
      );
    }

    return contentBlock.images[0] || null;
  };

  /**
   * Get image URL (file or thumbnail)
   */
  const getImageUrl = (
    contentBlock: ContentBlock | undefined | null,
    imageType?: Image["image_type"],
    preferThumbnail = false
  ): string | null => {
    const image = getImage(contentBlock, imageType);
    if (!image) return null;

    if (preferThumbnail && image.thumbnail) {
      return image.thumbnail;
    }

    return image.file || image.thumbnail || null;
  };

  /**
   * Get all images from content block
   */
  const getAllImages = (
    contentBlock: ContentBlock | undefined | null
  ): Image[] => {
    return contentBlock?.images || [];
  };

  /**
   * Get images by type
   */
  const getImagesByType = (
    contentBlock: ContentBlock | undefined | null,
    imageType: Image["image_type"]
  ): Image[] => {
    if (!contentBlock?.images?.length) return [];
    return contentBlock.images.filter((img) => img.image_type === imageType);
  };

  /**
   * Check if content block has images
   */
  const hasImages = (
    contentBlock: ContentBlock | undefined | null
  ): boolean => {
    return !!contentBlock?.images?.length;
  };

  /**
   * Check if content block has image of specific type
   */
  const hasImageType = (
    contentBlock: ContentBlock | undefined | null,
    imageType: Image["image_type"]
  ): boolean => {
    return !!getImage(contentBlock, imageType);
  };

  /**
   * Get featured image (is_featured = true) or first image
   */
  const getFeaturedImage = (
    contentBlock: ContentBlock | undefined | null
  ): Image | null => {
    if (!contentBlock?.images?.length) return null;

    const featured = contentBlock.images.find((img) => img.is_featured);
    return featured || contentBlock.images[0] || null;
  };

  return {
    getImage,
    getImageUrl,
    getAllImages,
    getImagesByType,
    hasImages,
    hasImageType,
    getFeaturedImage,
  };
};
