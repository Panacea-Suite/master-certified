UPDATE flows 
SET flow_config = jsonb_set(
  flow_config, 
  '{globalHeader,brandName}', 
  '""'::jsonb
)
WHERE id = 'a0dacc81-2f65-4937-9f0d-7e82aad1b56b' 
AND name = 'Classic Certification';