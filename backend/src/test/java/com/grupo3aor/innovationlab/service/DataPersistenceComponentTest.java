package com.grupo3aor.innovationlab.service;

import com.grupo3aor.innovationlab.domain.entity.Simulation;
import com.grupo3aor.innovationlab.repository.AlertRepository;
import com.grupo3aor.innovationlab.repository.PhysiologicalReadingRepository;
import com.grupo3aor.innovationlab.repository.SimulationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataPersistenceComponentTest {

    @Mock
    private SimulationRepository simulationRepository;
    
    @Mock
    private AlertRepository alertRepository;
    
    @Mock
    private PhysiologicalReadingRepository physiologicalReadingRepository;
    
    @Mock
    private GlobalSettingsService globalSettingsService;

    @InjectMocks
    private DataPersistenceComponent component;

    @BeforeEach
    void setUp() {
    }

    @Test
    @DisplayName("Should successfully flush simulation and remove it from buffer")
    void flushBuffer_Success() {
        // ARRANGE
        Simulation sim = Simulation.builder().id(UUID.randomUUID()).build();
        component.queueSimulation(sim);
        
        when(globalSettingsService.isDbFailed()).thenReturn(false);
        when(simulationRepository.saveAll(anyList())).thenReturn(java.util.Collections.emptyList());

        // ACT
        component.flushBuffer();

        // ASSERT
        verify(simulationRepository, times(1)).saveAll(anyList());
        assertThat(component.isBufferEmpty()).isTrue();
    }

    @Test
    @DisplayName("Should preserve data in buffer if DB saveAll throws Exception")
    void flushBuffer_DbFailure_PreservesData() {
        // ARRANGE
        Simulation sim = Simulation.builder().id(UUID.randomUUID()).build();
        component.queueSimulation(sim);
        
        when(globalSettingsService.isDbFailed()).thenReturn(false);
        // Simulate DB failure
        when(simulationRepository.saveAll(anyList())).thenThrow(new RuntimeException("DB Connection Refused"));

        // ACT
        component.flushBuffer();

        // ASSERT
        verify(simulationRepository, times(1)).saveAll(anyList());
        verify(globalSettingsService, times(1)).setDbFailed(true);
        
        // Ensure data was PUT BACK into the buffer
        assertThat(component.isBufferEmpty()).isFalse();
    }
}
