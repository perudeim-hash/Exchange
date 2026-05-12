package com.money.flight.service.calculator;

import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.ConnectionType;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class FlightDurationCalculator {
    public Integer createTotalDurationMinutes(FlightRoute route, ConnectionType connectionType, Random random) {
        if (connectionType == ConnectionType.DIRECT) {
            Integer baseDuration = route.getDirectBaseDurationMinutes();
            if (baseDuration == null) {
                return null;
            }
            // 이거 알려줘 왜 이렇게 한건지
            return Math.max(baseDuration + random.nextInt(31) - 15, 60);
        }
        Integer baseDuration = route.getOneStopBaseDurationMinutes();

        if (baseDuration == null) {
            return null;
        }
        return Math.max(baseDuration + random.nextInt(121) - 60, 120);
    }

    public Integer createLayoverDurationMinutes(Random random) {
        int[] layoverMinutes = {90, 120, 150, 180, 210, 240};

        return layoverMinutes[random.nextInt(layoverMinutes.length)];
    }

    public Integer calculateFlightDurationMinutes(Integer totalDurationMinutes, Integer layoverDurationMinutes) {
        if (layoverDurationMinutes == null) {
            return totalDurationMinutes;
        }

        return Math.max(totalDurationMinutes - layoverDurationMinutes, 60);
    }
}
