package com.grupo3aor.innovationlab.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.ArrayList;
import java.util.UUID;


import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupo3aor.innovationlab.dto.AlertDTO;
import com.grupo3aor.innovationlab.dto.MetricDTO;
import com.grupo3aor.innovationlab.dto.PhysiologicalReadingDTO;
import com.grupo3aor.innovationlab.domain.entity.Simulation;
import com.grupo3aor.innovationlab.domain.entity.PhysiologicalReading;
import com.grupo3aor.innovationlab.domain.enums.SimulationStatus;
import com.grupo3aor.innovationlab.repository.SimulationRepository;

/**
 * Background Engine responsible for executing the telemetry loop for all active simulations.
 * <p>This service operates as a daemon, running at a fixed rate (e.g., 1 Hz). It retrieves
 * the mocked physiological payload of each active clinical scenario and pushes the data points
 * to the WebSocket queues and evaluation rules, advancing the simulation clock.</p>
 */
@Slf4j
@RequiredArgsConstructor
@Service
public class SimulationEngineService {

    private final SimulationRepository simulationRepository;
    private final PhysiologicalReadingService physiologicalReadingService;
    private final ObjectMapper objectMapper;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final GlobalSettingsService globalSettingsService;
    private final DataPersistenceComponent dataPersistenceComponent;
    private final RuleEvaluatorService ruleEvaluatorService;

    /**
     * Cache to hold parsed JSON payloads.
     * <p>Avoids the massive performance overhead of invoking ObjectMapper
     * to parse the scenario's telemetry array every single second.</p>
     */
    private final ConcurrentHashMap<UUID, List<MetricDTO>> metricsCache = new ConcurrentHashMap<>();
    
    /**
     * In-memory cache holding all currently active simulations.
     * <p>Used primarily as a fallback during database degraded mode (Fail-Safe),
     * ensuring that ongoing simulations do not crash if the DB goes offline.</p>
     */
    private final ConcurrentHashMap<UUID, Simulation> activeSimulationsCache = new ConcurrentHashMap<>();

    /**
     * Counter to avoid polling the database when no simulations are active.
     */
    private final AtomicInteger activeSimulationsCount = new AtomicInteger(0);

    /**
     * Increments the active simulation counter. 
     * Called by SimulationService when a new simulation starts.
     */
    public void incrementActiveSimulations() {
        activeSimulationsCount.incrementAndGet();
    }

    public void decrementActiveSimulations() {
        if (activeSimulationsCount.get() > 0) {
            activeSimulationsCount.decrementAndGet();
        }
    }

    // Defining these constants to avoid magic strings
    private static final String HEART_RATE = "HeartRate";
    private static final String RESPIRATION_RATE = "RespirationRate";
    private static final String ARTERIAL_PRESSURE_SYSTOLIC = "ArterialPressure_Systolic";
    private static final String ARTERIAL_PRESSURE_DIASTOLIC = "ArterialPressure_Diastolic";

    /**
     * Canceling any simulations left in an active state from a previous server session.
     * Without this, the engine would keep generating readings for orphan simulations indefinitely after a restart.
     */
    @PostConstruct
    @Transactional
    public void cancelOrphanSimulations() {
        List<Simulation> orphans = simulationRepository.findAllByStatusIn(
            List.of(SimulationStatus.INICIADA, SimulationStatus.EM_CURSO)
        );

        if (!orphans.isEmpty()) {
            log.warn("[ENGINE] Found {} orphan simulation(s) from a previous session — cancelling them now.", orphans.size());
            for (Simulation sim : orphans) {
                sim.setStatus(SimulationStatus.CANCELADA);
                sim.setEndedAt(LocalDateTime.now());
                simulationRepository.save(sim);
                log.warn("[ENGINE] Simulation {} marked as CANCELADA.", sim.getId());
            }
        } else {
            log.info("[ENGINE] No orphan simulations found. Clean startup.");
        }
    }

    /**
     * Core loop of the simulation engine.
     * <p>Executes every 1000ms (1 second) to fetch active simulations and push the next
     * available data point in their physiological payload arrays. Employs a short-circuit
     * mechanism to avoid database load when the active counter is zero.</p>
     */
    @Scheduled(fixedRate = 1000)
    public void generateContinuousData() {
        // Short-circuiting here saves database hits if no simulation is active!
        if (activeSimulationsCount.get() == 0) {
            return;
        }

        List<Simulation> simulacoes;
        if (globalSettingsService.isDbFailed()) {
            simulacoes = new ArrayList<>(activeSimulationsCache.values());
        } else {
            simulacoes = simulationRepository.findAllByStatusIn(
                List.of(SimulationStatus.INICIADA, SimulationStatus.EM_CURSO)
            );
            activeSimulationsCache.clear();
            for (Simulation s : simulacoes) {
                if (s != null) {
                    UUID id = s.getId();
                    if (id != null) {
                        activeSimulationsCache.put(id, s);
                    }
                }
            }
        }

        for (Simulation s : simulacoes) {
            processSimulationPlayback(s);
        }
    }

