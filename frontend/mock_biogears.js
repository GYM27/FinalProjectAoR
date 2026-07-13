// Ficheiro para simular o comportamento do BioGears (Motor C++)
// Corre com: node mock_biogears.js

const SIMULATION_ID = '10df76dd-eae7-453f-9a16-062cbf9dcd7c';
const API_URL = 'http://localhost:8080/api/readings';

// Para simplificar, não usamos autenticação se o backend permitir,
// caso contrário o Spring Security pode bloquear.
// Se bloquear, teremos de adicionar o Token aqui.

console.log("💉 Iniciando Mock do Motor de Simulação VitalSim...");

setInterval(async () => {
    // Gerar valores aleatórios mas realistas
    const hr = Math.floor(Math.random() * (120 - 60 + 1) + 60); // 60 a 120 bpm
    const spo2 = Math.floor(Math.random() * (100 - 90 + 1) + 90); // 90 a 100 %

    const readings = [
        {
            simulationId: SIMULATION_ID,
            handle: 'HeartRate',
            unit: 'bpm',
            value: hr
        },
        {
            simulationId: SIMULATION_ID,
            handle: 'RespirationRate',
            unit: '%',
            value: spo2
        }
    ];

    for (const data of readings) {
        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                console.log(`✅ Enviado -> ${data.handle}: ${data.value} ${data.unit}`);
            } else {
                console.log(`❌ Erro no backend (${resp.status}): ${await resp.text()}`);
            }
        } catch (err) {
            console.log(`🔌 Backend desligado ou inacessível: ${err.message}`);
        }
    }
}, 3000);
