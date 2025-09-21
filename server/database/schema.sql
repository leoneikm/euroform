-- Euroform Database Schema
-- This should be executed in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    fields JSONB NOT NULL DEFAULT '[]',
    settings JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    files JSONB DEFAULT '[]',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS forms_user_id_idx ON forms(user_id);
CREATE INDEX IF NOT EXISTS forms_is_active_idx ON forms(is_active);
CREATE INDEX IF NOT EXISTS forms_created_at_idx ON forms(created_at DESC);

CREATE INDEX IF NOT EXISTS submissions_form_id_idx ON submissions(form_id);
CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions(created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Forms policies
-- Users can only see and modify their own forms
CREATE POLICY "Users can view their own forms" ON forms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON forms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON forms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON forms
    FOR DELETE USING (auth.uid() = user_id);

-- Public policy for form viewing (for embedded forms)
CREATE POLICY "Public can view active forms" ON forms
    FOR SELECT USING (is_active = true);

-- Submissions policies
-- Users can only see submissions for their own forms
CREATE POLICY "Users can view submissions for their forms" ON submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = submissions.form_id 
            AND forms.user_id = auth.uid()
        )
    );

-- Anyone can insert submissions (for public form submission)
CREATE POLICY "Anyone can insert submissions" ON submissions
    FOR INSERT WITH CHECK (true);

-- Users can delete submissions for their own forms
CREATE POLICY "Users can delete submissions for their forms" ON submissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM forms 
            WHERE forms.id = submissions.form_id 
            AND forms.user_id = auth.uid()
        )
    );

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('form-uploads', 'form-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for file uploads
CREATE POLICY "Anyone can upload files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'form-uploads');

CREATE POLICY "Users can view files for their forms" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'form-uploads' AND (
            -- Allow public access or form owner access
            true OR
            EXISTS (
                SELECT 1 FROM submissions s
                JOIN forms f ON f.id = s.form_id
                WHERE f.user_id = auth.uid()
                AND s.files::text LIKE '%' || name || '%'
            )
        )
    );

CREATE POLICY "Users can delete files for their forms" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'form-uploads' AND
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN forms f ON f.id = s.form_id
            WHERE f.user_id = auth.uid()
            AND s.files::text LIKE '%' || name || '%'
        )
    );

-- Function to clean up old files (call this with a cron job)
CREATE OR REPLACE FUNCTION cleanup_old_files()
RETURNS void AS $$
DECLARE
    file_record RECORD;
BEGIN
    -- Find files older than 24 hours
    FOR file_record IN 
        SELECT name FROM storage.objects 
        WHERE bucket_id = 'form-uploads' 
        AND created_at < NOW() - INTERVAL '24 hours'
    LOOP
        -- Delete the file
        DELETE FROM storage.objects 
        WHERE bucket_id = 'form-uploads' 
        AND name = file_record.name;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example form data structure (for reference)
/*
fields JSONB example:
[
  {
    "id": "1",
    "type": "text",
    "name": "name",
    "label": "Your Name",
    "placeholder": "Enter your name",
    "required": true
  },
  {
    "id": "2",
    "type": "email",
    "name": "email",
    "label": "Email Address",
    "placeholder": "your@email.com",
    "required": true
  },
  {
    "id": "3",
    "type": "textarea",
    "name": "message",
    "label": "Message",
    "placeholder": "Your message here...",
    "required": false
  },
  {
    "id": "4",
    "type": "file",
    "name": "attachment",
    "label": "Attachment",
    "required": false
  }
]

settings JSONB example:
{
  "submitButtonText": "Send Message",
  "successMessage": "Thank you for your message!",
  "allowFileUpload": true,
  "maxFileSize": 10485760,
  "redirectUrl": null
}

submission data JSONB example:
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello world!"
}

submission files JSONB example:
[
  {
    "name": "document.pdf",
    "path": "uuid-document.pdf",
    "size": 1024000,
    "type": "application/pdf"
  }
]
*/
