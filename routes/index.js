var express = require('express');
var router = express.Router();
let mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const fs = require('fs')

let ShouldBeDeletedNext = ''
const url = 'mongodb+srv://Igor:FMKwLV4wxaT9dcT@cluster0.u2jtm.mongodb.net/my_base?retryWrites=true&w=majority'

console.log('Started')


router.get('/', function (req, res, next) {
    res.render('home')
})

let gfs

const conn = mongoose.createConnection(url)
conn.once('open', () => {
    console.log('Connection created')
    gfs = Grid(conn.db, mongoose.mongo)
    gfs.collection('uploads')
})
const storage = new GridFsStorage({
    url: url,
    file: (req, file) => {
        return {
            filename: file.originalname,
            bucketName: 'uploads'
        }
    }
});
const upload = multer({storage});


router.post('/upload', upload.single('file'), (req, res, next) => {
    console.log('Uploaded!')
    res.render('thanks')
})

router.get('/delete/:id', (req, res, next) => {

    console.log('Запрос на удаление файла с ID:' + req.params.id)
    try {
        gfs.remove({_id: req.params.id, root: 'uploads'}, () => {
            console.log('Удален')
            res.redirect('/files')
        })
    } catch (e) {
        res.render('error')
    }
})

let sortType

router.get('/files/', async (req, res) => {
    try {
        gfs.files.find().toArray((err, files) => {
            let files_array = []
            files.forEach(element => {
                let Date = element.uploadDate
                files_array.push({
                    size_in_bytes: element.length,
                    size: (element.length < 1048576) ? `${Math.trunc(element.length * 100 / 1024) / 100}KB` : `${Math.trunc(100 * element.length / 1024 / 1024) / 100}MB`,
                    filename: element.filename,
                    uploadDate: element.uploadDate,
                    parsed_date: (Date.getUTCHours() + 3).toString().padStart(2, '0') + ':' + Date.getMinutes().toString().padStart(2, '0') + ' ' + Date.getUTCDate().toString().padStart(2, '0') + '.' + (Date.getUTCMonth() + 1).toString().padStart(2, '0') + '.' + Date.getUTCFullYear().toString().padStart(2, '0'),
                    id: element._id
                })
                console.log(Date + ' ' + Date.getDate() + ' and month is ' + Date.getMonth())
            })
            res.render('files', {
                files: files_array.sort((a, b) => {
                    if (a[sortType] < b[sortType]) {
                        return -1;
                    }
                    if (a[sortType] > b[sortType]) {
                        return 1;
                    }
                })
            })
        })
    } catch (e) {
        res.render('error')
    }
})

router.get('/sortBy/:type', (req, res) => {
    switch (req.params.type) {
        case 'Name':
            sortType = 'filename'
            break
        case 'Date':
            sortType = 'uploadDate'
            break
        case 'Size':
            sortType = 'size_in_bytes'
            break
        default:
            sortType = 'uploadDate'
    }
    res.redirect('../files')
})

router.get('/add_new', (req, res) => {
    res.render('add_new')
})

router.get('/home', (req, res) => {
    res.render('home')
})

router.get('/download/:filename', async (req, res, next) => {
    try {
        fs.unlink(ShouldBeDeletedNext, () => {
            console.log('Файл удален')
        })
        console.log(`Поступил запрос на скачивание ${req.params.filename}`)
        const filename = req.params.filename;
        console.log(filename)
        var gridfsbucket = new mongoose.mongo.GridFSBucket(conn.db, {
            chunkSizeBytes: 1024,
            bucketName: 'uploads'
        });
        gridfsbucket.openDownloadStreamByName(filename).pipe(fs.createWriteStream('./' + filename)).on('error', function (error) {
            console.log("error" + error);
            res.status(404).json({
                msg: error.message
            });
        }).on('finish', async function () {
            console.log('Файл загружен на сервер');
            const file = `./${req.params.filename}`;
            await res.download(file)
            console.log('Файл начал загрузку на клиент')
            ShouldBeDeletedNext = file
        });
    } catch (e) {
        res.render('error')
    }
})
module.exports = router;
