package com.money.flight.repository;

import com.money.flight.entity.FlightSegment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlightSegmentRepository extends JpaRepository<FlightSegment, Long> {
    List<FlightSegment> findByFlightOptionIdOrderBySegmentOrderAsc(Long flightOptionId);

    long deleteByFlightOptionId(Long flightOptionId);
}
