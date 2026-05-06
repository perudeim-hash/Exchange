package com.money.exchange.service;


import com.money.exchange.entity.Country;
import com.money.exchange.repository.CountryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CountryService {
    private final CountryRepository countryRepository;

    public List<Country> getEnabledCountries() {
        return countryRepository.findByEnabledTrueOrderByDisplayOrderAsc();
    }

    public Country getCountryByCode(String code) {
        return countryRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("지원하지 않는 국가 입니다."));
    }

}
