/*
  # Add Checklist Permissions

  1. Changes
    - Grant additional permissions for checklist operations
    - Enable authenticated users to manage checklist responses
    - Add policies for full CRUD operations on checklist_responses table
*/

-- Update policies for checklist_responses to be more permissive
DROP POLICY IF EXISTS "Users can view their own checklist responses" ON checklist_responses;
DROP POLICY IF EXISTS "Users can insert their own checklist responses" ON checklist_responses;
DROP POLICY IF EXISTS "Users can update their own checklist responses" ON checklist_responses;
DROP POLICY IF EXISTS "Users can delete their own checklist responses" ON checklist_responses;

-- Create more permissive policies
CREATE POLICY "Users can view all checklist responses"
  ON checklist_responses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create checklist responses"
  ON checklist_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update any checklist response"
  ON checklist_responses
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete any checklist response"
  ON checklist_responses
  FOR DELETE
  TO authenticated
  USING (true);