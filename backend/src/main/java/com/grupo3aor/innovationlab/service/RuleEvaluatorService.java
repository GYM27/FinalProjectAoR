package com.grupo3aor.innovationlab.service;

import org.springframework.stereotype.Service;
import com.grupo3aor.innovationlab.repository.AlertRepository;
import com.grupo3aor.innovationlab.repository.RuleRepository;
import com.grupo3aor.innovationlab.domain.enums.AlertStatus;
import com.grupo3aor.innovationlab.domain.entity.Alert;
import com.grupo3aor.innovationlab.domain.entity.Rule;
import com.grupo3aor.innovationlab.domain.entity.PhysiologicalReading;
import com.grupo3aor.innovationlab.domain.entity.Simulation;
import com.grupo3aor.innovationlab.domain.entity.PhysiologicalSystem;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.annotation.Timed;
import io.micrometer.core.instrument.MeterRegistry;

import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import jakarta.annotation.PostConstruct;

/**
 * Service responsible for dynamically evaluating physiological readings against registered
 * clinical rules. Uses the Domain's rich model to interpret conditions and trigger alerts.
 * 
 * <p>This service is designed to be highly concurrent and can handle thousands of readings 
 * per second. It leverages in-memory caching and thread-safe data structures to maintain
 * performance and track the state of rule evaluation without locking the database.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RuleEvaluatorService {

    private final AlertRepository alertRepository;
    private final RuleRepository ruleRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final MeterRegistry meterRegistry;
    
    // Adding these dependencies for degraded mode support
    private final DataPersistenceComponent dataPersistenceComponent;
    private final GlobalSettingsService globalSettingsService;

    // Adding this cache to serve as fallback when the database fails
    private List<Rule> cachedRules = new ArrayList<>();

    /**
     * Initializes the in-memory cache of active rules on application startup.
     * <p>This cache is critical for degraded mode operations, allowing rule evaluation
     * to continue seamlessly even if the primary database becomes unresponsive.</p>
     */
    @PostConstruct
    public void initCache() {
        try {
            cachedRules = ruleRepository.findByActiveTrue();
            // Force Lazy Initialization of the system BEFORE the database fails!
            for (Rule rule : cachedRules) {
                if (rule.getSystem() != null) {
                    org.hibernate.Hibernate.initialize(rule.getSystem());
                }
            }
            log.info("[DEGRADED MODE] Initialized RAM rule cache with {} rules on startup.", cachedRules.size());
        } catch (Exception e) {
            log.error("Failed to initialize rule cache on startup", e);
        }
    }

    private static class TrackerState {
        LocalDateTime firstBreach;
        LocalDateTime firstRecovery;
        // Adding this line to keep track of the active alert purely in memory
        Alert activeAlertMemory; 
    }

    // Thread-safe map to avoid memory leaks and concurrency issues. Key: Simulation ID -> (Rule ID -> TrackerState)
    private final ConcurrentHashMap<UUID, ConcurrentHashMap<UUID, TrackerState>> simulationTrackers = new ConcurrentHashMap<>();

    /**
     * Clears the in-memory tracking state for a specific simulation.
     * <p>This should be called when a simulation is finalized or canceled to prevent
     * memory leaks in the long-running application context.</p>
     *
     * @param simulationId the UUID of the simulation to clear
     */
    public void clearSimulationState(UUID simulationId) {
        if (simulationId != null) {
            simulationTrackers.remove(simulationId);
            log.info("Cleared state tracking for simulation {}", simulationId);
        }
    }

    private TrackerState getTracker(UUID simId, UUID ruleId) {
        return simulationTrackers
            .computeIfAbsent(simId, k -> new ConcurrentHashMap<>())
            .computeIfAbsent(ruleId, k -> new TrackerState());
    }

    /**
     * Evaluates a single physiological reading against all active medical rules.
     *
     * @param reading the physiological reading containing telemetry data
     * @throws Exception if an error occurs during parsing or database access
     */
    @Transactional
    public void evaluateReading(PhysiologicalReading reading) throws Exception {
        evaluateReadingsBatch(List.of(reading));
    }

    /**
     * Retrieves active rules from the database safely.
     * <p>If the database connection fails, it activates the degraded mode
     * and returns the pre-loaded in-memory rules cache.</p>
     *
     * @return a list of active clinical rules
     */
    private List<Rule> getActiveRulesSafely() {
        try {
            if (globalSettingsService.isDbFailed()) {
                return cachedRules;
            }
            List<Rule> rules = ruleRepository.findByActiveTrue();
            // Force Lazy Initialization while the DB is still alive!
            for (Rule rule : rules) {
                if (rule.getSystem() != null) {
                    org.hibernate.Hibernate.initialize(rule.getSystem());
                }
            }
            cachedRules = rules;
            return rules;
        } catch (Exception e) {
            log.warn("[DEGRADED MODE] Failed to read rules from the database. Activating degraded mode and using the memory cache.");
            globalSettingsService.setDbFailed(true);
            return cachedRules;
        }
    }

    /**
     * Evaluates a batch of physiological readings against the active rules in a single transaction.
     * <p>This method leverages the Yaml/JSON parsing of the rule's DSL (Domain Specific Language)
     * such as {@code {"metric":"HR","operator":">","threshold":100}} and compares it against
     * the incoming telemetry array.</p>
     *
     * @param readings the list of physiological readings to process
     */
    @Transactional
    @Timed(value = "vitalsim.rule.evaluation.time", description = "Time taken to evaluate clinical rules")
    public void evaluateReadingsBatch(List<PhysiologicalReading> readings) {
        if (readings == null || readings.isEmpty()) return;

        List<Rule> activeRules = getActiveRulesSafely();
        if (activeRules.isEmpty()) return;

        Simulation currentSim = readings.get(0).getSimulation();
        UUID simId = currentSim.getId();

        for (PhysiologicalReading reading : readings) {
            for (Rule rule : activeRules) {
                try {
                    if (!rule.isApplicableTo(reading.getHandle())) continue;
                    processRuleForReading(rule, reading, currentSim, simId);
                } catch (Exception e) {
                    log.error("Failed to parse or evaluate YAML rule during batch: {}", rule.getId(), e);
                }
            }
        }
    }

    private void processRuleForReading(Rule rule, PhysiologicalReading reading, Simulation currentSim, UUID simId) {
        Double val = reading.getValue();
        boolean isTriggered = rule.isTriggeredBy(reading.getHandle(), val);
        boolean isResolved = rule.isResolvedBy(reading.getHandle(), val);
        
        TrackerState tracker = getTracker(simId, rule.getId());
        boolean isAlerting = (tracker.activeAlertMemory != null);

        if (isTriggered) {
            handleTriggerCondition(rule, reading, currentSim, tracker, isAlerting, val);
        } else if (isResolved && isAlerting) {
            handleResolveCondition(rule, reading, currentSim, tracker);
        } else {
            revertWarningIfNeeded(rule, tracker);
            tracker.firstBreach = null;
            tracker.firstRecovery = null;
        }
    }

    private void revertWarningIfNeeded(Rule rule, TrackerState tracker) {
        if (tracker.activeAlertMemory != null && tracker.activeAlertMemory.getWarningAt() != null) {
            Alert activeAlert = tracker.activeAlertMemory;
            activeAlert.setWarningAt(null);
            saveAlertWithCircuitBreaker(activeAlert);
            broadcastAlert(activeAlert, rule.getSeverity().name());
        }
    }

    private void handleTriggerCondition(Rule rule, PhysiologicalReading reading, Simulation currentSim, TrackerState tracker, boolean isAlerting, Double val) {
        revertWarningIfNeeded(rule, tracker);
        tracker.firstRecovery = null;

        if (!isAlerting) {
            if (tracker.firstBreach == null) {
                tracker.firstBreach = reading.getTimestamp();
            }

            long diffSeconds = ChronoUnit.SECONDS.between(tracker.firstBreach, reading.getTimestamp());
            int requiredSeconds = rule.getActivationPersistence() != null ? rule.getActivationPersistence() : 0;

            if (diffSeconds >= requiredSeconds) {
                log.info("Rule triggered: {} (ID: {}) for Simulation: {}", rule.getName(), rule.getId(), currentSim.getId());

                Alert newAlert = Alert.builder()
                    .id(UUID.randomUUID()) 
                    .simulation(currentSim)
                    .rule(rule)
                    .status(AlertStatus.ATIVO)
                    .valueAtTrigger(val)
                    .timestamp(reading.getTimestamp())
                    .build();

                saveAlertWithCircuitBreaker(newAlert);

                tracker.activeAlertMemory = newAlert;
                tracker.firstBreach = null;

                broadcastAlert(newAlert, rule.getSeverity().name());
                meterRegistry.counter("vitalsim.alerts.triggered").increment();
            }
        }
    }

    private void handleResolveCondition(Rule rule, PhysiologicalReading reading, Simulation currentSim, TrackerState tracker) {
        tracker.firstBreach = null;

        if (tracker.firstRecovery == null) {
            tracker.firstRecovery = reading.getTimestamp();
            
            Alert activeAlert = tracker.activeAlertMemory;
            if (activeAlert.getWarningAt() == null) {
                activeAlert.setWarningAt(reading.getTimestamp());
                saveAlertWithCircuitBreaker(activeAlert);
                broadcastAlert(activeAlert, "WARNING");
            }
        }

        long diffSeconds = ChronoUnit.SECONDS.between(tracker.firstRecovery, reading.getTimestamp());
        int requiredSeconds = rule.getResolutionPersistence() != null ? rule.getResolutionPersistence() : 0;

        if (diffSeconds >= requiredSeconds) {
            log.info("Alert resolved for Rule: {} (ID: {}) for Simulation: {}", rule.getName(), rule.getId(), currentSim.getId());
            
            Alert activeAlert = tracker.activeAlertMemory;
            activeAlert.setStatus(AlertStatus.RESOLVIDO);
            activeAlert.setResolvedAt(reading.getTimestamp());
            
            saveAlertWithCircuitBreaker(activeAlert);

            broadcastAlert(activeAlert, "NORMAL");
            meterRegistry.counter("vitalsim.alerts.resolved").increment();

            tracker.activeAlertMemory = null;
            tracker.firstRecovery = null;
        }
    }

    private void saveAlertWithCircuitBreaker(Alert alert) {
        try {
            if (globalSettingsService.isDbFailed()) {
                dataPersistenceComponent.queueAlert(alert);
            } else {
                alertRepository.save(alert);
            }
        } catch (Exception e) {
            log.warn("[DEGRADED MODE] Failed to save alert. Queuing it in memory instead.");
            globalSettingsService.setDbFailed(true);
            dataPersistenceComponent.queueAlert(alert);
        }
    }

    private void broadcastAlert(Alert alert, String overrideSeverity) {
        if (alert == null || alert.getSimulation() == null) return;
        UUID alertId = alert.getId();
        Simulation sim = alert.getSimulation();
        UUID simId = sim != null ? sim.getId() : null;
        Rule rule = alert.getRule();
        UUID ruleId = rule != null ? rule.getId() : null;
        PhysiologicalSystem sys = rule != null ? rule.getSystem() : null;

        String alertTopic = "/topic/simulations/" + (simId != null ? simId : "unknown") + "/alerts";
        
        String ruleName = rule != null ? rule.getName() : "";
        String analyticalJustification = rule != null ? rule.getAnalyticalJustification() : "";
        String formattedValue = com.grupo3aor.innovationlab.util.ClinicalValueFormatter.formatClinicalMessage(alert);
        
        String eventTimestamp = alert.getTimestamp() != null ? alert.getTimestamp().toString() : "";
        if ("NORMAL".equals(overrideSeverity) && alert.getResolvedAt() != null) {
            eventTimestamp = alert.getResolvedAt().toString();
        } else if ("WARNING".equals(overrideSeverity) && alert.getWarningAt() != null) {
            eventTimestamp = alert.getWarningAt().toString();
        }

        Map<String, Object> alertPayload = Map.of(
            "alertId",        alertId != null ? alertId.toString() : "",
            "ruleId",         ruleId != null ? ruleId.toString() : "",
            "simulationId",   simId != null ? simId.toString() : "",
            "severity",       overrideSeverity,
            "systemName",     sys != null ? sys.getSystemName() : "Unknown",
            "ruleName",       ruleName,
            "analyticalJustification", analyticalJustification != null ? analyticalJustification : "",
            "formattedValue", formattedValue,
            "valueAtTrigger", alert.getValueAtTrigger() != null ? alert.getValueAtTrigger() : "",
            "timestamp",      eventTimestamp
        );
        messagingTemplate.convertAndSend(alertTopic, alertPayload);
    }
}