    private void processSimulationPlayback(Simulation sim) {
        String payload = sim.getScenario().getMetricsPayload();
        if (payload == null || payload.isBlank()) {
            log.info("[ENGINE DEBUG] Ignoring BioGears simulation {}", sim.getId());
            return;
        }

        try {
            List<MetricDTO> metrics = getParsedMetrics(sim.getId(), payload);
            if (metrics.isEmpty()) return;

            int currentIndex = sim.getNextMetricIndex();
            if (currentIndex >= metrics.size()) {
                log.info("[ENGINE] Simulation {} reached the end of the JSON file. Marking as FINALIZADA.", sim.getId());
                finalizeSimulation(sim);
                return;
            }

            List<PhysiologicalReadingDTO> batchToInsert = extractDueMetrics(sim, metrics, currentIndex);
            
            if (!batchToInsert.isEmpty()) {
                persistAndEvaluateBatch(sim, batchToInsert);
                updateSimulationProgress(sim, currentIndex + batchToInsert.size());
            }

        } catch (Exception e) {
            log.error("[ENGINE] Failed to parse metrics for Simulation {}", sim.getId(), e);
            finalizeSimulation(sim);
        }
    }

    private List<MetricDTO> getParsedMetrics(UUID simId, String payload) {
        return metricsCache.computeIfAbsent(simId, id -> {
            try {
                return objectMapper.readValue(payload, new TypeReference<List<MetricDTO>>() {});
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    private List<PhysiologicalReadingDTO> extractDueMetrics(Simulation sim, List<MetricDTO> metrics, int currentIndex) {
        long elapsedMillis = Duration.between(sim.getStartedAt(), LocalDateTime.now()).toMillis();
        Instant firstTimestamp = Instant.parse(metrics.get(0).getTimestamp());
        List<PhysiologicalReadingDTO> batchToInsert = new ArrayList<>();

        while (currentIndex < metrics.size()) {
            MetricDTO nextMetric = metrics.get(currentIndex);
            Instant metricInstant = Instant.parse(nextMetric.getTimestamp());
            
            long metricRelativeTimeMillis = Duration.between(firstTimestamp, metricInstant).toMillis();

            if (metricRelativeTimeMillis > elapsedMillis) {
                break;
            }

            PhysiologicalReadingDTO dto = PhysiologicalReadingDTO.builder()
                    .simulationId(sim.getId())
                    .handle(nextMetric.getHandle())
                    .unit(nextMetric.getUnit())
                    .value(nextMetric.getValue())
                    .timestamp(LocalDateTime.ofInstant(metricInstant, ZoneId.systemDefault()))
                    .build();

            batchToInsert.add(dto);
            currentIndex++;
        }
        return batchToInsert;
    }

    private void persistAndEvaluateBatch(Simulation sim, List<PhysiologicalReadingDTO> batchToInsert) {
        if (globalSettingsService.isDbFailed()) {
            List<PhysiologicalReading> entitiesForEvaluation = new ArrayList<>();
            for (PhysiologicalReadingDTO dto : batchToInsert) {
                PhysiologicalReading reading = new PhysiologicalReading();
                reading.setId(UUID.randomUUID());
                reading.setSimulation(sim);
                reading.setHandle(dto.getHandle());
                reading.setUnit(dto.getUnit());
                reading.setValue(dto.getValue());
                reading.setTimestamp(dto.getTimestamp());
                reading.setCreatedBy("engine@innovationlab.com");
                reading.setUpdatedBy("engine@innovationlab.com");
                reading.setOriginIp("127.0.0.1");

                entitiesForEvaluation.add(reading);
                dataPersistenceComponent.queueReading(reading);
                
                dto.setId(reading.getId());
                messagingTemplate.convertAndSend("/topic/simulations/" + sim.getId() + "/readings", dto);
            }
            try {
                ruleEvaluatorService.evaluateReadingsBatch(entitiesForEvaluation);
            } catch (Exception e) {
                log.error("[ENGINE] Failed to evaluate rules in RAM for Simulation {}", sim.getId(), e);
            }
        } else {
            for (PhysiologicalReadingDTO reading : batchToInsert) {
                physiologicalReadingService.createReading(reading, "engine@innovationlab.com", "127.0.0.1");
            }
        }
    }

    private void updateSimulationProgress(Simulation sim, int newIndex) {
        sim.setNextMetricIndex(newIndex);
        if (sim.getStatus() == SimulationStatus.INICIADA) {
            sim.setStatus(SimulationStatus.EM_CURSO);
        }
        
        if (globalSettingsService.isDbFailed()) {
            dataPersistenceComponent.queueSimulation(sim);
        } else {
            simulationRepository.save(sim);
        }
    }

    private void finalizeSimulation(Simulation sim) {
        sim.setStatus(SimulationStatus.FINALIZADA);
        sim.setEndedAt(LocalDateTime.now());
        
        if (globalSettingsService.isDbFailed()) {
            dataPersistenceComponent.queueSimulation(sim);
        } else {
            simulationRepository.save(sim);
        }
        
        decrementActiveSimulations();
        UUID simId = sim.getId();
        if (simId != null) {
            metricsCache.remove(simId);
            
            try {
                AlertDTO finishAlert = new AlertDTO();
                finishAlert.setTimestamp(LocalDateTime.now());
                finishAlert.setSeverity("INFO");
                finishAlert.setSystemName("[SYSTEM_END_SIMULATION]");
                finishAlert.setValueAtTrigger(0.0);
                finishAlert.setSimulationId(simId);
                messagingTemplate.convertAndSend("/topic/simulations/" + simId + "/alerts", finishAlert);
            } catch (Exception e) {
                log.warn("Failed to broadcast end of simulation for {}", simId, e);
            }
        }
    }
}
