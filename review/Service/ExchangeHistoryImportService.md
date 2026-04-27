
    private final CurrencyService currencyService;
    private final ExchangeRateHistoryRepository historyRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    private final String API_Key = "내 인증키";

1. 의존성 주입
   CurrencyService
    → USD 통화 정보를 DB에서 찾기 위해 사용
    ExchangeRateHistoryRepository
    → 과거 환율 데이터를 저장하기 위해 사용
2. RestTemplate -> Java/Spring에서 외부 API를 호출할때 사용한다.
   Java 코드로 URL에 요청을 보낸다.


    @Transactional
    public void importUsdHistory() {

1. Transactional -> 이 메서드 안에서 DB 저장 작업을 하나의 작업 단위로 묶는다.
    - 저장하다 중간에 오류가 발생할 경우 전체 롤백이 가능하다. 저장용은 트랜잭셔널 조회용은 트랜잭셔널 리드 온리

    
        Currency currency = currencyService.getCurrencyByCode("USD");

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusYears(1);

        String start = startDate.toString().replace("-", "");
        String end = endDate.toString().replace("-", "");

        String url = "https://ecos.bok.or.kr/api/StatisticSearch/"
                + API_Key + "/json/kr/1/1000/731Y001/D/"
                + start + "/" + end + "/0000001";

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);

        Map<String, Object> body = (Map<String, Object>) response.get("StatisticSearch");

        List<Map<String, String>> rows = (List<Map<String, String>>) body.get("row");

        String rateStr = null;
        for (Map<String, String> row : rows) {
            String dateStr = row.get("TIME");
            rateStr = row.get("DATA_VALUE");

            LocalDate date = LocalDate.parse(
                    dateStr.substring(0, 4) + "_" +
                            dateStr.substring(4, 6) + "_" +
                            dateStr.substring(6, 8)
            );


            BigDecimal rate = new BigDecimal(rateStr);
            boolean exists = historyRepository.existsByCurrencyAndRateDate(
                    currency, date);

            if (!exists) {
                ExchangeRateHistory history = new ExchangeRateHistory(
                        currency, date, rate, "BOK"
                );

                historyRepository.save(history);
            }
        }
    }



메서드 내부 흐름
1. USD 통화 조회
   Currency currency = currencyService.getCurrencyByCode("USD");

DB에 저장된 USD Currency를 가져오는 코드야.

왜 필요하냐면 ExchangeRateHistory가 이렇게 생겼잖아.

private Currency currency;
private LocalDate rateDate;
private BigDecimal rate;

즉, 과거 환율 기록은 단순히 "USD" 문자열만 저장하는 게 아니라
Currency Entity와 연결해서 저장하는 구조야.

2. 날짜 범위 만들기
   LocalDate endDate = LocalDate.now();
   LocalDate startDate = endDate.minusYears(1);

오늘 기준으로 1년 전부터 오늘까지 조회하겠다는 뜻이야.

예를 들어 오늘이 2026-04-27이면:

startDate = 2025-04-27
endDate = 2026-04-27
3. 날짜 형식 변환
   String start = startDate.toString().replace("-", "");
   String end = endDate.toString().replace("-", "");

LocalDate는 기본적으로 이런 형태야.

2026-04-27

근데 한국은행 API는 보통 이런 형태를 원해.

20260427

그래서 -를 제거하는 거야.

4. API URL 만들기
   String url = "https://ecos.bok.or.kr/api/StatisticSearch/"
   + API_KEY
   + "/json/kr/1/1000/731Y001/D/"
   + start + "/" + end + "/0000001";

이건 한국은행 API 요청 주소를 만드는 부분이야.

대충 나누면:

API_KEY        = 인증키
json           = JSON으로 받겠다
kr             = 한글 응답
1/1000         = 1번째부터 1000번째 데이터까지
731Y001        = 환율 통계 코드
D              = 일별 데이터
start/end      = 조회 기간
0000001        = USD 항목 코드

즉:

USD의 일별 환율을 1년치 가져와라

라는 요청이야.

5. API 호출
   Map<String, Object> response = restTemplate.getForObject(url, Map.class);

응답 JSON을 일단 Map으로 받는 거야.

처음엔 DTO를 엄청 정확히 만들기보다,
Map으로 구조를 확인하면서 필요한 값만 꺼내는 방식이 이해하기 쉬워.

