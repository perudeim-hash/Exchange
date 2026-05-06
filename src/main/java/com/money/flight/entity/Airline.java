package com.money.flight.entity;

import com.money.flight.enums.AirlineTier;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Getter
@Table(name = "airline")
public class Airline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 항공사 code
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 20)
    private String name;

    // Enumerated <-- DB에 저장할때 숫자(0,1,2)로 저장하지 않고 ENUM의
    // 컬럼에 있는 값(PREMIUM) <- 이런 식으로 저장한다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AirlineTier tier;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private Integer displayOrder;

    public Airline(String code, String name, AirlineTier tier, Boolean enabled, Integer displayOrder) {
        this.code = code;
        this.name = name;
        this.tier = tier;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
    }
}

