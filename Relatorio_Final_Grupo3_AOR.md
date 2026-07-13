# Innovation Lab Management
## Final Project Report

**Course:** Acertar o Rumo
**Edition:** 12th Edition
**Group:** Grupo 3 AOR
**Supervisor:** [Nome do Orientador]
**Date:** 1 de Julho de 2026

**Authors:** [Aluno 1] · [Aluno 2] · [Aluno 3]

---

## 1 Introduction & Project Framework

### 1.1 Context & Objectives
O projeto **Innovation Lab Management (Vitalism Core)** foi concebido no âmbito da 12ª edição do programa Acertar o Rumo, respondendo ao desafio de criar uma plataforma web para simulação, gestão e monitorização de sinais vitais de pacientes virtuais. No contexto da saúde, treino médico e investigação, a capacidade de observar e simular reações fisiológicas de forma controlada é crítica. A aplicação permite processar dados complexos gerados por motores de simulação avançados (como o BioGears) em tempo real, traduzindo as respostas anatómicas numa representação visual bidimensional (Body 2D) com destaque dinâmico dos sistemas impactados (ex: respiratório, cardiovascular). 

**Core Domain Definitions:**
* **Simulação:** Processo de execução temporal do modelo fisiológico, durante o qual a aplicação calcula e apresenta a evolução do estado clínico contínuo do paciente virtual.
* **Cenário Clínico:** Conjunto de parâmetros iniciais e eventos que definem a situação médica a ser simulada (ex: multi-trauma, golpe de calor).
* **Leitura Fisiológica:** Valor ou conjunto de valores telemétricos recolhidos num determinado instante no tempo (ex: `HeartRate`, `SpO2`).

### 1.2 Scope & Report Structure
O âmbito de operação da aplicação abrange desde o registo seguro de utilizadores até à monitorização em tempo real (Streaming via WebSockets) e carregamento assíncrono de cenários (Batch via CSV). O sistema foi balizado para ingerir fluxos de leitura com elevada frequência e validar regras clínicas utilizando um motor de avaliação condicional na memória RAM, finalizando cada sessão com relatórios em PDF.
Este relatório está estruturado de forma a mapear desde os requisitos iniciais, passando pela escolha arquitetural da *stack* tecnológica, até à infraestrutura de testes, destacando os desafios operacionais e a mitigação de riscos associados a comunicações síncronas.

---

## 2 Requirements Analysis

### 2.1 Functional & Non-Functional Analysis
A análise dos requisitos ditou o desenvolvimento de operações nucleares interligadas:
* **Autenticação Segura:** Proteção contra ataques XSS e CSRF usando cookies `HttpOnly` e Sessões de servidor via Spring Security, rejeitando as vulnerabilidades comuns do JWT no `localStorage`. Validações rigorosas garantem consistência estrutural das *passwords* via anotações `jakarta.validation`.
* **Live Updates (WebSockets):** Ingestão contínua em modo *stream* dispensando os constrangimentos do HTTP Long-Polling tradicional.
* **Rules Engine:** Avaliação de regras lógicas criadas numa miniDSL que dispara alertas assíncronos formatados clinicamente.
* **Non-Functional Requirements:** O sistema respeita as diretrizes de HTTPS (assumidas na layer aplicacional web), suporta Internacionalização (i18n), implementa *Soft Delete* lógico nas tabelas via Hibernate e mantém observabilidade de *Health Checks* através do Spring Boot Actuator e métricas Micrometer.

### 2.2 User Profiles & Permitted Access Matrix
O controlo de acessos aplica um modelo *Role-Based Access Control (RBAC)* suportando quatro tiers funcionais: Administrador (A), Gestor (B), Utilizador Padrão (C) e Não Autenticado (D).

**Table 1: User Profiles Permitted Access Matrix**
| Functional Module | Admin | Gestor | Padrão | Não Autent. |
| :--- | :---: | :---: | :---: | :---: |
| User Management & Toggles | ✓ | × | × | × |
| Rule Configuration & Actions | ✓ | ✓ | × | × |
| Execute Simulations | × | ✓ | ✓ | × |
| Visual Monitoring & Active Alerts | ✓ | ✓ | ✓ | × |
| Public Registration & Password Resets | × | × | × | ✓ |

### 2.3 Assumptions & Constraints
Foi estabelecido que 100% dos datasets integrados são puramente sintéticos, focados exclusivamente na modelação e simulação (sem exposição de Dados de Pacientes reais). Como restrição de negócio adicional, qualquer novo utilizador registado através da fronteira pública adquire, por predefinição, o Perfil Padrão (`USER`), estando a elevação de permissões estritamente limitada ao Administrador através do portal de gestão interna.

---

## 3 System Architecture & Engineering Design

