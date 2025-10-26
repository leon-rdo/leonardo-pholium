import type { Post } from "~/types/blog";

export const getCoverImageThumbnail = (post: Post) => {
  const coverImage = post.images?.find((img) => img.image_type === "cover");
  return (
    coverImage?.thumbnail ||
    coverImage?.file ||
    "https://via.placeholder.com/100x80"
  );
};
