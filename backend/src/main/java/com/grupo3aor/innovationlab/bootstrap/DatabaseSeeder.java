package com.grupo3aor.innovationlab.bootstrap;

import com.grupo3aor.innovationlab.domain.entity.PhysiologicalSystem;
import com.grupo3aor.innovationlab.repository.PhysiologicalSystemRepository;
import com.grupo3aor.innovationlab.repository.GlobalSettingsRepository;
import com.grupo3aor.innovationlab.domain.entity.GlobalSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.grupo3aor.innovationlab.repository.RuleRepository;
import com.grupo3aor.innovationlab.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

/**
 * Bootstrapping component that automatically seeds the database with initial 
 * essential data upon application startup.
 * It ensures the presence of default physiological systems, global settings,
 * critical clinical rules, and the initial administrator user if they do not already exist.
 */
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final PhysiologicalSystemRepository physiologicalSystemRepository;
    private final GlobalSettingsRepository globalSettingsRepository;
    private final RuleRepository ruleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        seedPhysiologicalSystems();
        seedGlobalSettings();
        seedRules();
        seedUsers();
    }

    private void seedPhysiologicalSystems() {
        if (physiologicalSystemRepository.count() == 0) {
            System.out.println("[SEEDER] Inserindo Sistemas Fisiológicos iniciais...");
            
            List<PhysiologicalSystem> systems = List.of(
                PhysiologicalSystem.builder().systemName("Sistema Cardiovascular").active(true).createdBy("system_seeder").updatedBy("system_seeder").build(),
                PhysiologicalSystem.builder().systemName("Sistema Respiratório").active(true).createdBy("system_seeder").updatedBy("system_seeder").build(),
                PhysiologicalSystem.builder().systemName("Sistema Neurológico").active(true).createdBy("system_seeder").updatedBy("system_seeder").build()
            );
            
            physiologicalSystemRepository.saveAll(systems);
            System.out.println("[SEEDER] Sistemas Fisiológicos criados com sucesso!");
        }
    }

    private void seedGlobalSettings() {
        if (globalSettingsRepository.count() == 0) {
            System.out.println("[SEEDER] Inserindo Configurações Globais iniciais...");
            
            GlobalSettings defaultSettings = GlobalSettings.builder()
            .id(1L)
            .sessionTimeoutMinutes(30)
            .isHumanBodyEnabled(true)
            .createdBy("system_seeder")
            .updatedBy("system_seeder")
            .build();

            globalSettingsRepository.save(defaultSettings);
            System.out.println("[SEEDER] Configurações Globais (ID=1) criadas com sucesso!");
        }
    }

    private void seedRules() {
        if (ruleRepository.count() == 0) {
            System.out.println("[SEEDER] Inserindo Regras Clínicas otimizadas para Ataque de Asma...");
            
            PhysiologicalSystem cardio = physiologicalSystemRepository.findAll().stream()
                .filter(s -> s.getSystemName().contains("Cardiovascular"))
                .findFirst()
                .orElse(null);

            PhysiologicalSystem resp = physiologicalSystemRepository.findAll().stream()
                .filter(s -> s.getSystemName().contains("Respiratório"))
                .findFirst()
                .orElse(null);

            if (cardio != null && resp != null) {
                // 1. Taquicardia
                com.grupo3aor.innovationlab.domain.entity.Rule hrRule = com.grupo3aor.innovationlab.domain.entity.Rule.builder()
                    .name("Taquicardia Severa")
                    .expressionDsl("{\"metric\": \"HEART_RATE\", \"operator\": \">\", \"activationThreshold\": 105, " +
                                   "\"activationPersistence\": 10, \"resolutionThreshold\": 95, \"resolutionPersistence\": 15}")
                    .severity(com.grupo3aor.innovationlab.domain.enums.Severity.CRITICO)
                    .analyticalJustification("Aumento sustentado da frequência cardíaca indica possível choque compensado ou stress fisiológico agudo.")
                    .system(cardio).active(true).deleted(false).createdBy("system_seeder").updatedBy("system_seeder").build();
                
                // 2. Pressão Arterial - Alerta (Amarelo)
                com.grupo3aor.innovationlab.domain.entity.Rule bpAlertRule = com.grupo3aor.innovationlab.domain.entity.Rule.builder()
                    .name("Hipertensão Ligeira (Alerta)")
                    .expressionDsl("{\"metric\": \"MeanArterialPressure\", \"operator\": \">\", \"activationThreshold\": 85, " +
                                   "\"activationPersistence\": 5, \"resolutionThreshold\": 82, \"resolutionPersistence\": 10}")
                    .severity(com.grupo3aor.innovationlab.domain.enums.Severity.ALERTA)
                    .analyticalJustification("Aumento da pressão arterial média (MAP) indica aumento da resistência vascular.")
                    .system(cardio).active(true).deleted(false).createdBy("system_seeder").updatedBy("system_seeder").build();

                // 3. Pressão Arterial - Crítico (Vermelho)
                com.grupo3aor.innovationlab.domain.entity.Rule bpCriticalRule = com.grupo3aor.innovationlab.domain.entity.Rule.builder()
                    .name("Crise Hipertensiva (Crítico)")
                    .expressionDsl("{\"metric\": \"MeanArterialPressure\", \"operator\": \">\", \"activationThreshold\": 92, " +
                                   "\"activationPersistence\": 5, \"resolutionThreshold\": 90, \"resolutionPersistence\": 10}")
                    .severity(com.grupo3aor.innovationlab.domain.enums.Severity.CRITICO)
                    .analyticalJustification("Pico extremo na pressão arterial (MAP > 92) exige intervenção imediata.")
                    .system(cardio).active(true).deleted(false).createdBy("system_seeder").updatedBy("system_seeder").build();

                // 4. Hipoxia Severa
                com.grupo3aor.innovationlab.domain.entity.Rule spo2Rule = com.grupo3aor.innovationlab.domain.entity.Rule.builder()
                    .name("Hipoxia Crítica")
                    .expressionDsl("{\"metric\": \"SPO2\", \"operator\": \"<\", \"activationThreshold\": 95, " +
                                   "\"activationPersistence\": 10, \"resolutionThreshold\": 96, \"resolutionPersistence\": 15}")
                    .severity(com.grupo3aor.innovationlab.domain.enums.Severity.CRITICO)
                    .analyticalJustification("A queda de saturação de oxigénio reflete trocas gasosas inadequadas a nível alveolar.")
                    .system(resp).active(true).deleted(false).createdBy("system_seeder").updatedBy("system_seeder").build();

                ruleRepository.saveAll(java.util.List.of(hrRule, bpAlertRule, bpCriticalRule, spo2Rule));
                System.out.println("[SEEDER] 4 Regras Clínicas (Sinais Vitais Visíveis) criadas com sucesso!");
            }
        }
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            System.out.println("[SEEDER] Inserindo Utilizadores iniciais...");

            com.grupo3aor.innovationlab.domain.entity.User luis = com.grupo3aor.innovationlab.domain.entity.User.builder()
                .firstName("Admin")
                .lastName("Admin")
                .email("admin@gmail.com")
                .passwordHash(passwordEncoder.encode("Pass1234#"))
                .perfil(com.grupo3aor.innovationlab.domain.enums.PerfilEnum.ADMIN)
                .accountActivated(true)
                .active(true)
                .createdBy("system_seeder")
                .updatedBy("system_seeder")
                .build();

            userRepository.save(luis);
            System.out.println("[SEEDER] Utilizador admin@gmail.com criado com sucesso!");
        }
    }
}
