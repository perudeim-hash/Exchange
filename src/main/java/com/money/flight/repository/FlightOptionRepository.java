package com.money.flight.repository;

import com.money.flight.entity.FlightOption;
import com.money.flight.entity.FlightRoute;
import com.money.flight.enums.ConnectionType;
import com.money.flight.enums.SeatClass;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FlightOptionRepository extends JpaRepository<FlightOption, Long> {

    boolean existsByFlightRouteAndDepartureDate(FlightRoute flightRoute, LocalDate localDate);

    long deleteByDepartureDateBefore(LocalDate date);

    List<FlightOption> findByFlightRouteAndDepartureDateBetweenAndEnabledTrue(FlightRoute flightRoute, LocalDate startDate, LocalDate endDate);

    List<FlightOption> findByDepartureDateBetweenAndEnabledTrueOrderByDepartureDateAsc(LocalDate startDate, LocalDate endDate);

    List<FlightOption> findByFlightRouteAndEnabledTrueOrderByPriceAsc(FlightRoute flightRoute);

    List<FlightOption> findByFlightRouteAndDepartureDateAndEnabledTrueOrderByPrice(FlightRoute flightRoute, LocalDate localDate);

    List<FlightOption> findByFlightRouteAndConnectionTypeAndEnabledTrueOrderByPrice(FlightRoute flightRoute, ConnectionType connectionType);

    @Query("""
            select fo.flightRoute.id as routeId,
            fo.departureDate as departureDate
            from FlightOption fo
            where fo.departureDate between :startDate and :endDate
            group by fo.flightRoute.id, fo.departureDate 
            """)
    List<RouteDateProjection> findExistingRouteDatesBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("""
            select distinct fo from FlightOption fo 
            join fetch fo.flightRoute fr
            join fetch fr.originAirport oa 
            join fetch fr.destinationAirport da
            join fetch fo.airline a 
            left join fetch fo.layoverAirport la
            left join fetch fo.segments fs
            left join fetch fs.originAirport soa
            left join fetch fs.destinationAirport sda
            where oa.code = :originCode and da.code = :destinationCode
            and fo.departureDate = :departureDate and fo.enabled = true
            and (:connectionType is null or fo.connectionType = :connectionType)
            and (:seatClass is null or fo.seatClass = :seatClass)
            """)
    List<FlightOption> searchFlightOptions(@Param("originCode") String originCode, @Param("destinationCode") String destinationCode, @Param("departureDate") LocalDate departureDate, @Param("connectionType") ConnectionType connectionType, @Param("seatClass") SeatClass seatClass);

    @Query("""
            select fo.id from FlightOption fo
            where not exists (
            select 1 from FlightSegment fs
            where fs.flightOption = fo
            )
            order by fo.id asc
            """)
    List<Long> findIdsWithoutSegments(Pageable pageable);

    @Query("""
            select distinct fo from FlightOption fo
            join fetch fo.flightRoute fr 
            join fetch fr.originAirport
            join fetch fr.destinationAirport da
            left join fetch fo.layoverAirport la
            where fo.id in :ids
            """)
    List<FlightOption> findAllWithRouteAndAirportsByIdIn(@Param("ids") List<Long> ids);

    @Query("""
            select distinct fo
            from FlightOption fo
            join fetch fo.flightRoute fr
            join fetch fr.originAirport oa
            join fetch fr.destinationAirport da
            join fetch fo.airline a
            left join fetch fo.layoverAirport la
            left join fetch fo.segments fs
            left join fetch fs.originAirport soa
            left join fetch fs.destinationAirport sda
            where fo.id = :optionId
            """)
    Optional<FlightOption> findDetailById(@Param("optionId") Long optionId);

    @Query("""
            select fo
            from FlightOption fo
            join fetch fo.flightRoute fr
            join fetch fr.originAirport oa
            join fetch fr.destinationAirport da
            where oa.code = :originCode
            and da.code = :destinationCode
            and fo.departureDate between :startDate and :endDate
            and fo.enabled = true
            and (:connectionType is null or fo.connectionType = :connectionTpe)
            and (:seatClass is null or fo.seatClass = :seatClass)
            order by fo.departureDate asc, fo.price asc
            """)
    List<FlightOption> findOptionsForPriceAnalysis(@Param("originCode") String originCode,
                                                   @Param("destinationCode") String destinationCode,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate,
                                                   @Param("connectionType") ConnectionType connectionType,
                                                   @Param("seatClass") SeatClass seatClass);

    interface RouteDateProjection{
            Long getRouteId();
            LocalDate getDepartureDate();
    }



}
