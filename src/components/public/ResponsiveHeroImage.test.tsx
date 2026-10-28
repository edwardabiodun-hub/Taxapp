import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ResponsiveHeroImage from "./ResponsiveHeroImage";

describe("ResponsiveHeroImage", () => {
  it("serves modern compressed formats before the PNG fallback", () => {
    render(<ResponsiveHeroImage alt="Tax preparation at a laptop" />);

    const image = screen.getByRole("img", { name: "Tax preparation at a laptop" });
    const picture = image.parentElement;

    expect(picture?.tagName).toBe("PICTURE");
    expect(picture?.querySelector('source[type="image/avif"]')).toHaveAttribute(
      "srcset",
      "/images/filesmart-hero-tax-preparation.avif",
    );
    expect(picture?.querySelector('source[type="image/webp"]')).toHaveAttribute(
      "srcset",
      "/images/filesmart-hero-tax-preparation.webp",
    );
    expect(image).toHaveAttribute("src", "/images/filesmart-hero-tax-preparation.png");
  });
});
