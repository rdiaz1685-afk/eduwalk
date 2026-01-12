-- Allow Directors to UPDATE coordinators in their own school
DROP POLICY IF EXISTS "Directors can update school coordinators" ON profiles;

CREATE POLICY "Directors can update school coordinators"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'director' 
  AND 
  (SELECT school_id FROM profiles WHERE id = auth.uid()) = school_id
  AND
  role = 'coordinator'
);

-- Ensure they can READ them first (usually covered by public read, but to be safe)
-- (We already fixed SELECT policies previously, so we assume they can see them)
