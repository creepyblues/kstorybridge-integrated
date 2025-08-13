# Webtoon Research Scripts

이 디렉토리에는 한국 웹툰에 대한 정보를 수집하고 분석하는 통합 스크립트가 포함되어 있습니다.

## 📋 Main Script

### `webtoon-researcher-consolidated.js` (통합 버전)
모든 기능을 통합한 포괄적인 웹툰 정보 수집 및 분석 스크립트

**기본 사용법:**
```bash
node webtoon-researcher-consolidated.js "웹툰 제목"
```

**고급 사용법:**
```bash
# 실시간 웹 스크래핑 모드
node webtoon-researcher-consolidated.js --live "웹툰 제목"

# 상세 로깅 모드
node webtoon-researcher-consolidated.js --verbose "웹툰 제목"

# 드라이런 모드 (실행 계획만 보기)
node webtoon-researcher-consolidated.js --dry-run "웹툰 제목"
```

**NPM 스크립트:**
```bash
npm run test              # 기본 데모 모드로 테스트
npm run test:live         # 실시간 모드로 테스트  
npm run test:verbose      # 상세 로깅으로 테스트
npm run research "제목"   # 커스텀 제목으로 연구
```

## 🎯 Features

### 🎭 연구 모드
- **데모 모드 (기본)**: 현실적인 목 데이터로 전체 기능 시연
- **실시간 모드 (--live)**: 실제 웹 스크래핑으로 라이브 데이터 수집
- **상세 모드 (--verbose)**: 디버깅 정보와 상세 분석 과정 표시

### 📊 정보 수집 범위
- **스토리 정보**: 줄거리, 장르, 태그, 테마
- **캐릭터 정보**: 등장인물, 역할, 설명
- **리뷰 분석**: 긍정/부정/중립 리뷰, 감정 분석
- **메타데이터**: 작가, 작화가, 연재처, 상태, 화수
- **종합 분석**: 작품 평가, 시장 포지셔닝, 투자 가치 평가

### 🔍 검색 전략
1. **웹툰 플랫폼 직접 검색**
   - 네이버웹툰
   - 카카오페이지  
   - 레진코믹스

2. **한국 커뮤니티 분석**
   - 네이버 블로그
   - 네이버 카페
   - 티스토리
   - 다음 검색

3. **고급 콘텐츠 추출**
   - 한국어 자연어 처리를 통한 정보 추출
   - 감정 분석 및 리뷰 분류
   - 캐릭터 역할 자동 인식
   - 장르 및 태그 자동 분류

## 📊 Output

### JSON 결과 파일
```json
{
  "title": "웹툰 제목",
  "story": {
    "synopsis": "줄거리",
    "genre": ["장르1", "장르2"],
    "tags": ["태그1", "태그2"]
  },
  "characters": [
    {
      "name": "캐릭터명",
      "role": "역할", 
      "description": "설명"
    }
  ],
  "reviews": {
    "positive": ["긍정적 리뷰"],
    "negative": ["부정적 리뷰"],
    "overall_sentiment": "positive|negative|mixed"
  },
  "metadata": {
    "author": "작가명",
    "platforms": ["네이버", "카카오"],
    "status": "연재중|완결"
  },
  "overall_summary": {
    "title_assessment": "작품 전반 평가",
    "genre_analysis": "장르 특성 분석",
    "character_dynamics": "캐릭터 구성 분석",
    "reader_reception": "독자 반응 분석",
    "market_positioning": "시장 포지셔닝 평가",
    "recommendation_score": 8.5,
    "target_audience": "타겟 독자층",
    "key_selling_points": ["핵심 매력 포인트"],
    "strengths": ["작품 강점"],
    "weaknesses": ["개선점"],
    "overall_conclusion": "종합 결론 및 투자 가치 평가"
  }
}
```

### 텍스트 요약 파일
한국어로 작성된 읽기 쉬운 요약 보고서

## 🎯 종합 분석 기능 (NEW!)

### 자동 생성되는 전문가급 분석
- **작품 평가**: 스토리 완성도 및 구성 분석
- **장르 분석**: 복합 장르 특성 및 시장 포지셔닝
- **캐릭터 분석**: 등장인물 구성과 관계성 평가
- **독자 반응 분석**: 감정 분석 기반 수용도 평가
- **시장 포지셔닝**: 플랫폼, 연재 상태, 접근성 분석
- **추천 점수**: 1-10점 자동 산출 (투자 가치 지표)
- **타겟 독자층**: 장르 기반 독자층 자동 분류
- **핵심 매력 포인트**: 작품의 차별화된 강점 추출
- **강점/약점 분석**: 객관적 평가 요소 도출
- **종합 결론**: 투자 가치 및 상업적 잠재력 평가

### 비즈니스 인사이트
```
🌟 추천 점수: 8.5/10
🎯 타겟 독자층: 10-30대 남성 독자층
💎 핵심 매력: 독특한 설정과 세계관, 게임 요소와 현실의 결합
💪 주요 강점: 긍정적 독자 반응, 주요 플랫폼 연재
📈 투자 가치: 높은 상업적 잠재력과 안정적 투자 가치
```

## 🛠 Setup

### Dependencies 설치
```bash
npm install
```

### 필요한 패키지
- `node-fetch`: HTTP 요청
- `cheerio`: HTML 파싱

## ⚠️ 주의사항

1. **Rate Limiting**: 요청 간 2초 딜레이 적용
2. **Robot.txt 준수**: 각 사이트의 robots.txt 정책 확인 필요
3. **Legal Compliance**: 저작권 및 이용약관 준수
4. **Respectful Usage**: 과도한 요청 방지

## 🔧 Customization

### 검색 플랫폼 추가
`platforms` 객체에 새로운 플랫폼 정보 추가:

```javascript
this.platforms = {
  // ... existing platforms
  newPlatform: {
    name: '플랫폼명',
    searchUrl: 'https://example.com/search?q=',
    baseUrl: 'https://example.com'
  }
};
```

### 키워드 추가
관련 키워드나 패턴을 추가하여 추출 정확도 향상:

```javascript
const genres = [
  // ... existing genres
  '새로운장르', '다른장르'
];
```

## 📈 Performance Tips

1. **병렬 처리**: 여러 소스를 동시에 처리하여 속도 향상
2. **캐싱**: 결과를 캐싱하여 중복 요청 방지
3. **선택적 분석**: 관련성이 높은 소스 우선 분석

## 🐛 Troubleshooting

### 일반적인 문제들

1. **네트워크 오류**
   - 인터넷 연결 확인
   - VPN 사용 시 한국 서버 선택

2. **검색 결과 없음**
   - 웹툰 제목 정확성 확인
   - 대체 제목이나 영어 제목 시도

3. **파싱 오류**
   - 사이트 구조 변경으로 인한 셀렉터 업데이트 필요

## 📝 License

MIT License - 상업적/비상업적 사용 가능

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Created for KStoryBridge Platform**
*Connecting Korean Stories with Global Audiences*