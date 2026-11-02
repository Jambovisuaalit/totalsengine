import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OGImageParams {
  edgeId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  market: string;
  edge: number;
}

const FALLBACK_OG_IMAGE = "https://doctore.lovable.app/og/analysis.png";

export function useOGImage(params: OGImageParams | null) {
  const [imageUrl, setImageUrl] = useState<string>(FALLBACK_OG_IMAGE);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!params) {
      setImageUrl(FALLBACK_OG_IMAGE);
      return;
    }

    const { edgeId, homeTeam, awayTeam, league, market, edge } = params;

    // First check if image exists in storage
    const checkAndGenerate = async () => {
      const storageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/og-images/${edgeId}.png`;
      
      try {
        // Quick check if image exists
        const headResponse = await fetch(storageUrl, { method: "HEAD" });
        if (headResponse.ok) {
          setImageUrl(storageUrl);
          return;
        }
      } catch {
        // Image doesn't exist, generate it
      }

      // Generate new image
      setIsLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-og-image", {
          body: { edgeId, homeTeam, awayTeam, league, market, edge },
        });

        if (error) {
          console.error("Failed to generate OG image:", error);
          return;
        }

        if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
        }
      } catch (err) {
        console.error("Error generating OG image:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAndGenerate();
  }, [params?.edgeId]);

  return { imageUrl, isLoading };
}