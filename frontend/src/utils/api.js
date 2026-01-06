import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth
export const login = (email, password) => 
  axios.post(`${API}/auth/login`, { email, password });

export const register = (email, name, password, role) => 
  axios.post(`${API}/auth/register`, { email, name, password, role });

// Users
export const getMe = () => axios.get(`${API}/users/me`);
export const getStudents = () => axios.get(`${API}/users/students`);
export const createStudent = (data) => axios.post(`${API}/users/students`, data);

// Tasks
export const getTasks = () => axios.get(`${API}/tasks/`);
export const getTodayTasks = () => axios.get(`${API}/tasks/today`);
export const getTask = (id) => axios.get(`${API}/tasks/${id}`);
export const createTask = (data) => axios.post(`${API}/tasks/`, data);
export const updateTask = (id, data) => axios.put(`${API}/tasks/${id}`, data);
export const deleteTask = (id) => axios.delete(`${API}/tasks/${id}`);

// Submissions
export const getSubmissions = () => axios.get(`${API}/submissions/`);
export const getTaskSubmissions = (taskId) => axios.get(`${API}/submissions/task/${taskId}`);
export const createSubmission = (data) => axios.post(`${API}/submissions/`, data);
export const updateSubmission = (id, data) => axios.put(`${API}/submissions/${id}`, data);
export const likeSubmission = (id) => axios.post(`${API}/submissions/${id}/like`);

// Chat
export const getChatSessions = () => axios.get(`${API}/chat/sessions`);
export const createChatSession = (studentId) => axios.post(`${API}/chat/sessions?student_id=${studentId}`);
export const getMessages = (chatId) => axios.get(`${API}/chat/messages/${chatId}`);
export const sendMessage = (data) => axios.post(`${API}/chat/messages`, data);
export const deleteMessage = (id, forEveryone) => 
  axios.delete(`${API}/chat/messages/${id}?delete_for_everyone=${forEveryone}`);

// Progress
export const getMyProgress = () => axios.get(`${API}/progress/me`);
export const getLeaderboard = () => axios.get(`${API}/progress/leaderboard`);
export const getStudentProgress = (studentId) => axios.get(`${API}/progress/student/${studentId}`);

// Announcements
export const getAnnouncements = () => axios.get(`${API}/announcements/`);
export const createAnnouncement = (data) => axios.post(`${API}/announcements/`, data);
export const deleteAnnouncement = (id) => axios.delete(`${API}/announcements/${id}`);

// AI
export const analyzeImage = (imageBase64, prompt) => 
  axios.post(`${API}/ai/analyze-image`, { image_base64: imageBase64, prompt });

export const askDoubt = (question, chatHistory = []) => 
  axios.post(`${API}/ai/doubt-solver`, { question, chat_history: chatHistory });