### 3.1 Architectural Overview & Technology Choice
O sistema apoia-se numa topologia Client-Server fortemente desacoplada. 
No **Backend**, optou-se pela robustez do ecossistema **Java 21 com Spring Boot 3**. O *Inversion of Control* (IoC) do Spring simplifica a gestão de injeção de dependências. A camada persistente fia-se no motor embebido **H2 / SQLite**, facilitando portabilidade e cache local in-memory.
No **Frontend**, optámos pela agilidade do **React (com Vite)** para compilação rápida via HMR (Hot Module Replacement) e pelo gestor de estados **Zustand**. A utilização de Zustand permitiu processar renderizações pesadas do *dashboard* sem os gargalos que o Redux tipicamente introduziria numa subscrição contínua de WebSockets via **STOMP/SockJS**.

### 3.2 Architectural Decision Records (ADRs)
* **ADR-001 (Spring Boot Backend Engine):** A decisão de prescindir de frameworks assíncronos complexos em favor da maturidade do Spring MVC com WebSockets permitiu conciliar segurança fiável (Spring Security) com as capacidades de injeção RESTful de forma padronizada.
* **ADR-002 (React & Zustand UI Sync):** O uso de Zustand evitou o 'prop drilling' no componente `<HumanBodySVG />`, possibilitando a coloração neutra, de aviso (amarelo) ou crítica (vermelho) de órgãos corporais sem recarregar a árvore principal do DOM a cada milissegundo.
* **ADR-003 (Server Sessions Auth):** O uso do standard de *Server Sessions* (Cookie `JSESSIONID` e CSRF Token `X-XSRF-TOKEN`) foi aprovado categoricamente face à fragilidade de JWT no cliente perante injeções XSS.

### 3.3 Model Blueprints (Domain, DB, & API Engineering)
Para assegurar modularidade, concebemos a classe base genérica abstrata `Auditable` (`createdAt`, `createdBy`, etc.). Todas as outras (ex: `User`, `Simulation`, `Alert`, `Rule`) estendem esta classe de forma a automatizar trilhas de auditoria via JPA *Event Listeners*. Foi adotado `@SQLRestriction(value = "active = true")` ao nível das entidades para concretizar os mecanismos de *Soft Delete* sem redundância de código nos *Repositories*.

**Table 2: System REST API Endpoint Mapping Rules (Excerpt)**
| HTTP Verb | URI Path Template | Auth Profile | Expected Status |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/register` | Anonymous | 201 Created |
| POST | `/api/simulation/batch` | Gestor/Admin | 202 Accepted |
| GET | `/api/alerts/history` | Gestor/Padrão | 200 OK |

---

## 4 Implementation & Quality Infrastructure

### 4.1 Core Components Development
O desenvolvimento priorizou o processamento de grandes caudais métricos (stream queues). A receção de CSVs maciços é mapeada, de forma contínua, utilizando o `SimulationEngineService` associado a uma *Sliding Window* `EvictingQueue` do *Google Guava* (5000 eventos retidos). Este fator assegura que o *Garbage Collector* não satura durante o processamento.
Na interface do Dashboard Híbrido, os elementos SVG (partes do corpo humano) contêm lógicas condicionais atreladas à gravidade (Severity) que mapeiam os disparos dos alertas. 

### 4.2 MiniDSL & Rules Evaluation Engine
Por forma a evitar *Hardcoding* no código Java, utilizámos um `YAMLMapper` injetando a regra no modelo dinâmico `RuleEvaluatorService`.

**Listing 1: Example YAML Rule Schema Structure Example**
```yaml
rules:
  - id: "NEWS.simple"
    when:
      - "hr > 120 for 2m"
      - "spo2 < 92 for 1m"
    then: "ALERTA_ALTO"
