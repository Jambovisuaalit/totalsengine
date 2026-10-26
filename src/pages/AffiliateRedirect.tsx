import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getPartner } from '@/config/affiliates';

/**
 * Affiliate redirect page
 * Route: /go/:partner
 * Logs click event and redirects to partner URL
 */
const AffiliateRedirect = () => {
  const { partner } = useParams<{ partner: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!partner) {
      navigate('/');
      return;
    }

    const partnerConfig = getPartner(partner);

    if (!partnerConfig) {
      console.warn(`[Affiliate] Invalid partner: ${partner}`);
      navigate('/');
      return;
    }

    // Extract tracking params
    const trackingData = {
      partner: partnerConfig.id,
      src: searchParams.get('src') || 'direct',
      sport: searchParams.get('sport') || undefined,
      date: searchParams.get('date') || undefined,
      match: searchParams.get('match') || undefined,
      placement: searchParams.get('placement') || undefined,
      timestamp: new Date().toISOString(),
    };

    // Log click event (placeholder for DB logging)
    console.log('[Affiliate Click]', trackingData);

    // TODO: Future - log to database
    // await supabase.from('affiliate_clicks').insert(trackingData);

    // 302 redirect to partner URL
    window.location.href = partnerConfig.baseUrl;
  }, [partner, searchParams, navigate]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-muted-foreground mb-2">Redirecting...</div>
        <p className="text-xs text-muted-foreground/60">You are being redirected to our partner site.</p>
      </div>
    </div>
  );
};

export default AffiliateRedirect;