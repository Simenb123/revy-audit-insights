-- Add new fields to clients table for financial framework and group information
ALTER TABLE public.clients 
ADD COLUMN financial_framework TEXT,
ADD COLUMN is_part_of_group BOOLEAN DEFAULT false,
ADD COLUMN group_name TEXT,
ADD COLUMN financial_framework_override BOOLEAN DEFAULT false;

-- Create enum for financial framework options
CREATE TYPE financial_framework_type AS ENUM (
  'ngaap_small',
  'ngaap_medium', 
  'ngaap_large',
  'ifrs',
  'simplified',
  'other'
);

-- Update the financial_framework column to use the enum
ALTER TABLE public.clients 
ALTER COLUMN financial_framework TYPE financial_framework_type 
USING financial_framework::financial_framework_type;