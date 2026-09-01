const express = require('express');
const { CourseCategory } = require('../models');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/course-categories - any logged-in admin can create categories/subcategories
router.post('/', async (req, res) => {
  const { name, parentId } = req.body;
  const category = await CourseCategory.create({ name, parentId: parentId || null });
  return res.json(category);
});

// GET /api/course-categories - flat list; parentId tells you which are subcategories
router.get('/', async (req, res) => {
  const categories = await CourseCategory.findAll({ order: [['id', 'ASC']] });
  return res.json(categories);
});

// PUT /api/course-categories/:id - SUPERADMIN only
router.put('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const category = await CourseCategory.findByPk(req.params.id);
  if (!category) return res.status(404).end();
  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.parentId !== undefined) category.parentId = req.body.parentId;
  await category.save();
  return res.json(category);
});

// DELETE /api/course-categories/:id - SUPERADMIN only
router.delete('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const category = await CourseCategory.findByPk(req.params.id);
  if (!category) return res.status(404).end();
  await category.destroy();
  return res.status(204).end();
});

module.exports = router;
