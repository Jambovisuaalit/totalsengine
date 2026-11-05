import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

interface SEOHeadProps {
  title: string;
  description: string;
  /** Legacy callers may pass this; external domains are never used. */
  canonical?: string;
  noindex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  noindex = false,
}: SEOHeadProps) => {
  const { pathname } = useLocation();
  const canonical = new URL(pathname, window.location.origin).href;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={noindex ? "noindex, follow" : "index, follow"}
      />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="TotalsEngine" />
    </Helmet>
  );
};
