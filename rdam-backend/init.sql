-- =============================================================================
-- RDAM - Script de inicialización completo para Docker
-- Incluye: DDL (schema) + datos de prueba
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS `rdam`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `rdam`;
SET NAMES utf8mb4;

-- =============================================================================
-- TABLAS
-- =============================================================================

CREATE TABLE `circunscripciones` (
    `id`        TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `nombre`    VARCHAR(100)        NOT NULL,
    `is_active` TINYINT(1)          NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_circunscripciones_nombre` UNIQUE (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id`                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `email`               VARCHAR(255)        NOT NULL,
    `password_hash`       VARCHAR(255)        NULL     DEFAULT NULL,
    `role`                ENUM('citizen','operator','admin') NOT NULL,
    `circunscripcion_id`  TINYINT UNSIGNED    NULL     DEFAULT NULL,
    `is_active`           TINYINT(1)          NOT NULL DEFAULT 1,
    `otp_code`            VARCHAR(6)          NULL     DEFAULT NULL,
    `otp_expires_at`      DATETIME            NULL     DEFAULT NULL,
    `created_at`          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_users_email` UNIQUE (`email`),
    CONSTRAINT `fk_users_circunscripcion` FOREIGN KEY (`circunscripcion_id`)
        REFERENCES `circunscripciones` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_users_role_active` ON `users` (`role`, `is_active`);

CREATE TABLE `solicitudes` (
    `id`                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `ciudadano_id`          BIGINT UNSIGNED     NOT NULL,
    `circunscripcion_id`    TINYINT UNSIGNED    NOT NULL,
    `cuil_consultado`       VARCHAR(13)         NOT NULL,
    `email_contacto`        VARCHAR(255)        NOT NULL,
    `estado`                ENUM('pendiente_pago','pagada','publicada','publicada_vencida','cancelada','vencida') NOT NULL DEFAULT 'pendiente_pago',
    `payment_external_id`   VARCHAR(255)        NULL DEFAULT NULL,
    `payment_confirmed_at`  DATETIME            NULL DEFAULT NULL,
    `created_at`            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_solicitudes_payment_external_id` UNIQUE (`payment_external_id`),
    CONSTRAINT `fk_solicitudes_ciudadano` FOREIGN KEY (`ciudadano_id`)
        REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_solicitudes_circunscripcion` FOREIGN KEY (`circunscripcion_id`)
        REFERENCES `circunscripciones` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_solicitudes_ciudadano_estado` ON `solicitudes` (`ciudadano_id`, `estado`);
CREATE INDEX `idx_solicitudes_estado_created`   ON `solicitudes` (`estado`, `created_at`);

CREATE TABLE `certificados` (
    `id`                BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `solicitud_id`      BIGINT UNSIGNED     NOT NULL,
    `operador_id`       BIGINT UNSIGNED     NOT NULL,
    `file_path`         VARCHAR(500)        NOT NULL,
    `file_hash`         VARCHAR(64)         NOT NULL,
    `emitido_at`        DATETIME            NOT NULL,
    `vence_at`          DATETIME            NOT NULL,
    `email_enviado_at`  DATETIME            NULL DEFAULT NULL,
    `created_at`        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_certificados_solicitud` UNIQUE (`solicitud_id`),
    CONSTRAINT `fk_certificados_solicitud` FOREIGN KEY (`solicitud_id`)
        REFERENCES `solicitudes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_certificados_operador` FOREIGN KEY (`operador_id`)
        REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_certificados_vence_at` ON `certificados` (`vence_at`);

-- =============================================================================
-- CIRCUNSCRIPCIONES
-- =============================================================================
INSERT INTO `circunscripciones` (`nombre`, `is_active`) VALUES
    ('Primera Circunscripción - Santa Fe',      1),
    ('Segunda Circunscripción - Rosario',       1),
    ('Tercera Circunscripción - Venado Tuerto', 1),
    ('Cuarta Circunscripción - Reconquista',    1),
    ('Quinta Circunscripción - Rafaela',        1);

-- =============================================================================
-- USUARIOS
-- Password para todos los internos: "password123"
-- Hash BCrypt: $2a$10$3lD4TazXc7L44Xc.8T6SkeLta2kqA88nGj3VwC4/7g6eHYVQMC7dG
-- =============================================================================
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `circunscripcion_id`, `is_active`) VALUES
(1, 'admin@santafe.gov.ar',             '$2a$10$3lD4TazXc7L44Xc.8T6SkeLta2kqA88nGj3VwC4/7g6eHYVQMC7dG', 'admin',    NULL, 1),
(2, 'operador1@santafe.gov.ar',         '$2a$10$3lD4TazXc7L44Xc.8T6SkeLta2kqA88nGj3VwC4/7g6eHYVQMC7dG', 'operator', 1,    1),
(3, 'operador2@santafe.gov.ar',         '$2a$10$3lD4TazXc7L44Xc.8T6SkeLta2kqA88nGj3VwC4/7g6eHYVQMC7dG', 'operator', 2,    1),
(4, 'operador_inactivo@santafe.gov.ar', '$2a$10$3lD4TazXc7L44Xc.8T6SkeLta2kqA88nGj3VwC4/7g6eHYVQMC7dG', 'operator', 1,    0),
(5, 'ciudadano_a@gmail.com',            NULL, 'citizen', NULL, 1),
(6, 'ciudadano_b@gmail.com',            NULL, 'citizen', NULL, 1),
(7, 'ciudadano_inactivo@gmail.com',     NULL, 'citizen', NULL, 0);

-- =============================================================================
-- SOLICITUDES
-- =============================================================================
INSERT INTO `solicitudes` (`id`, `ciudadano_id`, `circunscripcion_id`, `cuil_consultado`, `email_contacto`, `estado`, `payment_external_id`, `payment_confirmed_at`, `created_at`) VALUES
(1,  5, 1, '20-12345678-9', 'ciudadano_a@gmail.com', 'pendiente_pago',   NULL,                  NULL,                  NOW()),
(2,  5, 1, '27-98765432-1', 'ciudadano_a@gmail.com', 'pagada',           'TXN-2-1772338091001', NOW(),                 DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(3,  5, 1, '30-11223344-5', 'ciudadano_a@gmail.com', 'publicada',        'TXN-3-1772338091002', '2026-02-15 09:00:00', '2026-02-15 08:00:00'),
(4,  5, 1, '20-55667788-9', 'ciudadano_a@gmail.com', 'cancelada',        NULL,                  NULL,                  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5,  6, 1, '27-11223355-4', 'ciudadano_b@gmail.com', 'pendiente_pago',   NULL,                  NULL,                  NOW()),
(6,  5, 2, '23-44556677-8', 'ciudadano_a@gmail.com', 'pendiente_pago',   NULL,                  NULL,                  NOW()),
(7,  5, 1, '20-33445566-7', 'ciudadano_a@gmail.com', 'pagada',           'TXN-7-1772338091007', DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(8,  5, 2, '27-44556677-8', 'ciudadano_a@gmail.com', 'pagada',           'TXN-8-1772338091008', DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 5 DAY)),
(9,  5, 1, '20-99887766-5', 'ciudadano_a@gmail.com', 'publicada_vencida','TXN-9-1772338091009', '2026-01-01 10:00:00', '2026-01-01 09:00:00'),
(10, 5, 3, '23-11223344-5', 'ciudadano_a@gmail.com', 'vencida',          NULL,                  NULL,                  '2025-12-01 10:00:00');

-- =============================================================================
-- CERTIFICADOS
-- =============================================================================
INSERT INTO `certificados` (`id`, `solicitud_id`, `operador_id`, `file_path`, `file_hash`, `emitido_at`, `vence_at`) VALUES
(1, 3, 2,
 'storage/3/cert_20260215_090000.pdf',
 'a3f1c2e4b5d6789012345678901234567890123456789012345678901234abcd',
 '2026-02-15 09:05:00',
 '2026-04-21 09:05:00'),
(2, 9, 2,
 'storage/9/cert_20260101_100000.pdf',
 'b4f2d3e5c6a7890123456789012345678901234567890123456789012345bcde',
 '2026-01-01 10:05:00',
 '2026-03-07 10:05:00');