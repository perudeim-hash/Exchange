package com.money.exchange.config;

import com.money.exchange.entity.Country;
import com.money.exchange.entity.Currency;
import com.money.exchange.repository.CountryRepository;
import com.money.exchange.repository.CurrencyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final CurrencyRepository currencyRepository;
    private final CountryRepository countryRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initCurrencies();
        initCountries();
    }

    private void initCurrencies() {
        saveCurrencyIfNotExists("USD", "미국", "달러", "0000001", "$", 1, true, 1);
        saveCurrencyIfNotExists("JPY", "일본", "엔", "0000002", "¥", 100, true, 2);
        saveCurrencyIfNotExists("EUR", "유로존", "유로", "0000003", "€", 1, true, 3);
        saveCurrencyIfNotExists("CNY", "중국", "위안", "0000053", "¥", 1, true, 4);

        saveCurrencyIfNotExists("GBP", "영국", "파운드", "0000012", "£", 1, true, 5);
        saveCurrencyIfNotExists("AUD", "호주", "달러", "0000017", "$", 1, true, 6);
        saveCurrencyIfNotExists("CAD", "캐나다", "달러", "0000013", "$", 1, true, 7);
        saveCurrencyIfNotExists("CHF", "스위스", "프랑", "0000014", "CHF", 1, true, 8);

        saveCurrencyIfNotExists("HKD", "홍콩", "달러", "0000015", "$", 1, true, 9);
        saveCurrencyIfNotExists("SGD", "싱가포르", "달러", "0000024", "$", 1, true, 10);
        saveCurrencyIfNotExists("THB", "태국", "바트", "0000028", "฿", 1, true, 11);
        saveCurrencyIfNotExists("MYR", "말레이시아", "링깃", "0000025", "RM", 1, true, 12);

        saveCurrencyIfNotExists("IDR", "인도네시아", "루피아", "0000029", "Rp", 100, true, 13);
        saveCurrencyIfNotExists("PHP", "필리핀", "페소", "0000034", "₱", 1, true, 14);
        saveCurrencyIfNotExists("VND", "베트남", "동", "0000035", "₫", 100, true, 15);
        saveCurrencyIfNotExists("TWD", "대만", "달러", "0000031", "NT$", 1, true, 16);

        saveCurrencyIfNotExists("NZD", "뉴질랜드", "달러", "0000026", "$", 1, true, 17);
        saveCurrencyIfNotExists("SEK", "스웨덴", "크로나", "0000016", "kr", 1, true, 18);
        saveCurrencyIfNotExists("NOK", "노르웨이", "크로네", "0000019", "kr", 1, true, 19);
        saveCurrencyIfNotExists("DKK", "덴마크", "크로네", "0000018", "kr", 1, true, 20);

        saveCurrencyIfNotExists("AED", "아랍에미리트", "디르함", "0000023", "د.إ", 1, true, 21);
        saveCurrencyIfNotExists("SAR", "사우디아라비아", "리얄", "0000020", "﷼", 1, true, 22);
        saveCurrencyIfNotExists("KWD", "쿠웨이트", "디나르", "0000021", "KD", 1, true, 23);
        saveCurrencyIfNotExists("BHD", "바레인", "디나르", "0000022", "BD", 1, true, 24);
    }

    private void initCountries(){
        Currency usd = getCurrency("USD");
        Currency jpy = getCurrency("JPY");
        Currency eur = getCurrency("EUR");
        Currency cny = getCurrency("CNY");
        Currency gbp = getCurrency("GBP");
        Currency aud = getCurrency("AUD");
        Currency cad = getCurrency("CAD");
        Currency chf = getCurrency("CHF");
        Currency hkd = getCurrency("HKD");
        Currency sgd = getCurrency("SGD");
        Currency thb = getCurrency("THB");
        Currency myr = getCurrency("MYR");
        Currency idr = getCurrency("IDR");
        Currency php = getCurrency("PHP");
        Currency vnd = getCurrency("VND");
        Currency twd = getCurrency("TWD");
        Currency nzd = getCurrency("NZD");
        Currency sek = getCurrency("SEK");
        Currency nok = getCurrency("NOK");
        Currency dkk = getCurrency("DKK");
        Currency aed = getCurrency("AED");

        saveCountryIfNotExists("US", "미국", "AMERICA", usd, true, 1);
        saveCountryIfNotExists("JP", "일본", "ASIA", jpy, true, 2);
        saveCountryIfNotExists("CN", "중국", "ASIA", cny, true, 3);

        // 유로 사용 주요 여행 국가
        saveCountryIfNotExists("FR", "프랑스", "EUROPE", eur, true, 4);
        saveCountryIfNotExists("DE", "독일", "EUROPE", eur, true, 5);
        saveCountryIfNotExists("IT", "이탈리아", "EUROPE", eur, true, 6);
        saveCountryIfNotExists("ES", "스페인", "EUROPE", eur, true, 7);
        saveCountryIfNotExists("NL", "네덜란드", "EUROPE", eur, true, 8);
        saveCountryIfNotExists("PT", "포르투갈", "EUROPE", eur, true, 9);
        saveCountryIfNotExists("AT", "오스트리아", "EUROPE", eur, true, 10);
        saveCountryIfNotExists("GR", "그리스", "EUROPE", eur, true, 11);

        // 유럽이지만 EUR가 아닌 국가
        saveCountryIfNotExists("GB", "영국", "EUROPE", gbp, true, 12);
        saveCountryIfNotExists("CH", "스위스", "EUROPE", chf, true, 13);
        saveCountryIfNotExists("SE", "스웨덴", "EUROPE", sek, true, 14);
        saveCountryIfNotExists("NO", "노르웨이", "EUROPE", nok, true, 15);
        saveCountryIfNotExists("DK", "덴마크", "EUROPE", dkk, true, 16);

        // 아시아/오세아니아 주요 여행지
        saveCountryIfNotExists("HK", "홍콩", "ASIA", hkd, true, 17);
        saveCountryIfNotExists("SG", "싱가포르", "ASIA", sgd, true, 18);
        saveCountryIfNotExists("TH", "태국", "ASIA", thb, true, 19);
        saveCountryIfNotExists("MY", "말레이시아", "ASIA", myr, true, 20);
        saveCountryIfNotExists("ID", "인도네시아", "ASIA", idr, true, 21);
        saveCountryIfNotExists("PH", "필리핀", "ASIA", php, true, 22);
        saveCountryIfNotExists("VN", "베트남", "ASIA", vnd, true, 23);
        saveCountryIfNotExists("TW", "대만", "ASIA", twd, true, 24);

        saveCountryIfNotExists("AU", "호주", "OCEANIA", aud, true, 25);
        saveCountryIfNotExists("NZ", "뉴질랜드", "OCEANIA", nzd, true, 26);

        saveCountryIfNotExists("CA", "캐나다", "AMERICA", cad, true, 27);
        saveCountryIfNotExists("AE", "아랍에미리트", "MIDDLE_EAST", aed, true, 28);
    }

    private Currency getCurrency(String code) {
        return currencyRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("통화 정보가 없습니다."));
    }

    private void saveCurrencyIfNotExists(String code, String countryName, String currencyName, String bokItemCode, String symbol, Integer unit, Boolean enabled, Integer displayOrder) {
        if (currencyRepository.findByCode(code).isPresent()) {
            return;
        }

        Currency currency = new Currency(
                code, countryName, currencyName, bokItemCode, symbol, unit, enabled, displayOrder
        );

        currencyRepository.save(currency);
    }

    private void saveCountryIfNotExists(String code, String name, String region, Currency currency, Boolean enabled, Integer displayOrder) {
        if (countryRepository.findByCode(code).isPresent()) {
            return;
        }

        Country country = new Country(
                code, name, region, currency, enabled, displayOrder
        );
        countryRepository.save(country);
    }
}
