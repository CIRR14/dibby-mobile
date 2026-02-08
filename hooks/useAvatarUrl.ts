import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Platform } from "react-native";
import { normalizePhotoURL } from "../helpers/AppHelpers";

type AvatarCacheEntry = {
  status: "ok" | "error";
  lastAttempt: number;
};

const avatarCache = new Map<string, AvatarCacheEntry>();
const FAILURE_BACKOFF_MS = 5 * 60 * 1000;

export const useAvatarUrl = (rawUrl?: string | null, size = 200) => {
  const normalized = useMemo(
    () => normalizePhotoURL(rawUrl, size),
    [rawUrl, size]
  );
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  const markError = useCallback(() => {
    if (!normalized) {
      return;
    }
    avatarCache.set(normalized, { status: "error", lastAttempt: Date.now() });
    setResolvedUrl(null);
  }, [normalized]);

  const markSuccess = useCallback(() => {
    if (!normalized) {
      return;
    }
    avatarCache.set(normalized, { status: "ok", lastAttempt: Date.now() });
    setResolvedUrl((prev) => prev ?? normalized);
  }, [normalized]);

  useEffect(() => {
    if (!normalized) {
      setResolvedUrl(null);
      return;
    }

    const cached = avatarCache.get(normalized);
    if (cached?.status === "ok") {
      setResolvedUrl(normalized);
      return;
    }

    const now = Date.now();
    if (cached?.status === "error" && now - cached.lastAttempt < FAILURE_BACKOFF_MS) {
      setResolvedUrl(null);
      return;
    }

    if (Platform.OS === "web") {
      setResolvedUrl(normalized);
      return;
    }

    avatarCache.set(normalized, { status: "error", lastAttempt: now });
    Image.prefetch(normalized)
      .then((success) => {
        if (success) {
          avatarCache.set(normalized, { status: "ok", lastAttempt: now });
          setResolvedUrl(normalized);
        } else {
          avatarCache.set(normalized, { status: "error", lastAttempt: now });
          setResolvedUrl(null);
        }
      })
      .catch(() => {
        avatarCache.set(normalized, { status: "error", lastAttempt: now });
        setResolvedUrl(null);
      });
  }, [normalized]);

  return {
    uri: resolvedUrl,
    imageProps: {
      onError: markError,
      onLoad: markSuccess,
    },
  };
};
