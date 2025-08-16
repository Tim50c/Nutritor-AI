const { GoogleGenerativeAI } = require('@google/generative-ai');

// TODO: Add your Gemini API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

module.exports = model;