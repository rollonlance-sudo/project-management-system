const router = require('express').Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/invite', projectController.inviteMember);
router.put('/:id/members/role', projectController.updateMemberRole);
router.delete('/:id/members/:userId', projectController.removeMember);
router.get('/:id/board', projectController.getBoard);
router.get('/:id/activity', projectController.getActivity);

module.exports = router;
