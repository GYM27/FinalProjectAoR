# 🩺 Innovation Lab Management (Vitalism Core)

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-brightgreen?style=flat-square&logo=spring)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-purple?style=flat-square&logo=vite)
![WebSockets](https://img.shields.io/badge/WebSockets-STOMP-yellow?style=flat-square)

## 📖 Overview

**Innovation Lab Management** is a full-stack web platform designed for the healthcare, medical training, and research sectors. It allows for the **simulation, management, and real-time monitoring of virtual patients' vital signs**. 

By processing complex data streams from advanced physiological simulation engines (like BioGears) in real-time, the application translates anatomical responses into a dynamic 2D visual representation of the human body, highlighting physiological systems (respiratory, cardiovascular, etc.) as they react to various medical scenarios (e.g., multi-trauma, heat stroke).

---

## ✨ Key Features & Technical Highlights

* **🟢 Real-Time Telemetry & Streaming:** Built with WebSockets (SockJS + STOMP) to ingest continuous streams of high-frequency physiological readings, avoiding the overhead of traditional HTTP Long-Polling.
* **🧠 Custom Rules Engine:** An in-memory conditional evaluation engine that processes custom clinical rules using a mini-DSL (Domain Specific Language) to trigger asynchronous alerts based on vital signs.
* **🔒 Enterprise-Grade Security:** Rejects traditional `localStorage` JWT vulnerabilities in favor of Session Cookies (`HttpOnly`). Includes protection against XSS and CSRF attacks, and robust input validation via Spring Security and `jakarta.validation`.
* **📊 Interactive Dashboards:** Dynamic UI built with React 19 and Recharts, featuring a 2D interactive human body map that visually highlights impacted organ systems based on real-time data.
* **👥 Role-Based Access Control (RBAC):** Tiered permission matrix supporting Admins (Configuration & Users), Managers (Simulations & Rules), and Standard Users (Monitoring).
* **📄 Session Reports:** Automated generation of PDF reports summarizing clinical sessions and patient outcomes.
* **🌍 Internationalization (i18n):** Full support for multiple languages (Portuguese and English).
* **📈 Observability:** Health checks and metrics exposed via Spring Boot Actuator and Micrometer, with integration for Prometheus.

---

## 💻 Technology Stack

### Backend (Java / Spring Boot)
* **Java 21** 
* **Spring Boot 3.4.x** (Web, Security, Data JPA, Validation, Mail)
* **Spring WebSockets** (STOMP)
* **H2 Database** (In-memory SQL for rapid development and testing)
* **Lombok** (Boilerplate reduction)
* **Actuator & Micrometer** (Telemetry and health monitoring)

### Frontend (React / Vite)
* **React 19** & **Vite 6**
* **Tailwind CSS v4** (Styling)
* **Zustand** (Global State Management)
* **Recharts** (Data Visualization)
* **i18next** (Internationalization)
* **Axios & SockJS-client** (API & WebSocket communication)

### Infrastructure & Monitoring
* **Docker & Docker Compose**
* **Prometheus** (Metrics scraping)

---

## 🚀 Getting Started

### Prerequisites
* Java 21 JDK
* Node.js (v18 or higher)
* Maven

### Running the Backend
1. Navigate to the `backend` directory: `cd backend`
2. Run the Spring Boot application: `./mvnw spring-boot:run` (or use your IDE).
3. The server will start on `http://localhost:8080`.

### Running the Frontend
1. Navigate to the `frontend` directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Vite development server: `npm run dev`
4. Access the application at `http://localhost:5173`.

---

## 👥 Access Matrix

| Feature | Admin | Manager | Standard User |
| :--- | :---: | :---: | :---: |
| User Management | ✓ | × | × |
| Rule Configuration | ✓ | ✓ | × |
| Execute Simulations | × | ✓ | ✓ |
| Visual Monitoring & Alerts | ✓ | ✓ | ✓ |

---

Images

<img width="402" height="882" alt="dashboardmobile" src="https://github.com/user-attachments/assets/a1eb4d1a-bbca-44cd-abe2-15bcac289089" />
<img width="1910" height="972" alt="userimage" src="https://github.com/user-attachments/assets/e57abcc3-3e48-4414-9960-3e6178c3bb0c" />
<img width="1891" height="975" alt="Rulesimage" src="https://github.com/user-attachments/assets/db76a596-4ba5-4034-ad2d-87a38d8cda52" />
<img width="1887" height="981" alt="Historicoimage" src="https://github.com/user-attachments/assets/e24d74c8-d7b9-4f64-b4c2-0fcd7e6c341d" />
<img width="397" height="870" alt="dashboardmobile2" src="https://github.com/user-attachments/assets/8ff12e52-253b-4d47-9505-03bb1fa92efa" />
<img width="1890" height="971" alt="Corpo2Dalertas" src="https://github.com/user-attachments/assets/ac738b30-e522-47b9-a136-6503b69f35aa" />


*This project was developed as the Final Project for the Acertar o Rumo (12th Edition) program.*
