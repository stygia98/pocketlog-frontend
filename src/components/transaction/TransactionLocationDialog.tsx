"use client";

import { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { loadKakaoMapSdk } from "@/lib/kakaoMap";

interface TransactionLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  latitude: number;
  longitude: number;
}

export function TransactionLocationDialog({
  open,
  onOpenChange,
  label,
  latitude,
  longitude,
}: TransactionLocationDialogProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) {
      setError(undefined);
      return;
    }

    let cancelled = false;
    loadKakaoMapSdk()
      .then((kakaoSdk) => {
        if (cancelled || !mapContainerRef.current) return;
        const position = new kakaoSdk.maps.LatLng(latitude, longitude);
        const map = new kakaoSdk.maps.Map(mapContainerRef.current, { center: position, level: 4 });
        new kakaoSdk.maps.Marker({ position, map });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "지도를 불러오지 못했습니다."));

    return () => {
      cancelled = true;
    };
  }, [open, latitude, longitude]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div ref={mapContainerRef} className="h-64 w-full rounded-lg border border-border" />
        )}
      </DialogContent>
    </Dialog>
  );
}
