package com.money.event.service;

import com.money.event.dto.TravelEventCsvRowDto;
import com.money.event.entity.TravelEvent;
import com.money.event.enums.EventRegion;
import com.money.event.repository.TravelEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TravelEventSeedService {
    private final TravelEventRepository travelEventRepository;

    @Transactional
    public int reloadEvents(EventRegion region) {
        List<TravelEvent> events = readEventsFromCsv(region.getCsvPath());

        travelEventRepository.deleteByRegion(region.getCode());
        travelEventRepository.saveAll(events);
        return events.size();
    }

    @Transactional
    public int reloadAllEvents() {
        int totalCount = 0;

        for (EventRegion region : EventRegion.values()) {
            Resource resource = new ClassPathResource(region.getCsvPath());
            if (!resource.exists()) {
                continue;
            }
            totalCount += reloadEvents(region);
        }
        return totalCount;
    }

    @Transactional(readOnly = true)
    public long countEvents(EventRegion region) {
        return travelEventRepository.countByRegion(region.getCode());
    }

    private List<TravelEvent> readEventsFromCsv(String csvPath) {
        Resource resource = new ClassPathResource(csvPath);
        if (!resource.exists()) {
            throw new IllegalArgumentException("이벤트 CSV 파일을 찾을 수 없습니다.");
        }
        List<TravelEvent> events = new ArrayList<>();

        try (BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int rowNumber = 0;
            boolean headerSkipped = false;

            while ((line = bufferedReader.readLine()) != null) {
                rowNumber++;
                if (!headerSkipped) {
                    headerSkipped = true;
                    continue;
                }
                if (line.isBlank()) {
                    continue;
                }

                String[] columns = parseCsvLine(line);
                TravelEventCsvRowDto rowDto = TravelEventCsvRowDto.from(columns, rowNumber);
                events.add(rowDto.toEntity());
            }
            return events;
        } catch (IOException e) {
            throw new IllegalArgumentException("이벤트 CSV 파일을 읽는 중 오류가 발생 햇다. path = " + csvPath, e);
        }
    }

    private String[] parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char currentChar = line.charAt(i);
            if (currentChar == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (currentChar == ',' && !inQuotes) {
                result.add(current.toString().trim());
                current.setLength(0);
            } else {
                current.append(currentChar);
            }
        }
        result.add(current.toString().trim());
        return result.toArray(new String[0]);
    }


}
