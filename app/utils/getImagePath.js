export function getImagePath(img) {
  if (!img) return "/image/default-banner.jpg";
  return img.startsWith("/image/") ? img : `/image/${img}`;
}