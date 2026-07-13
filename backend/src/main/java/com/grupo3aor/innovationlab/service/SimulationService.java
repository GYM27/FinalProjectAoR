package com.grupo3aor.innovationlab.service;

import com.grupo3aor.innovationlab.domain.entity.Simulation;
import com.grupo3aor.innovationlab.domain.entity.User;
import com.grupo3aor.innovationlab.domain.entity.ClinicalScenario;
import com.grupo3aor.innovationlab.domain.enums.SimulationStatus;
import com.grupo3aor.innovationlab.dto.SimulationRequest;
import com.grupo3aor.innovationlab.dto.SimulationResponse;
import com.grupo3aor.innovationlab.dto.AlertEventDTO;
import com.grupo3aor.innovationlab.domain.entity.Alert;
import com.grupo3aor.innovationlab.repository.SimulationRepository;
import com.grupo3aor.innovationlab.repository.UserRepository;
import com.grupo3aor.innovationlab.repository.ClinicalScenarioRepository;
import com.grupo3aor.innovationlab.repository.PhysiologicalReadingRepository;
import com.grupo3aor.innovationlab.repository.AlertRepository;
import com.grupo3aor.innovationlab.domain.entity.PhysiologicalReading;
import com.grupo3aor.innovationlab.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Collections;
import java.util.ArrayList;

