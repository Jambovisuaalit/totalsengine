import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
}

export const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (attribute: "name" | "property", value: string, content: string) => {
      const selector = `meta[${attribute}="${value}"]`;
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);

    // Remove the previous route's canonical when the new route supplies none.
    const existingCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      const link = existingCanonical ?? document.createElement("link");
      link.rel = "canonical";
      link.href = canonical;
      if (!existingCanonical) document.head.appendChild(link);
      return () => { link.remove(); };
    } else {
      existingCanonical?.remove();
    }
  }, [title, description, canonical]);

  return null;
};
