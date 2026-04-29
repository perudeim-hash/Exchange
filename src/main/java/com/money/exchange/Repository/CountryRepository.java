package com.money.exchange.Repository;

import com.money.exchange.Entity.Country;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CountryRepository extends JpaRepository<Country, Long> {
    Optional<Country> findByCode(String code);

    List<Country> findByEnabledTrueOrderByDisplayOrderAsc();
}
