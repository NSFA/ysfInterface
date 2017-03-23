import Router from 'koa-router'
import indexCtrl from '../controllers/indexCtrl'
import api from './api'
const router = new Router()

router.get('/', indexCtrl)
router.use('/api',api.routes())

export default router
