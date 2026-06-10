package com.money.payment.repository;

import com.money.payment.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation,Long> {

    Optional<Reservation> findByReservationNumber(String reservationNumber);
    boolean existsByReservationNumber(String reservationNumber);
}
