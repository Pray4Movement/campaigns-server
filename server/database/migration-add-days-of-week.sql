-- Migration: Add days_of_week column to reminder_signups table
-- Run this if your database already exists and needs the new column

-- Add days_of_week column to reminder_signups table
ALTER TABLE reminder_signups ADD COLUMN days_of_week TEXT DEFAULT NULL;
