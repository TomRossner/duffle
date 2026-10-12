export function StoredImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // The browser must load these directly so the session cookie is sent to /api/files,
    // and closet image URLs can be any host the traveler pasted.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
