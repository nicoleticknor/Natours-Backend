const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

//this is not RESTful, but that's okay; it doesn't make sense to have a GET to signup
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// * using the protect middleware on all routes that come after in sequence
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

// * middleware to get the user object, convert the user object into req.params to be passed into the getUser function, then call getUser
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
//even though we aren't actually deleting anything from the DB, it's fine to use this HTTP method
router.delete('/deleteMe', userController.deleteMe);

// * only admins can perform the remaining route functions
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
