const router = require('express').Router();
const columnController = require('../controllers/columnController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', columnController.createColumn);
router.put('/reorder', columnController.reorderColumns);
router.put('/:id', columnController.updateColumn);
router.delete('/:id', columnController.deleteColumn);

module.exports = router;
