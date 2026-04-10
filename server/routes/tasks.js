const router = require('express').Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', taskController.getTasks);
router.get('/my-tasks', taskController.getMyTasks);
router.post('/', taskController.createTask);
router.put('/reorder', taskController.reorderTasks);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/comments', taskController.addComment);
router.get('/:id/comments', taskController.getComments);

module.exports = router;
