-- =============================================================================
-- RDAM - Registro de Deudores Alimentarios Morosos
-- Poder Judicial de la Provincia de Santa Fe
-- DDL Script v2.0 — Marzo 2026
-- Motor: MySQL 8.0 | InnoDB | utf8mb4
--
-- USO:
--   Este script crea la estructura de la base de datos SIN datos de prueba.
--   Para desarrollo con datos de prueba, usar init.sql (montado por Docker).
--   Para ejecutar este script manualmente:
--     mysql -uroot -p < schema.sql
--   O desde Docker:
--     docker exec -i rdam-db mysql -uroot -p<password> < schema.sql
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS `rdam`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `rdam`;
SET NAMES utf8mb4;

-- =============================================================================
-- TABLA: circunscripciones
-- =============================================================================
CREATE TABLE `circunscripciones` (
    `id`        TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `nombre`    VARCHAR(100)        NOT NULL,
    `is_active` TINYINT(1)          NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    CONSTRAINT `uq_circunscripciones_nombre` UNIQUE (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLA: users
-- =============================================================================
CREATE TABLE `users` (
    `id`                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    `email`               VARCHAR(255)        NOT NULL,
    `password_hash`       VARCHAR(255)        NULL     DEFAULT NULL,
    `role`                ENUM('citizen','operator','admin') NOT NULL,
    `circunscripcion_id`  TINYINT UNSIGNED    NULL     DEFAULT NULL COMMENT 'Solo aplica a operadores. NULL = acceso global (admin).',
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

-- =============================================================================
-- TABLA: solicitudes
-- Estados:
--   pendiente_pago  → solicitud creada, esperando confirmación de pago
--   pagada          → pago confirmado via webhook, esperando certificado
--   publicada       → certificado emitido y disponible
--   publicada_vencida → certificado vencido (>65 días), PDF eliminado
--   cancelada       → pago rechazado o fallido
--   vencida         → timeout de pago superado (>60 días PRD / 15 días DEV)
-- =============================================================================
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

-- =============================================================================
-- TABLA: certificados
-- =============================================================================
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
-- DATOS INICIALES — Circunscripciones Judiciales de Santa Fe
-- (Estos datos son reales y necesarios para el funcionamiento del sistema)
-- =============================================================================
INSERT INTO `circunscripciones` (`nombre`, `is_active`) VALUES
    ('Primera Circunscripción - Santa Fe',      1),
    ('Segunda Circunscripción - Rosario',       1),
    ('Tercera Circunscripción - Venado Tuerto', 1),
    ('Cuarta Circunscripción - Reconquista',    1),
    ('Quinta Circunscripción - Rafaela',        1);

-- =============================================================================
-- FIN DEL SCRIPT
-- Para agregar el primer usuario admin ejecutar:
--   INSERT INTO users (email, password_hash, role) VALUES
--   ('admin@santafe.gov.ar', '<bcrypt_hash>', 'admin');
-- Generar hash BCrypt en: https://bcrypt-generator.com/
-- =============================================================================