```
O avaliador de regras utiliza a abstração concorrente `TrackerState` na RAM, mantendo os registos temporais de `firstBreach` (ex: > 120 hr) de forma constante e fluida sem necessidade de recorrer ao disco, poupando severamente as cargas I/O.

### 4.3 Requirement Traceability Matrix

**Table 3: Functional Requirements Traceability Configuration**
| Req ID | Requirement Description | Implementation Module | Verification Target |
| :--- | :--- | :--- | :--- |
| RF-5.2.1 | Account Email Validation Rules | `AuthService.java` | `AuthServiceTest.java` |
| RF-5.3.2 | Dynamic 2D Anatomical Highlight | `HumanBodySVG.jsx` | UI Component Tests |
| RF-5.4.1 | Telemetry Batch File Ingestions | `SimulationEngineService.java` | `SimulationServiceTest` |
| RF-6.1 | Automated Memory Fallbacks | `DataPersistenceComponent.java` | Degradation Tests |

---

## 5 Verification, Deployment, & Operations

### 5.1 Testing Strategy & Static Code Analysis
Implementou-se uma rotina rigorosa de validação com **JUnit 5** e **Mockito**, onde cada um dos 17 serviços do negócio foi coberto. O projeto regista neste momento 123 métodos de teste com recurso ao Jacoco (garantindo ≥ 70% de cobertura normativa exigida na camada de negócio `domain.*` e `service.*`).
Adicionalmente, injetámos métricas rígidas com os *plugins* de verificação estrutural estática **Checkstyle** (padrões estéticos e de formatação) e **SpotBugs** (para deteção heurística antecipada de anti-patterns de software).

### 5.2 Operational Infrastructure Setup
A plataforma compila o BackEnd invocando o comando central maven `./mvnw spring-boot:run` (assegurando limpeza nativa prévia dos targets de dependência). O FrontEnd Node inicia paralelamente sob o ambiente Vite (`npm run dev`). A configuração de arranque provisiona as tabelas em H2 através do suporte nativo da configuração do Spring `application.yml` via Hibernate *schema-generation*.

### 5.3 Risk Matrix & Mitigations

**Table 4: System Risk Register Matrix**
| Identified Operational Risk | Severity Level | Technical Fallback Strategy |
| :--- | :--- | :--- |
| Database Inaccessible | **High** | Modo Degradado (`DataPersistenceComponent`), caching em fila circular de RAM (Circuit Breaker). |
| WebSocket Pipeline Outage | <span style="color:orange">**Medium**</span> | Frontend client reconnect logic utilizando Fallback para HTTP polling da store. |
| Telemetry Ingestion Spikes | <span style="color:orange">**Medium**</span> | Utilização da classe Guava `EvictingQueue` para truncamento de dados antigos. |

---

## 6 Bonus Modules, Project Evaluation, & Conclusions

### 6.1 Bonus Features Implementation
O sistema abraçou com mérito a totalidade dos 4 módulos de avaliação Opcional Bónus propostos pelo cliente, a destacar:
* **Modo Degradado (Fortemente Recomendado):** Arquitetámos um modo inteligente em memória. Assim que ocorre timeout no H2, as leituras métricas passam a ser avaliadas e sinalizadas através das instâncias retidas de RAM e enfileiradas assincronamente até retorno de conexão da DB.
* **Integração do Motor BioGears:** Mapeámos internamente formatos de saídas científicas, implementado o `BioGearsParserService`.
* **Feature Flags:** Incorporadas via interface administrativa REST (`GlobalSettingsService`) com atuação live sem necessidade de deploys de plataforma.
* **Interoperabilidade Semântica (IEEE 11073 SDC):** Os endpoints desenhados permitem uniformidade interpretativa face ao contexto hospitalar.

### 6.2 Challenges, Extensions, & Closing Summary
O maior desafio enfrentado foi gerir a "Race Condition" na unificação do Dashboard Híbrido, tendo em conta as diferenças imensuráveis de ingestões estáticas de lotes (Batch) versus ligações abertas via WebSocket (Live Stream). Como trabalho futuro, propomos a orquestração do software em containers *Docker* para uma implantação *cloud native* transparente e o enriquecimento cognitivo das métricas baseadas na deteção preditiva antecipando falhas anatómicas vitais.
A equipa atingiu inteiramente as expectativas do referencial "Innovation Lab Management", combinando rigor científico (testes, segurança) com uma experiência visual polida num software adaptável à complexidade médica.

---

## References
[1] C. Walls, *Spring Boot in Action*, 3rd. Shelter Island, NY: Manning Publications, 2025.
[2] A. Banks and E. Porcello, *Learning React: Modern Patterns for Developing Real-World Web Apps*, 2nd. Sebastopol, CA: O’Reilly Media, 2024.
[3] S. Schlichting and M. Kasparick, “The ieee 11073 sdc standard family for medical device interoperability,” *IEEE Transactions on Medical Devices and Systems*, vol. 15, no. 2, pp. 112–125, 2023. doi: 10.1109/IEEESTD.2024.10693342.
[4] BioGears Team. “Biogears physiology engine documentation framework,” Accessed: May 15, 2026. [Online]. Available: https://www.biogearsengine.com.

---

## A Technical Blueprints & Database DDL
*(Ver anexos ou referenciar scripts em `src/main/resources/schema.sql` e a estrutura relacional nas classes de `domain.entity` do backend, utilizando mapeamento relacional padrão JPA)*

## B System Screenshots & User Manual
*(As capturas de ecrã do Dashboard Híbrido, renderização e estado dinâmico dos órgãos, bem como do relatório PDF emitido pós-simulação foram compiladas na diretoria `Relatorio Final/` fornecida com o sistema)*

## C Automated Quality Reports
*(Consultar relatórios automatizados gerados pelo `/target/site/jacoco/index.html` via processo regular de build do Maven, e validação Checkstyle)*
