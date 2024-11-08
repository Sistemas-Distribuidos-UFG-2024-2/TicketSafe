-- Criação da tabela ingressos
CREATE TABLE IF NOT EXISTS public.ingressos (
    id SERIAL PRIMARY KEY,
    ingressos_disponiveis integer NOT NULL,
    nome character varying(50)
);

-- Criação da tabela reservas
CREATE TABLE IF NOT EXISTS public.reservas (
    id SERIAL PRIMARY KEY,
    evento_id integer NOT NULL,
    user_id uuid NOT NULL,
    quantidade integer NOT NULL,
    "timestamp" bigint NOT NULL,
    pagamento_efetuado boolean NOT NULL
);

-- Criação da tabela usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    uuid uuid NOT NULL
);

-- Criação da tabela fila_espera
CREATE TABLE IF NOT EXISTS public.fila_espera (
    id SERIAL PRIMARY KEY,
    evento_id INT NOT NULL,
    user_id uuid NOT NULL,
    quantidade INT NOT NULL
);
