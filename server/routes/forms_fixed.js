import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Get all forms for authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data: forms, error } = await supabaseAdmin
      .from('forms')
      .select('id, name, description, is_active, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ forms: forms || [] });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Error loading forms' });
  }
});

// Get single form by ID for authenticated user (can access inactive forms) - TEMPORARILY DISABLED AUTH
router.get('/:id/manage', async (req, res) => {
  try {
    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .select('id, name, description, fields, settings, is_active, created_at, updated_at')
      .eq('id', req.params.id)
      // .eq('user_id', req.user.id) // TEMPORARILY DISABLED
      .single();

    if (error || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Error loading form' });
  }
});

// Get single form by ID (public endpoint for embedding)
router.get('/:id', async (req, res) => {
  try {
    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
      'ETag': `"form-${req.params.id}"`,
    });

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .select('id, name, description, fields, settings')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (error || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Error loading form' });
  }
});

// Create new form
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, fields, settings } = req.body;
    
    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Name and fields are required' });
    }

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .insert([{
        name,
        description: description || '',
        fields,
        settings: settings || {},
        user_id: req.user.id,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ form });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Error creating form' });
  }
});

// Update form
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, fields, settings, is_active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = fields;
    if (settings !== undefined) updateData.settings = settings;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Error updating form' });
  }
});

// Delete form
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('forms')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Error deleting form' });
  }
});

// Duplicate form
router.post('/:id/duplicate', verifyToken, async (req, res) => {
  try {
    // First, get the original form
    const { data: originalForm, error: fetchError } = await supabaseAdmin
      .from('forms')
      .select('name, description, fields, settings')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !originalForm) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Create a duplicate with modified name
    const { data: duplicatedForm, error: createError } = await supabaseAdmin
      .from('forms')
      .insert([{
        name: `${originalForm.name} (Copy)`,
        description: originalForm.description,
        fields: originalForm.fields,
        settings: originalForm.settings,
        user_id: req.user.id,
        is_active: true
      }])
      .select()
      .single();

    if (createError) throw createError;

    res.status(201).json({ form: duplicatedForm });
  } catch (error) {
    console.error('Error duplicating form:', error);
    res.status(500).json({ error: 'Error duplicating form' });
  }
});

// Get form statistics
router.get('/:id/stats', verifyToken, async (req, res) => {
  try {
    // Verify form ownership
    const { data: form, error: formError } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (formError || !form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Get submission count
    const { count: totalSubmissions, error: countError } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', req.params.id);

    if (countError) throw countError;

    // Get submissions from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentSubmissions, error: recentError } = await supabaseAdmin
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('form_id', req.params.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    res.json({
      stats: {
        total_submissions: totalSubmissions || 0,
        recent_submissions: recentSubmissions || 0
      }
    });
  } catch (error) {
    console.error('Error fetching form stats:', error);
    res.status(500).json({ error: 'Error loading form statistics' });
  }
});

export default router;
