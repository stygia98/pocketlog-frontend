// 카카오맵 JS SDK를 지도가 실제로 필요한 시점(다이얼로그를 열 때)에만 지연 로드한다.
// 대시보드 등 지도가 없는 화면에서는 이 스크립트가 아예 로드되지 않는다.

declare global {
  interface Window {
    kakao: typeof kakao;
  }
}

let loadPromise: Promise<typeof kakao> | null = null;

export function loadKakaoMapSdk(): Promise<typeof kakao> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appKey) {
      reject(new Error("NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다."));
      return;
    }

    if (window.kakao?.maps) {
      resolve(window.kakao);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = () => reject(new Error("카카오맵 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });

  return loadPromise;
}
