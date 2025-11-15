-- Active: 1762704691875@@127.0.0.1@5432@shadow
CREATE SCHEMA IF NOT EXISTS "event" AUTHORIZATION "event";
ALTER ROLE "event" SET search_path = 'event';