6. 응답에서 row 꺼내기
   Map<String, Object> body = (Map<String, Object>) response.get("StatisticSearch");
   List<Map<String, String>> rows = (List<Map<String, String>>) body.get("row");

한국은행 응답이 대충 이런 구조라고 보면 돼.

{
"StatisticSearch": {
"row": [
{
"TIME": "20250428",
"DATA_VALUE": "1380.5"
},
{
"TIME": "20250429",
"DATA_VALUE": "1378.2"
}
]
}
}

그래서 먼저 "StatisticSearch"를 꺼내고,
그 안에서 "row" 리스트를 꺼내는 거야.

7. 반복문
   for (Map<String, String> row : rows) {

rows 안에는 날짜별 환율 데이터가 여러 개 들어있어.

예:

2025-04-28 / 1380.5
2025-04-29 / 1378.2
2025-04-30 / 1382.0

이걸 하나씩 꺼내서 DB에 저장하는 거야.

8. 날짜와 환율 꺼내기
   String dateStr = row.get("TIME");
   String rateStr = row.get("DATA_VALUE");

TIME은 날짜.

20250428

DATA_VALUE는 환율.

1380.5
9. LocalDate 변환
   LocalDate date = LocalDate.parse(
   dateStr.substring(0, 4) + "-" +
   dateStr.substring(4, 6) + "-" +
   dateStr.substring(6, 8)
   );

이건:

20250428

을

2025-04-28

로 바꿔서 LocalDate로 만드는 코드야.

조금 길어 보이지만 하는 일은 단순해.

dateStr.substring(0, 4) // 2025
dateStr.substring(4, 6) // 04
dateStr.substring(6, 8) // 28
10. BigDecimal 변환
    BigDecimal rate = new BigDecimal(rateStr);

환율은 돈/금액과 관련된 값이니까 double보다 BigDecimal이 좋아.

double은 소수점 계산에서 오차가 생길 수 있어서,
돈이나 환율처럼 정확도가 중요한 값은 BigDecimal을 많이 써.

11. 중복 체크
    boolean exists = historyRepository.existsByCurrencyAndRateDate(currency, date);

이미 DB에 이 날짜의 USD 환율이 있는지 확인하는 거야.

예를 들어 이미:

USD / 2025-04-28

이 있으면 다시 저장하지 않으려고.

12. Entity 생성 후 저장
    if (!exists) {
    ExchangeRateHistory history = new ExchangeRateHistory(
    currency,
    date,
    rate,
    "BOK"
    );

    historyRepository.save(history);
    }

없으면 새로 만들어서 저장.

Currency = USD
rateDate = 2025-04-28
rate = 1380.5
source = BOK
지금 코드의 아쉬운 점
1. API 키가 코드에 박혀 있음

최종적으로는 application.properties로 빼자.

@Value("${exchange.bok-api-key}")
private String apiKey;
2. RestTemplate을 직접 new 하고 있음
   private final RestTemplate restTemplate = new RestTemplate();

학습 단계에서는 괜찮아.
나중에는 Bean으로 등록해서 주입받는 방식이 더 좋아.

3. 응답이 없을 때 에러 처리 없음

API 키가 틀리거나 데이터가 없으면 여기서 터질 수 있어.

response.get("StatisticSearch")

나중에는 null 체크를 넣어야 해.

4. USD만 가능함

현재는 메서드 이름도:

importUsdHistory()

이고 코드도:

"USD"
"0000001"

로 고정되어 있어.

처음 테스트로는 좋고, 나중에는 이렇게 확장하면 돼.

importHistory(String currencyCode)
지금 단계에서는 괜찮냐?

응. 지금 단계에서는 괜찮아.

지금 목표는:

한국은행 API 호출이 되는지
USD 1년치가 DB에 저장되는지
중복 없이 저장되는지

이걸 확인하는 거라서, 지금 코드는 학습용 1차 구현으로 충분해.

지금 기억할 핵심

이 서비스의 핵심 문장 하나만 기억하면 돼.

ExchangeHistoryImportService는 외부 API의 과거 환율 데이터를 우리 DB에 적재하는 서비스다.

조회 서비스는:

ExchangeHistoryService

저장/수집 서비스는:

ExchangeHistoryImportService

이렇게 나눴다고 보면 돼.