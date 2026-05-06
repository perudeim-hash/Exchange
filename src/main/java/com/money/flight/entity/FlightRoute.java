package com.money.flight.entity;

import com.money.flight.enums.RouteConnectionPolicy;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "flight_route", uniqueConstraints = {
        @UniqueConstraint(name = "uk_flight_route_origin_destination_airport",
                columnNames = {"origin_airport_id", "destination_airport_id"})})

public class FlightRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //   출발 공항
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_airport_id", nullable = false)
    private Airport originAirport;
    //    도착 공항
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_airport_id", nullable = false)
    private Airport destinationAirport;
    //    직항인지 직항+경유인지 경유만 가능한지
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RouteConnectionPolicy routeConnectionPolicy;
    //직항 최저가
    @Column(precision = 12, scale = 2)
    private BigDecimal directMinPrice;
    //직항 평균가
    @Column(precision = 12, scale = 2)
    private BigDecimal directAvgPrice;
    //직항 최단 소요시간
    private Integer directMinDurationMinutes;
    //직항 평균 소요 시간
    private Integer directAvgDurationMinutes;
    //경유 최저가
    @Column(precision = 12, scale = 2)
    private BigDecimal layoverMinPrice;
    //경유 평균가
    @Column(precision = 12, scale = 2)
    private BigDecimal layoverAvgPrice;
    //경유 최단 소요시간
    private Integer layoverMinDurationMinutes;
    //경유 평균 소요 시간
    private Integer layoverAvgDurationMinutes;

    // 직항 기준 소요시간
    private Integer directBaseDurationMinutes;
    // 1회 경유 기준 총 소요시간
    private Integer oneStopBaseDurationMinutes;

    @Column(nullable = false)
    private Boolean hasDirect;

    @Column(nullable = false)
    private Boolean hasLayover;

    private LocalDateTime statsUpdatedAt;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private Integer displayOrder;

    public FlightRoute(Airport originAirport, Airport destinationAirport, RouteConnectionPolicy routeConnectionPolicy,Integer directBaseDurationMinutes,Integer oneStopBaseDurationMinutes, Boolean enabled, Integer displayOrder) {
        this.originAirport = originAirport;
        this.destinationAirport = destinationAirport;
        this.routeConnectionPolicy = routeConnectionPolicy;
        this.directBaseDurationMinutes = directBaseDurationMinutes;
        this.oneStopBaseDurationMinutes = oneStopBaseDurationMinutes;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
        this.hasDirect = false;
        this.hasLayover = false;
    }

    public void updateStats(BigDecimal directMinPrice, BigDecimal directAvgPrice, Integer directMinDurationMinutes, Integer directAvgDurationMinutes,
                            BigDecimal layoverMinPrice, BigDecimal layoverAvgPrice, Integer layoverMinDurationMinutes, Integer layoverAvgDurationMinutes, Boolean hasDirect, Boolean hasLayover) {
        this.directMinPrice = directMinPrice;
        this.directAvgPrice = directAvgPrice;
        this.directMinDurationMinutes = directMinDurationMinutes;
        this.directAvgDurationMinutes = directAvgDurationMinutes;
        this.layoverMinPrice = layoverMinPrice;
        this.layoverAvgPrice = layoverAvgPrice;
        this.layoverMinDurationMinutes = layoverMinDurationMinutes;
        this.layoverAvgDurationMinutes = layoverAvgDurationMinutes;
        this.hasDirect = hasDirect;
        this.hasLayover = hasLayover;
        this.statsUpdatedAt = LocalDateTime.now();

    }

}
