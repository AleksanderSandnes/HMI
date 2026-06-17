package controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import entity.DayResponse;
import entity.EnergyRequest;
import entity.LoginRequest;
import entity.MonthResponse;
import entity.TotalDataInvResponse;
import entity.TotalDataResponse;
import entity.YearResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import service.GrowattDataService;

@RestController
@RequestMapping("/api/growatt")
@RequiredArgsConstructor
@Slf4j
@Validated
public class GrowattApiController {

    private final GrowattWebClient growattWebClient;

    private final GrowattDataService growattDataService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> healthStatus = new HashMap<>();
        healthStatus.put("status", "healthy");
        healthStatus.put("service", "growatt-api");
        healthStatus.put("timestamp", LocalDateTime.now().toString());
        healthStatus.put("version", "1.0.0");
        
        log.info("Health check requested");
        return ResponseEntity.ok(healthStatus);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@Valid @RequestBody LoginRequest loginRequest) {
        long startTime = System.currentTimeMillis();
        log.info("=== LOGIN REQUEST START ===");
        log.info("Account: {}", loginRequest.getAccount());
        
        try {
            String result = growattWebClient.login(loginRequest); // Direct login, no JWT needed
            String plantId = growattWebClient.getPlantId();
            long duration = System.currentTimeMillis() - startTime;
            log.info("Login successful in {}ms", duration);
            log.info("PlantId obtained: {}", plantId);
            log.info("Login result length: {} characters", result != null ? result.length() : 0);
            log.info("=== LOGIN REQUEST END ===");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Login failed after {}ms for account: {}", duration, loginRequest.getAccount(), e);
            log.info("=== LOGIN REQUEST END (ERROR) ===");
            throw e;
        }
    }

    @PostMapping("/totalData")
    public ResponseEntity<TotalDataResponse> getTotalData(@Valid @RequestBody EnergyRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("=== TOTAL DATA REQUEST START ===");
        log.info("Request plantId: {}", request.getPlantId());
        log.info("Request date: {}", request.getDate());
        log.info("Current stored plantId: {}", growattWebClient.getPlantId());
        
        try {
            // If no plantId provided in request, try to use the stored one from login
            if (request.getPlantId() == null || request.getPlantId().isEmpty()) {
                String storedPlantId = growattWebClient.getPlantId();
                if (storedPlantId != null) {
                    request.setPlantId(storedPlantId);
                    log.info("Auto-filled plantId from session: {}", storedPlantId);
                } else {
                    log.warn("No plantId in request and no stored plantId from login");
                }
            }
            
            TotalDataResponse response = growattWebClient.getTotalData(request);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("TotalData request successful in {}ms", duration);
            log.info("Response data available: {}", response != null);
            log.info("=== TOTAL DATA REQUEST END ===");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("TotalData request failed after {}ms for plantId: {}, date: {}", 
                     duration, request.getPlantId(), request.getDate(), e);
            log.info("=== TOTAL DATA REQUEST END (ERROR) ===");
            throw e;
        }
    }

    @PostMapping("/dayChart")
    public ResponseEntity<DayResponse> getDayChart(@Valid @RequestBody EnergyRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("=== DAY CHART REQUEST START ===");
        log.info("Request plantId: {}", request.getPlantId());
        log.info("Request date: {}", request.getDate());
        log.info("Current stored plantId: {}", growattWebClient.getPlantId());
        
        try {
            // If no plantId provided in request, try to use the stored one from login
            if (request.getPlantId() == null || request.getPlantId().isEmpty()) {
                String storedPlantId = growattWebClient.getPlantId();
                if (storedPlantId != null) {
                    request.setPlantId(storedPlantId);
                    log.info("Auto-filled plantId from session: {}", storedPlantId);
                } else {
                    log.warn("No plantId in request and no stored plantId from login");
                }
            }
            
            DayResponse response = growattDataService.getDayChart(request);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("DayChart request successful in {}ms", duration);
            log.info("Response data available: {}", response != null);
            log.info("=== DAY CHART REQUEST END ===");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("DayChart request failed after {}ms for plantId: {}, date: {}", 
                     duration, request.getPlantId(), request.getDate(), e);
            log.info("=== DAY CHART REQUEST END (ERROR) ===");
            throw e;
        }
    }

    @PostMapping("/monthChart")
    public ResponseEntity<MonthResponse> getMonthChart(@Valid @RequestBody EnergyRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("=== MONTH CHART REQUEST START ===");
        log.info("Request plantId: {}", request.getPlantId());
        log.info("Request date: {}", request.getDate());
        log.info("Current stored plantId: {}", growattWebClient.getPlantId());
        
        try {
            // If no plantId provided in request, try to use the stored one from login
            if (request.getPlantId() == null || request.getPlantId().isEmpty()) {
                String storedPlantId = growattWebClient.getPlantId();
                if (storedPlantId != null) {
                    request.setPlantId(storedPlantId);
                    log.info("Auto-filled plantId from session: {}", storedPlantId);
                } else {
                    log.warn("No plantId in request and no stored plantId from login");
                }
            }
            
            MonthResponse response = growattDataService.getMonthChart(request);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("MonthChart request successful in {}ms", duration);
            log.info("Response data available: {}", response != null);
            log.info("=== MONTH CHART REQUEST END ===");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("MonthChart request failed after {}ms for plantId: {}, date: {}", 
                     duration, request.getPlantId(), request.getDate(), e);
            log.info("=== MONTH CHART REQUEST END (ERROR) ===");
            throw e;
        }
    }

    @PostMapping("/yearChart")
    public ResponseEntity<YearResponse> getYearChart(@Valid @RequestBody EnergyRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("=== YEAR CHART REQUEST START ===");
        log.info("Request plantId: {}", request.getPlantId());
        log.info("Request date: {}", request.getDate());
        log.info("Current stored plantId: {}", growattWebClient.getPlantId());
        
        try {
            // If no plantId provided in request, try to use the stored one from login
            if (request.getPlantId() == null || request.getPlantId().isEmpty()) {
                String storedPlantId = growattWebClient.getPlantId();
                if (storedPlantId != null) {
                    request.setPlantId(storedPlantId);
                    log.info("Auto-filled plantId from session: {}", storedPlantId);
                } else {
                    log.warn("No plantId in request and no stored plantId from login");
                }
            }
            
            YearResponse response = growattDataService.getYearChart(request);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("YearChart request successful in {}ms", duration);
            log.info("Response data available: {}", response != null);
            log.info("=== YEAR CHART REQUEST END ===");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("YearChart request failed after {}ms for plantId: {}, date: {}", 
                     duration, request.getPlantId(), request.getDate(), e);
            log.info("=== YEAR CHART REQUEST END (ERROR) ===");
            throw e;
        }
    }

    @PostMapping("/invTotalData")
    public ResponseEntity<TotalDataInvResponse> getInvTotalData(@Valid @RequestBody EnergyRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("=== INV TOTAL DATA REQUEST START ===");
        log.info("Request plantId: {}", request.getPlantId());
        log.info("Request date: {}", request.getDate());
        log.info("Current stored plantId: {}", growattWebClient.getPlantId());
        
        try {
            // If no plantId provided in request, try to use the stored one from login
            if (request.getPlantId() == null || request.getPlantId().isEmpty()) {
                String storedPlantId = growattWebClient.getPlantId();
                if (storedPlantId != null) {
                    request.setPlantId(storedPlantId);
                    log.info("Auto-filled plantId from session: {}", storedPlantId);
                } else {
                    log.warn("No plantId in request and no stored plantId from login");
                }
            }
            
            TotalDataInvResponse response = growattWebClient.getInvTotalData(request);
            long duration = System.currentTimeMillis() - startTime;
            
            log.info("InvTotalData request successful in {}ms", duration);
            log.info("Response data available: {}", response != null);
            log.info("=== INV TOTAL DATA REQUEST END ===");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("InvTotalData request failed after {}ms for plantId: {}, date: {}", 
                     duration, request.getPlantId(), request.getDate(), e);
            log.info("=== INV TOTAL DATA REQUEST END (ERROR) ===");
            throw e;
        }
    }
}