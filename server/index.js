import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import path from 'path'

const app = express()
app.use(cors())

const port = process.env.PORT || 4000
const dataPath = path.resolve('./server/data.json')

app.get('/api/query', (req, res) => {
  try {
    const raw = readFileSync(dataPath, 'utf8')
    const rows = JSON.parse(raw)
    const q = req.query.q ? String(req.query.q).toLowerCase() : null
    const results = q ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(q)) : rows
    res.json({ success: true, data: results })
  } catch (e) {
    res.status(500).json({ success: false, error: e.message })
  }
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
