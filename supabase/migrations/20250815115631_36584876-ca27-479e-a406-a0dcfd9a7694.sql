-- Remove the database system template since flowTemplates.ts is the source of truth
DELETE FROM flows 
WHERE name = 'Classic Certification' 
  AND is_system_template = true;