-- INSTRUCCIONES:
-- 1. Copia todo este código.
-- 2. Ve a tu Dashboard de Supabase (https://app.supabase.com).
-- 3. Entra a tu proyecto -> SQL Editor.
-- 4. Inicia un "New Query", pega el código y dale "Run".

-- Habilitar lectura de observaciones para todos los usuarios autenticados (Directores, Rectores, etc.)
DROP POLICY IF EXISTS "Enable read access for all users" ON observations;
CREATE POLICY "Enable read access for all users" ON observations
FOR SELECT
TO authenticated
USING (true);

-- Habilitar lectura de maestros para todos los usuarios autenticados
DROP POLICY IF EXISTS "Enable read access for all users" ON teachers;
CREATE POLICY "Enable read access for all users" ON teachers
FOR SELECT
TO authenticated
USING (true);

-- Asegurarnos de que los perfiles también sean visibles
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
CREATE POLICY "Enable read access for all users" ON profiles
FOR SELECT
TO authenticated
USING (true);
