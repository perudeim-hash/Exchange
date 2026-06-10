package com.money.payment.service;

import com.money.payment.dto.ReservationCreateRequestDto;
import com.money.payment.entity.Reservation;
import com.money.payment.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    public Reservation createReservation(ReservationCreateRequestDto request) {
        validateCreateRequest(request);
        String reservationNumber = createReservationNumber();
        Reservation reservation = Reservation.create(
                reservationNumber,
                request.getOutboundFlightOptionId(),
                request.getReturnFlightOptionId(),
                normalizeUpper(request.getOriginAirportCode()),
                requireText(request.getOriginAirportName(), "출발 공항 이름은 필수 입니다."),
                requireText(request.getOriginCityName(), "출발 도시는 필수 입니다."),
                normalizeUpper(request.getDestinationAirportCode()),
                requireText(request.getDestinationAirportName(), "도착 공항 이름은 필수 입니다."),
                requireText(request.getDestinationCityName(), "도착 도시는 필수 입니다."),
                request.getDepartureDate(),
                request.getReturnDate(),
                request.getAdultCount(),
                request.getChildCount(),
                request.getInfantCount(),
                request.getTotalAmount(),
                requireText(request.getCustomerName(), "예약자 이름은 필수입니다."),
                requireText(request.getCustomerEmail(), "예약자 이메일은 필수입니다."),
                requireText(request.getCustomerPhone(), "예약자 전화번호는 필수입니다.")
        );
        return reservationRepository.save(reservation);
    }

    @Transactional(readOnly = true)
    public Reservation getReservation(Long reservationId) {
        if (reservationId == null) {
            throw new IllegalArgumentException("예약 ID는 필수입니다.");
        }
        return reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다. " + reservationId));
    }

    @Transactional(readOnly = true)
    public Reservation getReservationByReservationNumber(String reservationNumber) {
        String normalizedReservationNumber = requireText(reservationNumber, "예약 번호는 필수입니다.");
        return reservationRepository.findByReservationNumber(normalizedReservationNumber)
                .orElseThrow(() -> new IllegalArgumentException("예약을 찾을 수 없습니다." + normalizedReservationNumber));
    }

    public Reservation completeReservation(String reservationNumber) {
        Reservation reservation = getReservationByReservationNumber(reservationNumber);
        reservation.completeReservation();
        return reservation;
    }

    public Reservation cancelReservation(Long reservationId) {
        Reservation reservation = getReservation(reservationId);
        reservation.cancel();
        return reservation;
    }

    private void validateCreateRequest(ReservationCreateRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("예약 요청 정보가 없습니다.");
        }

        if (request.getOutboundFlightOptionId() == null) {
            throw new IllegalArgumentException("출국 항공권 ID는 필수입니다.");
        }

        if (request.getReturnFlightOptionId() == null) {
            throw new IllegalArgumentException("귀국 항공권 ID는 필수입니다.");
        }

        if (request.getDepartureDate() == null) {
            throw new IllegalArgumentException("출발일은 필수입니다.");
        }
        if (request.getReturnDate() == null) {
            throw new IllegalArgumentException("귀국일은 필수입니다.");
        }
        if (request.getReturnDate().isBefore(request.getDepartureDate())) {
            throw new IllegalArgumentException("귀국일이 출발일보다 빠를 수 없습니다.");
        }
        validatePassengerCount(request.getAdultCount(), request.getChildCount(), request.getInfantCount());
        if (request.getTotalAmount() == null || request.getTotalAmount() <= 0) {
            throw new IllegalArgumentException("결제 금액은 0원보다 커야 합니다.");
        }
    }

    private void validatePassengerCount(int adultCount, int childCount, int infantCount) {
        if (adultCount < 1) {
            throw new IllegalArgumentException("성인은 최소 1명 이상이어야 합니다.");
        }

        if (childCount < 0 || infantCount < 0) {
            throw new IllegalArgumentException("소아/유아 인원을 올바르게 입력해 주세요.");
        }

        int totalPassengerCount = adultCount + childCount + infantCount;
        if (totalPassengerCount > 9) {
            throw new IllegalArgumentException("총 탑승객은 최대 9명까지 가능합니다.");
        }

        if (infantCount > adultCount) {
            throw new IllegalArgumentException("유아 수는 성인 수보다 많을 수 없습니다.");
        }
    }

    private String createReservationNumber() {
        String prefix = "RSV";
        String datePart = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int i = 0; i < 10; i++) {
            String randomPart = String.format("%06d", RANDOM.nextInt(1_000_000));
            String reservationNumber = prefix + "-" + datePart + "-" + randomPart;
            if (!reservationRepository.existsByReservationNumber(reservationNumber)) {
                return reservationNumber;
            }
        }
        String fallback = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
        return prefix + "-" + fallback;
    }

    private String normalizeUpper(String value) {
        return requireText(value, "코드는 필수입니다.").trim().toUpperCase();
    }

    private String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return value.trim();
    }

}

