-- Migration 005: agregar video_path a exercises

ALTER TABLE exercises ADD COLUMN video_path TEXT;
