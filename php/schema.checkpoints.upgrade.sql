-- Add DB-backed checkpoint/savepoint support to existing installs.
-- Import this into your selected Java Odyssey database if the new
-- columns do not appear automatically.

ALTER TABLE player_progress
    ADD COLUMN phase VARCHAR(50) NOT NULL DEFAULT 'menu' AFTER total_xp,
    ADD COLUMN current_scene VARCHAR(100) DEFAULT NULL AFTER phase,
    ADD COLUMN current_position VARCHAR(50) DEFAULT NULL AFTER current_scene,
    ADD COLUMN savepoint_scene VARCHAR(100) DEFAULT NULL AFTER current_position,
    ADD COLUMN savepoint_label VARCHAR(150) DEFAULT NULL AFTER savepoint_scene,
    ADD COLUMN save_state LONGTEXT DEFAULT NULL AFTER savepoint_label;
