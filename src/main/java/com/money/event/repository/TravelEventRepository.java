package com.money.event.repository;

import com.money.event.entity.TravelEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TravelEventRepository extends JpaRepository<TravelEvent, Long> {
    List<TravelEvent> findByRegionAndEnabledTrueOrderByCountryCodeAscCityNameAscMonthAscDisplayOrderAsc(String region);

    List<TravelEvent> findByCountryCodeAndEnabledTrueOrderByCityNameAscMonthAscDisplayOrderAsc(String countryCode);

    List<TravelEvent> findByCountryCodeAndCityNameAndEnabledTrueOrderByMonthAscDisplayOrderAsc(String countryCode, String cityName);

    List<TravelEvent> findByCountryCodeAndCityNameAndMonthAndEnabledTrueOrderByDisplayOrderAsc(String countryCode, String cityName, Integer month);

    long countByRegion(String region);
    long countByCountryCode(String countryCode);
    boolean existsByCountryCodeAndCityNameAndMonthAndEventName(String CountryCode, String cityName, Integer month, String eventName);
    void deleteByRegion(String region);
}