/**
 * Here is where we manage the core simulation lifecycle.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    public static final long NANOS_PER_SECOND = 1_000_000_000L;
    
    // Extracted Magic Strings
    private static final String UNKNOWN_SCENARIO = "Unknown Scenario";
    private static final String UNKNOWN_USER = "Unknown User";
    private static final String STATUS_CRITICAL = "critical";
    private static final String STATUS_WARNING = "warning";
    private static final String STATUS_SUCCESS = "success";

    private final SimulationRepository simulationRepository;
    private final UserRepository userRepository;
    private final ClinicalScenarioRepository scenarioRepository;
    private final SimulationEngineService simulationEngineService;
    private final RuleEvaluatorService ruleEvaluatorService;
    private final PhysiologicalReadingRepository readingRepository;
    private final AlertRepository alertRepository;
    private final GlobalSettingsService globalSettingsService;

    /**
     * Initializes a new simulation session for a given clinical scenario.
     * <p>This method transitions a simulation into the {@code EM_CURSO} state, timestamps its
     * inception, and notifies the {@link SimulationEngineService} to begin polling telemetry.</p>
     *
     * @param request the payload containing the ID of the target scenario
     * @param userEmail the email of the authenticated operator triggering the start
     * @return a mapped DTO of the newly saved simulation entity
     * @throws org.springframework.web.server.ResponseStatusException if the system is in degraded mode
     * @throws IllegalArgumentException if the operator cannot be found in the system
     * @throws ResourceNotFoundException if the target clinical scenario does not exist
     */
    @Transactional
    public SimulationResponse startSimulation(SimulationRequest request, String userEmail) {
        if (globalSettingsService.isDbFailed()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, 
                    "System in Degraded Mode. Cannot start new simulations.");
        }

        User starter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found in database!"));

        ClinicalScenario scenario = scenarioRepository.findById(request.getScenarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Clinical Scenario not found with ID: " + request.getScenarioId()));

        Simulation sim = Simulation.builder()
                .scenario(scenario)
                .user(starter)
                .status(SimulationStatus.EM_CURSO)
                .startedAt(LocalDateTime.now())
                .build();

        Simulation saved = simulationRepository.save(sim);
        
        // Time to wake up the engine so it starts polling!
        simulationEngineService.incrementActiveSimulations();
        
        return mapToResponse(saved);
    }

    /**
     * Safely ends an ongoing simulation.
     * <p>This transitions the state to {@code FINALIZADA} and timestamps the exact end moment. 
     * It relies on optimistic locking and strict guard clauses to prevent state corruption if a
     * simulation is stopped concurrently.</p>
     *
     * @param simulationId the UUID of the target simulation
     * @param cutOffSeconds the exact duration (in seconds) the simulation ran before being stopped
     * @return the finalized simulation payload
     * @throws ResourceNotFoundException if the simulation ID is invalid
     * @throws IllegalStateException if the simulation is already finalized or canceled
     */
    @Transactional
    public SimulationResponse stopSimulation(UUID simulationId, Double cutOffSeconds) {
        Simulation sim = simulationRepository.findById(simulationId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation not found with ID: " + simulationId));

        // We must protect this block to prevent ending a simulation that is already finalized or canceled!
        log.info("STOP DEBUG: Entering stopSimulation for id={} with current status={}", simulationId, sim.getStatus());
        if (isSimulationTerminated(sim)) {
            log.warn("STOP DEBUG: Simulation {} is already finalized or canceled. Throwing exception.", simulationId);
            throw new IllegalStateException("Simulation is already finalized or canceled.");
        }

        if (cutOffSeconds != null) {
            log.info("STOP DEBUG: cutOffSeconds = {}", cutOffSeconds);
            sim.setSimulatedDurationSeconds(cutOffSeconds);
            LocalDateTime exactBaseTime = sim.getStartedAt();
            if (exactBaseTime != null) {
                log.info("STOP DEBUG: exactBaseTime = {}", exactBaseTime);
                LocalDateTime cutOffAbsolute = exactBaseTime.plusNanos((long)(cutOffSeconds * NANOS_PER_SECOND)).plusSeconds(1);
                readingRepository.bulkDeleteFutureReadings(simulationId, cutOffAbsolute);
                alertRepository.bulkDeleteFutureAlerts(simulationId, cutOffAbsolute);
                alertRepository.clearFutureWarnings(simulationId, cutOffAbsolute);
                alertRepository.clearFutureResolutions(simulationId, cutOffAbsolute);
                log.info("Truncated simulation {} data after {}", simulationId, cutOffAbsolute);
            }
        }

        sim.setStatus(SimulationStatus.FINALIZADA);
        sim.setEndedAt(LocalDateTime.now());

        Simulation saved = simulationRepository.save(sim);
        
        // Let the engine know that one less simulation is active
        simulationEngineService.decrementActiveSimulations();
        ruleEvaluatorService.clearSimulationState(simulationId);
        
        return mapToResponseLightweight(saved);
    }

    /**
     * Grabs the entire simulation execution history.
     */
    @Transactional(readOnly = true)
    public List<SimulationResponse> getHistory(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found in database!"));

        List<Simulation> simulations;
        // RBAC: Standard USERs only see their own history, ADMIN/MANAGER see everything
        if (user.getPerfil() == com.grupo3aor.innovationlab.domain.enums.PerfilEnum.USER) {
            simulations = simulationRepository.findByUserOrReportCreator(user, userEmail);
        } else {
            simulations = simulationRepository.findAll();
        }

        return simulations.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SimulationResponse> getActiveSimulations(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found in database!"));

        List<Simulation> activeSims = simulationRepository.findAllByStatusIn(List.of(
                SimulationStatus.INICIADA, 
                SimulationStatus.EM_CURSO));

        // RBAC: Standard USERs only see their own active simulations
        if (user.getPerfil() == com.grupo3aor.innovationlab.domain.enums.PerfilEnum.USER) {
            activeSims = activeSims.stream()
                    .filter(sim -> sim.getUser().equals(user))
                    .collect(Collectors.toList());
        }

        return activeSims.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cancels an ongoing simulation.
     */
    @Transactional
    public SimulationResponse cancelSimulation(UUID simulationId) {
        Simulation sim = simulationRepository.findById(simulationId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation not found with ID: " + simulationId));

        if (isSimulationTerminated(sim)) {
            throw new IllegalStateException("Simulation is already finalized or canceled.");
        }

        sim.setStatus(SimulationStatus.CANCELADA);
        sim.setEndedAt(LocalDateTime.now());

        Simulation saved = simulationRepository.save(sim);
        
        // Letting the engine know we just canceled one
        simulationEngineService.decrementActiveSimulations();
        ruleEvaluatorService.clearSimulationState(simulationId);
        
        return mapToResponseLightweight(saved);
    }

    /**
     * Pauses an ongoing simulation.
     */
    @Transactional
    public SimulationResponse pauseSimulation(UUID simulationId) {
        Simulation sim = simulationRepository.findById(simulationId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation not found with ID: " + simulationId));

        if (sim.getStatus() != SimulationStatus.EM_CURSO && sim.getStatus() != SimulationStatus.INICIADA) {
            throw new IllegalStateException("Only active simulations can be paused.");
        }

        sim.setStatus(SimulationStatus.PAUSADA);
        Simulation saved = simulationRepository.save(sim);

        // We can tell the engine to stop polling for this specific simulation
        simulationEngineService.decrementActiveSimulations();

        return mapToResponseLightweight(saved);
    }

    /**
     * Resumes a previously paused simulation.
     */
    @Transactional
    public SimulationResponse resumeSimulation(UUID simulationId) {
        Simulation sim = simulationRepository.findById(simulationId)
                .orElseThrow(() -> new ResourceNotFoundException("Simulation not found with ID: " + simulationId));

        if (sim.getStatus() != SimulationStatus.PAUSADA) {
            throw new IllegalStateException("Only paused simulations can be resumed.");
        }

        sim.setStatus(SimulationStatus.EM_CURSO);
        Simulation saved = simulationRepository.save(sim);

        // Simulation is back on track, wake the engine up again
        simulationEngineService.incrementActiveSimulations();

        return mapToResponse(saved);
    }

    // =========================================================
    // HELPER MAPPERS
    // =========================================================
    
    private boolean isSimulationTerminated(Simulation sim) {
        return sim.getStatus() == SimulationStatus.FINALIZADA || sim.getStatus() == SimulationStatus.CANCELADA;
    }

    /**
     * Lightweight mapper that skips the expensive alert query.
     * Used by stop/cancel/pause operations where the frontend discards the events list.
     */
    private SimulationResponse mapToResponseLightweight(Simulation sim) {
        String scenarioName = sim.getScenario() != null ? sim.getScenario().getName() : UNKNOWN_SCENARIO;
        String studentName = sim.getUser() != null ? (sim.getUser().getFirstName() + " " + sim.getUser().getLastName()) : UNKNOWN_USER;

        return SimulationResponse.builder()
                .id(sim.getId())
                .scenarioId(sim.getScenario() != null ? sim.getScenario().getId() : null)
                .scenarioName(scenarioName)
                .userEmail(sim.getUser() != null ? sim.getUser().getEmail() : "Unknown")
                .studentName(studentName)
                .startedAt(sim.getStartedAt())
                .endedAt(sim.getEndedAt())
                .status(sim.getStatus())
                .simulatedDurationSeconds(sim.getSimulatedDurationSeconds())
                .events(Collections.emptyList())
                .build();
    }

    /**
     * Full mapper that loads all alert events. Used by getHistory() where events are needed.
     */
    private SimulationResponse mapToResponse(Simulation sim) {
        String scenarioName = sim.getScenario() != null ? sim.getScenario().getName() : UNKNOWN_SCENARIO;
        String studentName = sim.getUser() != null ? (sim.getUser().getFirstName() + " " + sim.getUser().getLastName()) : UNKNOWN_USER;
        
        List<AlertEventDTO> events = alertRepository.findBySimulation_Id(sim.getId()).stream()
                .flatMap(alert -> {
                    List<AlertEventDTO> subEvents = new ArrayList<>();
                    String ruleName = (alert.getRule() != null && alert.getRule().getName() != null && !alert.getRule().getName().isEmpty())
                            ? alert.getRule().getName()
                            : "Unnamed";
                    boolean isCritical = alert.getRule() != null && 
                                         alert.getRule().getSeverity() != null && 
                                         alert.getRule().getSeverity().name().equalsIgnoreCase("CRITICO");
                    String severityType = isCritical ? STATUS_CRITICAL : STATUS_WARNING;
                    subEvents.add(AlertEventDTO.builder()
                        .timestamp(alert.getTimestamp())
                        .description("Rule " + ruleName + " triggered (" + String.format("%.1f", alert.getValueAtTrigger()) + ")")
                        .type(severityType)
                        .build());
                        
                    if (alert.getWarningAt() != null) {
                        subEvents.add(AlertEventDTO.builder()
                            .timestamp(alert.getWarningAt())
                            .description("Rule " + ruleName + " stabilizing")
                            .type(STATUS_WARNING)
                            .build());
                    }
                    
                    if (alert.getResolvedAt() != null) {
                        subEvents.add(AlertEventDTO.builder()
                            .timestamp(alert.getResolvedAt())
                            .description("Rule " + ruleName + " resolved")
                            .type(STATUS_SUCCESS)
                            .build());
                    }
                    
                    return subEvents.stream();
                })
                .sorted(java.util.Comparator.comparing(AlertEventDTO::getTimestamp))
                .collect(Collectors.toList());

        return SimulationResponse.builder()
                .id(sim.getId())
                .scenarioId(sim.getScenario() != null ? sim.getScenario().getId() : null)
                .scenarioName(scenarioName)
                .userEmail(sim.getUser() != null ? sim.getUser().getEmail() : "Unknown")
                .studentName(studentName)
                .startedAt(sim.getStartedAt())
                .endedAt(sim.getEndedAt())
                .status(sim.getStatus())
                .simulatedDurationSeconds(sim.getSimulatedDurationSeconds())
                .events(events)
                .build();
    }
}
