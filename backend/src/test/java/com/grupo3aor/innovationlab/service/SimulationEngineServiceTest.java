package com.grupo3aor.innovationlab.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grupo3aor.innovationlab.domain.entity.ClinicalScenario;
import com.grupo3aor.innovationlab.domain.entity.Simulation;
import com.grupo3aor.innovationlab.domain.enums.SimulationStatus;
import com.grupo3aor.innovationlab.dto.MetricDTO;
import com.grupo3aor.innovationlab.repository.SimulationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SimulationEngineServiceTest {

    @Mock
    private SimulationRepository simulationRepository;

    @Mock
    private PhysiologicalReadingService physiologicalReadingService;

    @Mock
    private RuleEvaluatorService ruleEvaluatorService;

    @Mock
    private GlobalSettingsService globalSettingsService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private DataPersistenceComponent dataPersistenceComponent;

    @Mock
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private SimulationEngineService service;

    private UUID simId;
    private Simulation mockSimulation;

    @BeforeEach
    void setUp() {
        simId = UUID.randomUUID();
        mockSimulation = Simulation.builder()
                .id(simId)
                .status(SimulationStatus.INICIADA)
                .startedAt(LocalDateTime.now())
                .scenario(ClinicalScenario.builder().metricsPayload("[{}]").build())
                .build();
    }

    @Test
    @DisplayName("cancelOrphanSimulations: should cancel orphans")
    void cancelOrphanSimulations_shouldCancel() {
        when(simulationRepository.findAllByStatusIn(anyList())).thenReturn(List.of(mockSimulation));

        service.cancelOrphanSimulations();

        verify(simulationRepository).save(mockSimulation);
        assert mockSimulation.getStatus() == SimulationStatus.CANCELADA;
    }

    @Test
    @DisplayName("increment and decrement active simulations should work")
    void activeSimulations_shouldIncrementAndDecrement() {
        // Starts at 0
        service.generateContinuousData();
        verify(simulationRepository, never()).findAllByStatusIn(anyList());

        // Increment
        service.incrementActiveSimulations();
        when(simulationRepository.findAllByStatusIn(anyList())).thenReturn(List.of());
        service.generateContinuousData();
        verify(simulationRepository, times(1)).findAllByStatusIn(anyList());

        // Decrement
        service.decrementActiveSimulations();
        service.generateContinuousData();
        verify(simulationRepository, times(1)).findAllByStatusIn(anyList()); // Still 1 from before
    }
    
    @Test
    @DisplayName("generateContinuousData: should NOT finalize when payload is empty (BioGears support)")
    void generateContinuousData_shouldNotFinalizeWhenEmptyPayload() {
        mockSimulation.getScenario().setMetricsPayload("");
        service.incrementActiveSimulations();
        when(simulationRepository.findAllByStatusIn(anyList())).thenReturn(List.of(mockSimulation));
        
        service.generateContinuousData();
        
        verify(simulationRepository, never()).save(mockSimulation);
        assert mockSimulation.getStatus() == SimulationStatus.INICIADA;
    }
    
    @Test
    @DisplayName("generateContinuousData: should NOT finalize when metrics list is empty (BioGears support)")
    void generateContinuousData_shouldNotFinalizeWhenEmptyMetrics() throws Exception {
        service.incrementActiveSimulations();
        when(simulationRepository.findAllByStatusIn(anyList())).thenReturn(List.of(mockSimulation));
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(List.of());
        
        service.generateContinuousData();
        
        verify(simulationRepository, never()).save(mockSimulation);
        assert mockSimulation.getStatus() == SimulationStatus.INICIADA;
    }

    @Test
    @DisplayName("generateContinuousData: should process metrics in degraded mode")
    void generateContinuousData_shouldProcessMetricsInDegradedMode() throws Exception {
        
        MetricDTO metric1 = new MetricDTO();
        metric1.setHandle("HR");
        metric1.setValue(80.0);
        metric1.setTimestamp(java.time.Instant.now().minusSeconds(10).toString()); // Set to the past to be processed immediately
        
        MetricDTO metric2 = new MetricDTO();
        metric2.setHandle("SpO2");
        metric2.setValue(98.0);
        metric2.setTimestamp(java.time.Instant.now().plusSeconds(5).toString()); // Within the 20s window to be evaluated
        
        List<MetricDTO> metrics = List.of(metric1, metric2);
        
        // 2. Preparar simulação mock
        mockSimulation.getScenario().setMetricsPayload("[{}]"); // Mocking non-empty string
        mockSimulation.setStartedAt(LocalDateTime.now().minusSeconds(20)); // Already running for 20 secs
        
        service.incrementActiveSimulations();
        when(simulationRepository.findAllByStatusIn(anyList())).thenReturn(List.of(mockSimulation));
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(metrics);
        
        // 3. First run: Normal Mode (to populate the RAM cache for Degraded Mode)
        when(globalSettingsService.isDbFailed()).thenReturn(false);
        service.generateContinuousData();
        
        // Verifies if in normal mode it used the DB service (2 metrics processed since elapsed=20s and metric2=20s)
        verify(physiologicalReadingService, times(2)).createReading(any(), anyString(), anyString());
        verify(simulationRepository, times(1)).save(mockSimulation); // Saves the simulation state
        
        // Reset the index to process the first metric again in the test
        mockSimulation.setNextMetricIndex(0);
        
        // 4. Segunda execução: Modo Degradado
        when(globalSettingsService.isDbFailed()).thenReturn(true);
        service.generateContinuousData();
        
        // Verifies if in degraded mode it queued instead of hitting the DB (the 2 metrics again)
        verify(dataPersistenceComponent, times(2)).queueReading(any());
        verify(dataPersistenceComponent, times(1)).queueSimulation(any());
    }
}
