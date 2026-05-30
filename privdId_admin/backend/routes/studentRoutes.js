import express from "express";

import { addStudent, getStudents, loginStudent, sendStudentEmails, uploadMiddleware, uploadStudents } from "../controllers/studentController.js";

const router = express.Router();

router.post("/login", loginStudent);
router.get("/", getStudents);
router.post("/", addStudent);
router.post("/upload", uploadMiddleware, uploadStudents);
router.post("/send-email", sendStudentEmails);

export default router;