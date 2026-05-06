package com.money.flight.repository;

import com.money.flight.entity.Airline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AirlineRepository extends JpaRepository<Airline, Long> {
    Optional<Airline> findByCode(String code);

    // 화면이나 검색 결고에서 사용할 항공사 목록 조회
    List<Airline> findByEnabledTrueOrderByDisplayOrderAsc();
}
