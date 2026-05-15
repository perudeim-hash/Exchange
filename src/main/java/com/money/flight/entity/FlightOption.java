package com.money.flight.entity;

import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "flight_option")
public class FlightOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 노선의 항공원 옵션인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flight_route_id", nullable = false)
    private FlightRoute flightRoute;

    // 어떤 항공사의 항공권
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "airline_id", nullable = false)
    private Airline airline;

    //1회 경유일 때 경유 공항
    // 직행일 경유 null
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layover_airport_id")
    private Airport layoverAirport;

    // 좌석 등급
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SeatClass seatClass;

    // 직항 / 1회 경유
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ConnectionType connectionType;
    //출발 날짜
    @Column(nullable = false)
    private LocalDate departureDate;
    //출발 시간
    @Column(nullable = false)
    private LocalTime departureTime;
    //도착 날짜
    @Column(nullable = false)
    private LocalDate arrivalDate;
    //도착 시간
    @Column(nullable = false)
    private LocalTime arrivalTime;

    //실제 비행 시간 합계
    //직항 : 전체 비행 시간
    // 경유 : 경유지 비행 시간 합계
    @Column(nullable = false)
    private Integer flightDurationMinutes;
    // 총 비행 시간
    private Integer layoverDurationMinutes;
    // 직행 : flightDurationMinutes / 경유 : flightDurationMinutes + layoverDurationMinutes
    @Column(nullable = false)
    private Integer totalDurationMinutes;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Boolean enabled;

    @OneToMany(mappedBy = "flightOption", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("segmentOrder ASC")
    private List<FlightSegment> segments = new ArrayList<>();

    public FlightOption(FlightRoute flightRoute, Airline airline, Airport layoverAirport, SeatClass seatClass, ConnectionType connectionType, LocalDate departureDate, LocalTime departureTime, LocalDate arrivalDate, LocalTime arrivalTime, Integer flightDurationMinutes, Integer layoverDurationMinutes, Integer totalDurationMinutes, BigDecimal price, Boolean enabled) {
        this.flightRoute = flightRoute;
        this.airline = airline;
        this.layoverAirport = layoverAirport;
        this.seatClass = seatClass;
        this.connectionType = connectionType;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.arrivalDate = arrivalDate;
        this.arrivalTime = arrivalTime;
        this.flightDurationMinutes = flightDurationMinutes;
        this.layoverDurationMinutes = layoverDurationMinutes;
        this.totalDurationMinutes = totalDurationMinutes;
        this.price = price;
        this.enabled = enabled;
    }

    public void addSegment(FlightSegment segment) {
        if (segment == null) {
            throw new IllegalArgumentException("항공편 구간은 null 일 수 없습니다.");
        }
         if (segment.getFlightOption() != this) {
            throw new IllegalArgumentException("다른 항공권 옵션에 속한 구간을 추가할 수 없습니다.");
        }
        boolean duplicatedSegmentOrder = this.segments.stream()
                .anyMatch(existingSegment -> existingSegment.getSegmentOrder() == segment.getSegmentOrder());

        if (duplicatedSegmentOrder) {
            throw new IllegalArgumentException("같은 순서의 항공편 구간을 중복 추가할 수 없습니다.");
        }
        this.segments.add(segment);
    }

    public void clearSegments() {
        this.segments.clear();
    }
}
