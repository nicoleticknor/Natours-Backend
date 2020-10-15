const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

//this is not RESTful, but that's okay; it doesn't make sense to have a GET to signup
router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);

// * middleware to get the user object, convert the user object into req.params to be passed into the getUser function, then call getUser
router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch('/updateMe', authController.protect, userController.updateMe);
//even though we aren't actually deleting anything from the DB, it's fine to use this HTTP method
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
