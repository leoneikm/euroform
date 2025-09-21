import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from './auth.js';
import { v4 as uuidv4 } from 'uuid';
import { sendNotificationEmail } from '../utils/email.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Get submissions for a form (authenticated)
router.get('/form/:formId', verifyToken, async (req, res) => {
  try {
    // First verify the form belongs to the user
    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('id', req.params.formId)
      .eq('user_id', req.user.id)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('form_id', req.params.formId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ submissions: submissions || [] });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Error loading submissions' });
  }
});

// Submit form (public endpoint)
router.post('/submit/:formId', upload.any(), async (req, res) => {
  try {
    const formId = req.params.formId;
    const formData = req.body;
    const files = req.files || [];

    // Get form details
    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', formId)
      .eq('is_active', true)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found or inactive' });
    }

    // Validate required fields
    const requiredFields = form.fields.filter(field => field.required);
    for (const field of requiredFields) {
      if (field.type === 'file') {
        // Check if files were uploaded for this specific required file field
        const fieldFiles = files.filter(file => file.fieldname === field.name);
        if (!fieldFiles || fieldFiles.length === 0) {
          return res.status(400).json({ 
            error: `Field "${field.label}" is required` 
          });
        }
      } else {
        // Check regular form fields
        if (!formData[field.name] || formData[field.name].toString().trim() === '') {
          return res.status(400).json({ 
            error: `Field "${field.label}" is required` 
          });
        }
      }
    }

    // Upload files to Supabase Storage
    const uploadedFiles = [];
    for (const file of files) {
      const fileName = `${uuidv4()}-${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('form-uploads')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        continue; // Skip this file but continue with submission
      }

      uploadedFiles.push({
        name: file.originalname,
        path: uploadData.path,
        size: file.size,
        type: file.mimetype,
        fieldName: file.fieldname
      });
    }

    // Save submission to database
    const submissionId = uuidv4();
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert([{
        id: submissionId,
        form_id: formId,
        data: formData,
        files: uploadedFiles,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Send notification emails to configured recipients
    try {
      const notificationEmails = form.settings?.notificationEmails;
      if (notificationEmails) {
        // Parse multiple emails (comma-separated)
        const emailList = notificationEmails.split(',').map(email => email.trim()).filter(email => email);
        
        // Send to each email address
        for (const email of emailList) {
          await sendNotificationEmail({
            to: email,
            formName: form.name,
            submissionData: formData,
            files: uploadedFiles,
            submissionId
          });
        }
        
        console.log(`Notification emails sent to: ${emailList.join(', ')}`);
      } else {
        console.log('No notification emails configured for this form');
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the submission if email fails
    }

    res.status(201).json({ 
      message: 'Form submitted successfully',
      submissionId: submission.id
    });

  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Error submitting form' });
  }
});

// Download file
router.get('/file/:submissionId/:fileName', verifyToken, async (req, res) => {
  try {
    const { submissionId, fileName } = req.params;

    // First get the submission to verify ownership and get file info
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('*, forms!inner(user_id)')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.forms.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Find the specific file
    const file = submission.files?.find(f => f.name === fileName);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('form-uploads')
      .download(file.path);

    if (downloadError) {
      console.error('File download error:', downloadError);
      return res.status(404).json({ error: 'File could not be downloaded' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', file.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    // Convert blob to buffer and send
    const buffer = Buffer.from(await fileData.arrayBuffer());
    res.send(buffer);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Error downloading file' });
  }
});

// Delete submission
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // First get the submission to check ownership and get file paths
    const { data: submission, error: fetchError } = await supabaseAdmin
      .from('submissions')
      .select('*, forms!inner(user_id)')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.forms.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete associated files from storage
    if (submission.files && submission.files.length > 0) {
      const filePaths = submission.files.map(file => file.path);
      const { error: deleteFilesError } = await supabaseAdmin.storage
        .from('form-uploads')
        .remove(filePaths);
      
      if (deleteFilesError) {
        console.error('Error deleting files:', deleteFilesError);
      }
    }

    // Delete submission from database
    const { error } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Error deleting submission' });
  }
});

export default router;
