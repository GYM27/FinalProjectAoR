package com.grupo3aor.innovationlab.service;

import com.grupo3aor.innovationlab.domain.entity.Alert;
import com.grupo3aor.innovationlab.domain.entity.PhysiologicalReading;
import com.grupo3aor.innovationlab.domain.entity.Simulation;
import com.grupo3aor.innovationlab.repository.AlertRepository;
import com.grupo3aor.innovationlab.repository.PhysiologicalReadingRepository;
import com.grupo3aor.innovationlab.repository.SimulationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;
import com.google.common.collect.EvictingQueue;
import com.google.common.collect.Queues;
import java.util.Queue;
import java.util.Collections;

/**
 * Buffer component for Degraded Mode.
 * Holds entities in memory when DB is down and flushes them when DB recovers.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataPersistenceComponent {

    public static final int MAX_CAPACITY = 50000;
    public static final int FLUSH_DELAY_MS = 5000;

    private final SimulationRepository simulationRepository;
    private final AlertRepository alertRepository;
    private final PhysiologicalReadingRepository physiologicalReadingRepository;
    private final GlobalSettingsService globalSettingsService;

    // Concurrent queues for entities
    private final ConcurrentLinkedQueue<Simulation> simulationBuffer = new ConcurrentLinkedQueue<>();
    private final ConcurrentLinkedQueue<Alert> alertBuffer = new ConcurrentLinkedQueue<>();
    
    // EvictingQueue for readings to prevent OOM
    // Wrap it in synchronized collection for thread safety
    private final Queue<PhysiologicalReading> readingBuffer = Queues.synchronizedQueue(EvictingQueue.create(MAX_CAPACITY));

    public void queueSimulation(Simulation simulation) {
        simulationBuffer.offer(simulation);
    }

    public void queueAlert(Alert alert) {
        alertBuffer.offer(alert);
    }

    public void queueReading(PhysiologicalReading reading) {
        readingBuffer.offer(reading);
    }

    public boolean isBufferEmpty() {
        return simulationBuffer.isEmpty() && alertBuffer.isEmpty() && readingBuffer.isEmpty();
    }

    public List<Alert> getQueuedAlertsForSimulation(java.util.UUID simulationId) {
        List<Alert> matchingAlerts = new ArrayList<>();
        for (Alert a : alertBuffer) {
            if (a.getSimulation() != null && simulationId.equals(a.getSimulation().getId())) {
                matchingAlerts.add(a);
            }
        }
        return matchingAlerts;
    }

    @Scheduled(fixedDelay = FLUSH_DELAY_MS)
    public void flushBuffer() {
        if (!globalSettingsService.isDbFailed() && !isBufferEmpty()) {
            try {
                // Drain and Save Simulations
                List<Simulation> simsToSave = new ArrayList<>();
                while (!simulationBuffer.isEmpty()) {
                    simsToSave.add(simulationBuffer.poll());
                }
                if (!simsToSave.isEmpty()) {
                    try {
                        simulationRepository.saveAll(simsToSave);
                        log.info("[DEGRADED MODE] Flushed {} simulations to DB.", simsToSave.size());
                    } catch (Exception e) {
                        log.error("[DEGRADED MODE] Failed to save simulations. Restoring to buffer.", e);
                        simsToSave.forEach(simulationBuffer::offer);
                        throw e; // Abort flush
                    }
                }

                // Drain and Save Alerts
                List<Alert> alertsToSave = new ArrayList<>();
                while (!alertBuffer.isEmpty()) {
                    alertsToSave.add(alertBuffer.poll());
                }
                if (!alertsToSave.isEmpty()) {
                    try {
                        alertRepository.saveAll(alertsToSave);
                        log.info("[DEGRADED MODE] Flushed {} alerts to DB.", alertsToSave.size());
                    } catch (Exception e) {
                        log.error("[DEGRADED MODE] Failed to save alerts. Restoring to buffer.", e);
                        alertsToSave.forEach(alertBuffer::offer);
                        throw e; // Abort flush
                    }
                }

                // Drain and Save Readings
                List<PhysiologicalReading> readingsToSave = new ArrayList<>();
                while (!readingBuffer.isEmpty()) {
                    readingsToSave.add(readingBuffer.poll());
                }
                if (!readingsToSave.isEmpty()) {
                    try {
                        physiologicalReadingRepository.saveAll(readingsToSave);
                        log.info("[DEGRADED MODE] Flushed {} readings to DB.", readingsToSave.size());
                    } catch (Exception e) {
                        log.error("[DEGRADED MODE] Failed to save readings. Restoring to buffer.", e);
                        readingsToSave.forEach(readingBuffer::offer);
                        throw e; // Abort flush
                    }
                }
            } catch (Exception e) {
                log.error("[DEGRADED MODE] Error during flush. Re-enabling Degraded Mode.");
                globalSettingsService.setDbFailed(true);
            }
        }
    }
}
