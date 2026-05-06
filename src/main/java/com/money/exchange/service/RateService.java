package com.money.exchange.service;


import com.money.exchange.dto.CountryRateResponseDto;
import com.money.exchange.dto.TodayRateResponseDto;
import com.money.exchange.entity.Country;
import com.money.exchange.entity.Currency;
import com.money.exchange.entity.RateHistory;
import com.money.exchange.repository.RateHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RateService {


    private final CurrencyService currencyService;
    private final RateHistoryRepository historyRepository;
    private final CountryService countryService;


    public List<TodayRateResponseDto> getTodayRatesForEnabledCurrencies() {
        List<Currency> currencies = currencyService.getEnabledCurrencies();

        return currencies.stream()
                .map(this::toCurrencyRateResponse)
                .toList();
    }

    public List<CountryRateResponseDto> getTodayRatesForEnabledCountries() {
        List<Country> countries = countryService.getEnabledCountries();

        return countries.stream()
                .map(this::toCountryRateResponse)
                .toList();
    }


    private TodayRateResponseDto toCurrencyRateResponse(Currency currency) {
        RateHistory history = findLatestRate(currency);
        return TodayRateResponseDto.from(history);
    }


    private CountryRateResponseDto toCountryRateResponse(Country country) {
        Currency currency = country.getCurrency();
        RateHistory history = findLatestRate(currency);

        return CountryRateResponseDto.from(country, history);
    }


    private RateHistory findLatestRate(Currency currency) {
        return historyRepository.findTopByCurrencyOrderByRateDateDesc(currency)
                .orElseThrow(() -> new IllegalArgumentException(
                        "저장된 환율 데이터가 없습니다." + currency.getCode()
                ));
    }


}
