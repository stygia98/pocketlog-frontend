// 대시보드 광고 배너 목록. 이 파일만 고치면 문구·이미지·주소가 바뀐다.
// ⚠️ 지금 내용은 임의로 넣은 자리표시(placeholder)다. 실제 광고를 붙일 때 문구·이미지·href를 교체한다.
// 이미지는 public/assets/banners/ 아래 SVG이고(next/image 미사용), 배경은 테마 토큰이라 라이트/다크를 따라간다.

export interface AdBanner {
  id: string;
  title: string;
  description: string;
  /** 눌렀을 때 새 창으로 열 주소 */
  href: string;
  /** public 기준 이미지 경로. 장식이므로 대체 텍스트를 두지 않는다 */
  image: string;
  /** 배너 배경에 옅게 번지는 색(CSS 색 토큰) */
  tint: string;
}

export const AD_BANNERS: AdBanner[] = [
  {
    id: "compare",
    title: "예·적금, 대출 금리 한눈에 비교",
    description: "내게 맞는 금융상품을 찾아보세요",
    href: "https://fine.fss.or.kr",
    image: "/assets/banners/ad-compare.svg",
    tint: "var(--primary)",
  },
  {
    id: "support",
    title: "금융 지원이 필요할 땐",
    description: "청년·서민을 위한 정책금융 알아보기",
    href: "https://www.kinfa.or.kr",
    image: "/assets/banners/ad-support.svg",
    tint: "var(--income)",
  },
  {
    id: "learn",
    title: "경제 공부, 오늘 한 줄부터",
    description: "쉽게 배우는 돈과 경제 이야기",
    href: "https://www.bok.or.kr",
    image: "/assets/banners/ad-learn.svg",
    tint: "var(--logo)",
  },
];
