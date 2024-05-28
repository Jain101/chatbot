// server.js
import express from 'express';
import { DataSource } from 'typeorm';
import { ChatGroq } from '@langchain/groq';
import { SqlDatabase } from 'langchain/sql_db';
import { createSqlAgent, SqlToolkit } from 'langchain/agents/toolkits/sql';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(express.json());
app.use(cors());

const datasource = new DataSource({
    type: 'sqlite',
    database: './test.db',
});

const runQuery = async (input) => {
    const db = await SqlDatabase.fromDataSourceParams({ appDataSource: datasource });
    const model = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "mixtral-8x7b-32768",
        temperature: 0.7,
    });
    const toolkit = new SqlToolkit(db, model);
    const executor = createSqlAgent(model, toolkit, { topK: 16494 });
    console.log(`Executing with input "${input}"...`);
    const result = await executor.invoke({ input });
    //await datasource.destroy();
    return result.output;
};

app.post('/query', async (req, res) => {
    try {
        const query = req.body.input;
        const output = await runQuery(query);
        res.json({ output });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error executing query');
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
