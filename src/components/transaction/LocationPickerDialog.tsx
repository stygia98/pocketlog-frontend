"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { loadKakaoMapSdk } from "@/lib/kakaoMap";

export interface PickedLocation {
  name: string;
  latitude: number;
  longitude: number;
}

interface SearchResult extends PickedLocation {
  address: string;
}

interface LocationPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (location: PickedLocation) => void;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청 — 검색 전 기본 중심

export function LocationPickerDialog({ open, onOpenChange, onSelect }: LocationPickerDialogProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<kakao.maps.Marker[]>([]);

  // 다이얼로그가 열릴 때마다 지도를 새로 만들고, 닫히면 검색 상태를 비운다.
  useEffect(() => {
    if (!open) {
      setKeyword("");
      setResults([]);
      setError(undefined);
      mapRef.current = null;
      markersRef.current = [];
      return;
    }

    let cancelled = false;
    loadKakaoMapSdk()
      .then((kakaoSdk) => {
        if (cancelled || !mapContainerRef.current) return;
        mapRef.current = new kakaoSdk.maps.Map(mapContainerRef.current, {
          center: new kakaoSdk.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 5,
        });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "지도를 불러오지 못했습니다."));

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    onSelect({ name: result.name, latitude: result.latitude, longitude: result.longitude });
    onOpenChange(false);
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!keyword.trim()) return;

    setIsSearching(true);
    setError(undefined);

    try {
      const kakaoSdk = await loadKakaoMapSdk();
      if (!mapRef.current && mapContainerRef.current) {
        mapRef.current = new kakaoSdk.maps.Map(mapContainerRef.current, {
          center: new kakaoSdk.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 5,
        });
      }
      const map = mapRef.current;

      new kakaoSdk.maps.services.Places().keywordSearch(keyword, (data, status) => {
        setIsSearching(false);

        if (status !== "OK") {
          setResults([]);
          setError("검색 결과가 없어요.");
          return;
        }

        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        const mapped: SearchResult[] = data.map((item) => ({
          name: item.place_name,
          address: item.road_address_name || item.address_name,
          latitude: Number(item.y),
          longitude: Number(item.x),
        }));

        if (map) {
          const bounds = new kakaoSdk.maps.LatLngBounds();
          mapped.forEach((item) => {
            const position = new kakaoSdk.maps.LatLng(item.latitude, item.longitude);
            const marker = new kakaoSdk.maps.Marker({ position, map });
            kakaoSdk.maps.event.addListener(marker, "click", () => handleSelect(item));
            markersRef.current.push(marker);
            bounds.extend(position);
          });
          map.setBounds(bounds);
        }

        setResults(mapped);
      });
    } catch (err) {
      setIsSearching(false);
      setError(err instanceof Error ? err.message : "지도를 불러오지 못했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>위치 검색</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            autoFocus
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="상호명으로 검색 (예: 이마트)"
            aria-label="상호명 검색"
          />
          <Button type="submit" disabled={isSearching}>
            {isSearching ? "검색 중..." : "검색"}
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div ref={mapContainerRef} className="h-64 w-full rounded-lg border border-border" />

        {results.length > 0 && (
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto">
            {results.map((result, index) => (
              <button
                key={`${result.name}-${index}`}
                type="button"
                onClick={() => handleSelect(result)}
                className="flex flex-col rounded-lg border border-border p-2 text-left text-sm hover:bg-accent"
              >
                <span className="font-medium">{result.name}</span>
                <span className="text-xs text-muted-foreground">{result.address}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
