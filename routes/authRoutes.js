import express from 'express';
import { register, login, logout, authStatus } from '../controllers/authController.js';

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/status", authStatus);

export default router;