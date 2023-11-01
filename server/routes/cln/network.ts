import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getRoute, listChannels, feeRates, listNodes } from '../../controllers/cln/network.js';

const router = Router();

router.get('/getRoute/:destPubkey/:amount', isAuthenticated, getRoute);
router.get('/listChannels/:channelShortId', isAuthenticated, listChannels);
router.get('/feeRates/:feeRateStyle', isAuthenticated, feeRates);
router.get('/listNodes', isAuthenticated, listNodes);

export default router;
