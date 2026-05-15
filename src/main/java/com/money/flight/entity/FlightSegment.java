package com.money.flight.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "flight_segment")
public class FlightSegment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_option_id", nullable = false)
    private FlightOption flightOption;

    @Column(nullable = false)
    private int segmentOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_airport_id", nullable = false)
    private Airport originAirport;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_airport_id", nullable = false)
    private Airport destinationAirport;

    @Column(nullable = false)
    private LocalDate departureDate;

    @Column(nullable = false)
    private LocalTime departureTime;

    @Column(nullable = false)
    private LocalDate arrivalDate;

    @Column(nullable = false)
    private LocalTime arrivalTime;
    /**
     * 이 구간의 실제 비행 시간
     * 예: ICN → LAX 660분
     */
    @Column(nullable = false)
    private int durationMinutes;
    /**
     * 이 구간 도착 후 다음 구간까지의 대기 시간
     * 마지막 구간이면 null
     * <p>
     * 예:
     * Segment 1: ICN → LAX, layoverAfterMinutes = 130
     * Segment 2: LAX → JFK, layoverAfterMinutes = null
     */
    private Integer layoverAfterMinutes;

    private FlightSegment(FlightOption flightOption, int segmentOrder, Airport originAirport, Airport destinationAirport, LocalDate departureDate, LocalTime departureTime, LocalDate arrivalDate, LocalTime arrivalTime, int durationMinutes, Integer layoverAfterMinutes) {
        validateSegment(flightOption, segmentOrder, originAirport, destinationAirport, departureDate, departureTime, arrivalDate, arrivalTime, durationMinutes);

        this.flightOption = flightOption;
        this.segmentOrder = segmentOrder;
        this.originAirport = originAirport;
        this.destinationAirport = destinationAirport;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.arrivalDate = arrivalDate;
        this.arrivalTime = arrivalTime;
        this.durationMinutes = durationMinutes;
        this.layoverAfterMinutes = layoverAfterMinutes;
    }


    public static FlightSegment create(FlightOption flightOption, int segmentOrder, Airport originAirport, Airport destinationAirport, LocalDate departureDate, LocalTime departureTime, LocalDate arrivalDate, LocalTime arrivalTime, int durationMinutes, Integer layoverAfterMinutes) {
        return new FlightSegment(flightOption, segmentOrder, originAirport, destinationAirport, departureDate, departureTime, arrivalDate, arrivalTime, durationMinutes, layoverAfterMinutes);
    }

    private void validateSegment(FlightOption flightOption, int segmentOrder, Airport originAirport, Airport destinationAirport, LocalDate departureDate, LocalTime departureTime, LocalDate arrivalDate, LocalTime arrivalTime, int durationMinutes) {
        if (flightOption == null) {
            throw new IllegalArgumentException("항공권 옵션은 필수입니다.");
        }
        if (segmentOrder < 1) {
            throw new IllegalArgumentException("구간 순서는 1 이상이어야 합니다.");
        }
        if (originAirport == null) {
            throw new IllegalArgumentException("구간 출발 공항은 필수입니다.");
        }
        if (destinationAirport == null) {
            throw new IllegalArgumentException("구간 도착 공항은 필수입니다.");
        }
        if (originAirport.getCode().equalsIgnoreCase(destinationAirport.getCode())) {
            throw new IllegalArgumentException("구간 출발 공항과 도착 공항은 같은 수 없습니다.");
        }
        if (departureDate == null || departureTime == null) {
            throw new IllegalArgumentException("구간 출발 일시 정보는 필수입니다.");
        }
        if (arrivalDate == null || arrivalTime == null) {
            throw new IllegalArgumentException("구간 도착 일시 정보는 필수입니다.");
        }

        if (durationMinutes <= 0) {
            throw new IllegalArgumentException("구간 비행 시간은 0 보다 커야 합니다.");
        }

    }

}
