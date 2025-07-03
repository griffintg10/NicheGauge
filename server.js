const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Use environment variable

app.post('/api/saturation', async (req, res) => {
    const { niche } = req.body;
    if (!niche) {
        return res.status(400).json({ error: 'Niche is required.' });
    }

    const prompt = `For the niche: "${niche}", provide the following as JSON:
{
  "saturation_score": (a number 0-100, where 100 is most saturated),
  "market_potential": (a number 0-100, where 100 is highest potential),
  "competition_level": (a number 0-100, where 100 is most competitive),
  "insights": "Provide 2-3 sentences of actionable business insights about this niche, including opportunities and challenges.",
  "summary": "Provide a 2-3 sentence executive summary of the overall market assessment, combining saturation, potential, and competition analysis into a clear recommendation."
}`;

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are a business analyst assistant.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Try to extract JSON from the response
        const content = response.data.choices[0].message.content;
        let result;
        try {
            result = JSON.parse(content);
        } catch (e) {
            // Try to extract JSON from text
            const match = content.match(/\{[\s\S]*\}/);
            if (match) {
                result = JSON.parse(match[0]);
            } else {
                throw new Error('Could not parse JSON from OpenAI response.');
            }
        }

        res.json(result);
    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to get data from OpenAI.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});