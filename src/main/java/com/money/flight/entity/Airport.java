package com.money.flight.entity;

import com.money.exchange.entity.Country;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "airport")
public class Airport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 공항 코드
    @Column(nullable = false, unique = true, length = 30)
    private String code;
    // 공항 이름
    @Column(nullable = false, length = 100)
    private String name;
    // 도시 이름
    @Column(nullable = false, length = 50)
    private String cityName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    private Country country;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private Integer displayOrder;


    public Airport(String code,String name, String cityName, Country country, Boolean enabled, Integer displayOrder) {
        this.code = code;
        this.name = name;
        this.cityName = cityName;
        this.country = country;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
    }
}
