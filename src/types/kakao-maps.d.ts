// 카카오맵 JS SDK의 공식 타입 패키지를 설치하지 않고, 이 프로젝트가 실제로 쓰는
// 범위(지도·마커·키워드 검색)만 최소로 선언한다("any 금지" 규칙 준수 목적).
declare namespace kakao.maps {
  function load(callback: () => void): void;

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setBounds(bounds: LatLngBounds): void;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(latlng: LatLng): void;
  }

  namespace event {
    function addListener(target: Marker, type: string, handler: () => void): void;
  }

  namespace services {
    type Status = "OK" | "ZERO_RESULT" | "ERROR";

    interface PlacesSearchResultItem {
      place_name: string;
      address_name: string;
      road_address_name: string;
      x: string; // 경도(longitude)
      y: string; // 위도(latitude)
    }

    class Places {
      keywordSearch(
        keyword: string,
        callback: (data: PlacesSearchResultItem[], status: Status) => void
      ): void;
    }
  }
}
