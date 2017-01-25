var express = require('express'),
  router = express.Router();

router.get('/', (req, res, next) => res.render('index', { title: 'ivo / asistent' }));

module.exports = router;
