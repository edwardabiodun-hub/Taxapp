import type { ImgHTMLAttributes } from "react";

type ResponsiveHeroImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "width" | "height"> & {
  loading?: "eager" | "lazy";
};

const ResponsiveHeroImage = ({ alt, className, loading = "lazy", ...props }: ResponsiveHeroImageProps) => (
  <picture>
    <source type="image/avif" srcSet="/images/filesmart-hero-tax-preparation.avif" />
    <source type="image/webp" srcSet="/images/filesmart-hero-tax-preparation.webp" />
    <img
      {...props}
      src="/images/filesmart-hero-tax-preparation.png"
      alt={alt}
      width={1774}
      height={887}
      loading={loading}
      decoding="async"
      className={className}
    />
  </picture>
);

export default ResponsiveHeroImage;
