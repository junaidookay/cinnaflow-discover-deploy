import { supabase } from "@/integrations/supabase/client";

type EventType = "view" | "click" | "play" | "share";
type PromotionType = "artist" | "creator";

interface TrackEventParams {
  promotionId: string;
  promotionType: PromotionType;
  eventType: EventType;
  userId?: string;
}

// Generate a session ID for anonymous tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session", sessionId);
  }
  return sessionId;
};

// Hash IP for privacy (client-side approximation using session)
const getIpHash = () => {
  return btoa(getSessionId()).slice(0, 16);
};

export const trackEvent = async ({
  promotionId,
  promotionType,
  eventType,
  userId,
}: TrackEventParams) => {
  try {
    const { error } = await supabase.from("promotion_analytics").insert({
      promotion_id: promotionId,
      promotion_type: promotionType,
      event_type: eventType,
      user_id: userId || null,
      ip_hash: getIpHash(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    });

    if (error) {
      console.error("Failed to track event:", error);
    }
  } catch (err) {
    console.error("Analytics tracking error:", err);
  }
};

// Track content view (for recommendations)
export const trackContentView = async (contentId: string, userId?: string) => {
  try {
    const { error } = await supabase.from("content_views").insert({
      content_id: contentId,
      user_id: userId || null,
      session_id: getSessionId(),
    });

    if (error) {
      console.error("Failed to track content view:", error);
    }
  } catch (err) {
    console.error("Content view tracking error:", err);
  }
};

export const useAnalyticsTracker = () => {
  return {
    trackEvent,
    trackContentView,
  };
};
