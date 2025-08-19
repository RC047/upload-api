let { fromBuffer } = require('file-type')
let express = require('express')
let formidable = require('express-formidable')
let cors = require('cors')
let secure = require('ssl-express-www')
let parser = require('body-parser')
let fs = require('fs')
let path = require('path')
let util = require('util')


let port = process.env.PORT || 3000
let app = express()
app.enable('trust proxy')
app.set('json spaces', 2)
app.use(cors())
app.use(secure)
app.use(express.static('public'));
app.use(parser.json())
app.use(parser.urlencoded({ extended: true }))
app.use(formidable({
	encoding: 'utf-8',
	multiples: true,
	keepExtensions: true,
	allowEmptyFiles: false,
	uploadDir: path.resolve('public', 'files'),
	maxFileSize: 1024 * 1024 * 50 // set limit size to 50 MB
}))	

app.all('/', async (req, res, next) => {
    if (req.method !== 'POST') return res.status(405).json({ status: res.statusCode, message: 'Method not allowed' })
    let files = req.files ? req.files.data.path : req.fields
	console.log('Files:', files)
    if (!files) return res.status(400).json({ status: res.statusCode, message: 'No files passed' })
	try {
		if (!fs.existsSync(files)) return res.status(404).json({ status: res.statusCode, message: 'File not found' })
		let buffer = await fs.readFileSync(files)
		let { mime, ext } = await fromBuffer(buffer)
		if (!/image|video|audio/i.test(mime)) return res.status(403).json({ status: res.statusCode, message: 'Only file type image, video and audio is supported' })
		return res.status(200).json({
			status: res.statusCode,
			filename: path.basename(files),
			filesize: buffer.length,
			mime, ext,
			url: files
		})
	} catch (e) {
		return res.status(500).json({
			status: res.statusCode,
			error: util.format(e.message ? e.message : e)
		})
	}
})

app.listen(port, () => console.info('Server running on port', port));
