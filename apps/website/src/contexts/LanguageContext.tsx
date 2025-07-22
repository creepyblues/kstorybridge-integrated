
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'EN' | 'KR';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  EN: {
    // Navigation
    'nav.home': 'Home',
    'nav.creators': 'Creators',
    'nav.buyers': 'Buyers',
    'nav.pricing': 'Pricing',
    'nav.signup': 'Signup',
    
    // Home Page
    'home.hero.title': 'Where Korean Stories Meet Global Screens',
    'home.hero.subtitle': 'List, discover, and license verified IP—fast.',
    'home.hero.creatorCta': "I'm a Creator",
    'home.hero.buyerCta': "I'm a Buyer",
    'home.howItWorks.title': 'How It Works',
    'home.howItWorks.step1': 'Verify Rights',
    'home.howItWorks.step1Desc': 'Upload proof of ownership',
    'home.howItWorks.step2': 'Publish Pitch',
    'home.howItWorks.step2Desc': 'AI-generated pitch decks',
    'home.howItWorks.step3': 'Match & Meet',
    'home.howItWorks.step3Desc': 'Connect with executives',
    'home.howItWorks.step4': 'Close Deal',
    'home.howItWorks.step4Desc': 'Secure licensing terms',
    'home.socialProof': 'Trusted by industry leaders from',
    'home.creators.title': 'For Creators',
    'home.creators.description': 'Get your webtoons, novels, and games in front of Hollywood executives with verified pitch decks and analytics.',
    'home.creators.cta': 'Learn More for Creators',
    'home.buyers.title': 'For Buyers',
    'home.buyers.description': 'Scout verified Korean IP with confidence. Filter by genre, performance metrics, and rights availability.',
    'home.buyers.cta': 'Learn More for Buyers',
    
    // Creators Page
    'creators.hero.title': 'For Creators: Get Your Story Discovered',
    'creators.hero.subtitle': 'Publish a verified pitch deck and reach decision-makers at Netflix, Skybound, and more.',
    'creators.hero.cta': 'Apply to List Your IP',
    'creators.struggles.title': 'Tired of These Struggles?',
    'creators.struggles.subtitle': "You're not alone. Here's what creators face every day:",
    'creators.help.title': 'How K Story Bridge Helps',
    'creators.success.title': 'Average Time to First Executive View: 5 Days',
    'creators.success.subtitle': 'vs. 6+ months through traditional channels',
    'creators.pricing.title': 'Simple, Creator-Friendly Pricing',
    'creators.cta.title': 'Ready to Get Your Story Discovered?',
    'creators.cta.subtitle': 'Join hundreds of creators already connecting with Hollywood executives.',
    'creators.cta.button': 'List My IP Now',
  },
  KR: {
    // Navigation
    'nav.home': '홈',
    'nav.creators': '작가',
    'nav.buyers': '바이어',
    'nav.pricing': '가격',
    'nav.signup': '회원가입',
    
    // Home Page
    'home.hero.title': '한국 스토리가 글로벌 스크린을 만나다',
    'home.hero.subtitle': '검증된 IP를 빠르게 등록하고, 발견하고, 라이선스하세요.',
    'home.hero.creatorCta': '작가입니다',
    'home.hero.buyerCta': '바이어입니다',
    'home.howItWorks.title': '작동 방식',
    'home.howItWorks.step1': '권리 검증',
    'home.howItWorks.step1Desc': '소유권 증명 업로드',
    'home.howItWorks.step2': '피치 게시',
    'home.howItWorks.step2Desc': 'AI 생성 피치 덱',
    'home.howItWorks.step3': '매칭 & 미팅',
    'home.howItWorks.step3Desc': '경영진과 연결',
    'home.howItWorks.step4': '계약 체결',
    'home.howItWorks.step4Desc': '라이선스 조건 확보',
    'home.socialProof': '업계 리더들의 신뢰를 받고 있습니다',
    'home.creators.title': '작가를 위해',
    'home.creators.description': '검증된 피치 덱과 분석을 통해 웹툰, 소설, 게임을 할리우드 경영진 앞에 선보이세요.',
    'home.creators.cta': '작가 자세히 보기',
    'home.buyers.title': '바이어를 위해',
    'home.buyers.description': '검증된 한국 IP를 자신있게 스카우팅하세요. 장르, 성과 지표, 권리 가용성으로 필터링하세요.',
    'home.buyers.cta': '바이어 자세히 보기',
    
    // Creators Page
    'creators.hero.title': '작가를 위해: 당신의 스토리를 발견시키세요',
    'creators.hero.subtitle': '검증된 피치 덱을 게시하고 Netflix, Skybound 등의 의사결정권자들에게 도달하세요.',
    'creators.hero.cta': 'IP 등록 신청',
    'creators.struggles.title': '이런 어려움에 지치셨나요?',
    'creators.struggles.subtitle': '당신만이 아닙니다. 작가들이 매일 직면하는 문제들:',
    'creators.help.title': 'K Story Bridge가 도움을 주는 방법',
    'creators.success.title': '첫 임원 조회까지 평균 시간: 5일',
    'creators.success.subtitle': '기존 채널 대비 6개월+ 단축',
    'creators.pricing.title': '간단하고 작가 친화적인 가격',
    'creators.cta.title': '당신의 스토리를 발견시킬 준비가 되셨나요?',
    'creators.cta.subtitle': '이미 할리우드 경영진과 연결된 수백 명의 작가와 함께하세요.',
    'creators.cta.button': '지금 내 IP 등록하기',
  },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('EN');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['EN']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
