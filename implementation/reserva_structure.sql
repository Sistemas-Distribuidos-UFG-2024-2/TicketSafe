--
-- PostgreSQL database dump
--

-- Dumped from database version 13.16 (Debian 13.16-1.pgdg120+1)
-- Dumped by pg_dump version 13.16 (Debian 13.16-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ingressos; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.ingressos (
    id integer NOT NULL,
    ingressos_disponiveis integer NOT NULL
);


ALTER TABLE public.ingressos OWNER TO "user";

--
-- Name: ingressos_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.ingressos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ingressos_id_seq OWNER TO "user";

--
-- Name: ingressos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.ingressos_id_seq OWNED BY public.ingressos.id;


--
-- Name: reservas; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.reservas (
    id integer NOT NULL,
    evento_id integer NOT NULL,
    user_id uuid NOT NULL,
    quantidade integer NOT NULL,
    "timestamp" bigint NOT NULL,
    pagamento_efetuado boolean NOT NULL
);


ALTER TABLE public.reservas OWNER TO "user";

--
-- Name: reservas_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.reservas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reservas_id_seq OWNER TO "user";

--
-- Name: reservas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.reservas_id_seq OWNED BY public.reservas.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: user
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    uuid uuid NOT NULL
);


ALTER TABLE public.usuarios OWNER TO "user";

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: user
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuarios_id_seq OWNER TO "user";

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: user
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: ingressos id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ingressos ALTER COLUMN id SET DEFAULT nextval('public.ingressos_id_seq'::regclass);


--
-- Name: reservas id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reservas ALTER COLUMN id SET DEFAULT nextval('public.reservas_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: ingressos ingressos_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.ingressos
    ADD CONSTRAINT ingressos_pkey PRIMARY KEY (id);


--
-- Name: reservas reservas_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.reservas
    ADD CONSTRAINT reservas_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: user
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

