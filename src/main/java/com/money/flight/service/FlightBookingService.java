package com.money.flight.service;

import com.money.flight.dto.FlightOptionResponseDto;
import com.money.flight.dto.PassengerFareDto;
import com.money.flight.dto.RoundTripBookingResponseDto;
import com.money.flight.entity.FlightOption;
import com.money.flight.repository.FlightOptionRepository;
import com.money.flight.service.calculator.FlightFareCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FlightBookingService {

    private final FlightOptionRepository flightOptionRepository;
    private final FlightFareCalculator flightFareCalculator;

    @Transactional(readOnly = true)
    public RoundTripBookingResponseDto getRoundTripBookingDetail(Long outboundOptionId, Long returnOptionId, int adultCount, int childCount, int infantCount) {
        validateOptionIds(outboundOptionId,returnOptionId);
        flightFareCalculator.validatePassengerCounts(adultCount, childCount, infantCount);
        FlightOption outboundOption = getFlightOptionOrThrow(outboundOptionId);
        FlightOption returnOption = getFlightOptionOrThrow(returnOptionId);

        validateRoundTripDirection(outboundOption, returnOption);

        PassengerFareDto outboundPassengerFare = flightFareCalculator.calculate(outboundOption.getPrice(), adultCount, childCount, infantCount);
        PassengerFareDto returnPassengerFare = flightFareCalculator.calculate(returnOption.getPrice(), adultCount, childCount, infantCount);

        FlightOptionResponseDto outboundOptionDto = FlightOptionResponseDto.from(outboundOption, outboundPassengerFare);
        FlightOptionResponseDto returnOptionDto = FlightOptionResponseDto.from(returnOption, returnPassengerFare);

        return RoundTripBookingResponseDto.of(outboundOptionDto, returnOptionDto, adultCount, childCount, infantCount);
    }



    private void validateOptionIds(Long outboundOptionId, Long returnOptionId) {
        if (outboundOptionId == null) {
            throw new IllegalArgumentException("가는 편 항공권 옵션 ID는 필수 입니다.");
        }
        if (returnOptionId == null) {
            throw new IllegalArgumentException("오는 편 항공권 옵션 ID는 필수 입니다.");
        }
        if (outboundOptionId.equals(returnOptionId)) {
            throw new IllegalArgumentException("가는 편과 오는 편은 같은 항공권일 수 없습니다.");
        }

    }

    private FlightOption getFlightOptionOrThrow(Long optionId) {
        if (optionId == null) {
            throw new IllegalArgumentException("항공권 옵션 ID는 필수입니다.");
        }
        return flightOptionRepository.findDetailById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("항공권 옵션이 존재하지 않습니다. optionId =" + optionId));
    }

    private void validateRoundTripDirection(FlightOption outboundOption, FlightOption returnOption) {
        String outboundOriginCode = outboundOption.getFlightRoute().getOriginAirport().getCode();
        String outboundDestinationCode = outboundOption.getFlightRoute().getDestinationAirport().getCode();

        String returnOriginCode = returnOption.getFlightRoute().getOriginAirport().getCode();
        String returnDestinationCode = returnOption.getFlightRoute().getDestinationAirport().getCode();

        boolean validRoundTrip = outboundOriginCode.equalsIgnoreCase(returnDestinationCode)
                && outboundDestinationCode.equalsIgnoreCase(returnOriginCode);

        if (!validRoundTrip){
            throw new IllegalArgumentException("왕복 항공권의 가는 편/오는 편 방향이 올바르지 않습니다. " +
                    "outbound= " + outboundOriginCode + " -> " + outboundDestinationCode +
                    "return= " + returnOriginCode + " -> " + returnDestinationCode);
        }
    }
}
