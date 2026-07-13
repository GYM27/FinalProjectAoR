package com.grupo3aor.innovationlab.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration class for establishing and managing WebSocket connections.
 * <p>Enables the STOMP (Simple Text Oriented Messaging Protocol) message broker and registers 
 * the endpoints required for real-time bi-directional communication between the server and clients.
 * This forms the backbone of the VitalSim live telemetry broadcasting system.</p>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configures the message broker.
     * <p>Sets up an in-memory broker to broadcast messages to clients subscribed to destinations 
     * prefixed with {@code /topic} (e.g., {@code /topic/simulations/{id}/readings}).</p>
     *
     * @param config the registry used to configure the message broker
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers the STOMP endpoints mapped to specific URLs.
     * <p>Clients connect to these endpoints to initiate the WebSocket handshake. 
     * Fallback options (SockJS) are enabled for environments that do not support raw WebSockets natively.</p>
     *
     * @param registry the registry used to map endpoints
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws", "/api/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
