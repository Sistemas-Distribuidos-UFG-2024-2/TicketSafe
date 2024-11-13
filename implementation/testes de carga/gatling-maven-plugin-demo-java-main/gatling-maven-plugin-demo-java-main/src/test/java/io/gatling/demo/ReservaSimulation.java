package io.gatling.demo;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;
import java.time.Duration;

public class ReservaSimulation extends Simulation {

    public ReservaSimulation() {
        // Definindo o protocolo HTTP
        HttpProtocolBuilder httpProtocol = http
            .baseUrl("http://localhost:80")
            .acceptHeader("application/json")
            .contentTypeHeader("application/json");

        // Definindo o cenário de reserva
        ScenarioBuilder reservaScenario = scenario("Reservar Ingressos")
            .exec(
                http("Reservar Ingresso")
                    .post("/ingressos/reservar")
                    .body(StringBody("{\"eventoId\": \"2\", \"quantidade\": \"1\", \"userId\": \"cec44660-96c6-4d9b-b97e-05f42b27a925\"}"))
                    .check(status().in(200,201, 422, 400)) // Verifica se a resposta tem status 200
            )
            .pause(Duration.ofMillis(1), Duration.ofMillis(30)); // Pausa de 1 a 30 milissegundos entre requisições

        // Configurando a injeção de carga
        setUp(
            reservaScenario.injectOpen(
                constantUsersPerSec(2).during(Duration.ofSeconds(10)), // 2 usuários por segundo durante 10 segundos
                constantUsersPerSec(5).during(Duration.ofSeconds(15)).randomized(), // 5 usuários por segundo durante 15 segundos, de forma aleatória
                rampUsersPerSec(6).to(600).during(Duration.ofMinutes(3)) // Rampa de 6 a 600 usuários por segundo em 3 minutos
            )
        ).protocols(httpProtocol); // Aplica o protocolo HTTP
    }
}


// variaveis de ambiente para o JAVA e apache

// $Env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
// $Env:PATH = "$Env:JAVA_HOME\bin;$Env:PATH"
