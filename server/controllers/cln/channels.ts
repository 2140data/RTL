import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const listPeerChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Peer Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listpeerchannels';
  request.post(options).then((body) => {
    body.channels.forEach((channel) => {
      const local = channel.to_us_msat || 0;
      const remote = (channel.total_msat - local) || 0;
      const total = channel.total_msat || 0;
      // return getAliasForChannel(channel).then(channelAlias => {
      channel = {
        peer_id: channel.peer_id,
        peer_connected: channel.peer_connected,
        opener: channel.opener,
        owner: channel.owner,
        short_channel_id: channel.short_channel_id,
        channel_id: channel.channel_id,
        funding_txid: channel.funding_txid,
        private: channel.private,
        to_us_msat: channel.to_us_msat,
        total_msat: channel.total_msat,
        their_reserve_msat: channel.their_reserve_msat,
        our_reserve_msat: channel.our_reserve_msat,
        spendable_msat: channel.spendable_msat,
        receivable_msat: channel.receivable_msat,
        funding: channel.funding,
        state: channel.state,
        fee_base_msat: channel.fee_base_msat,
        fee_proportional_millionths: channel.fee_proportional_millionths,
        dust_limit_msat: channel.dust_limit_msat,
        htlcs: channel.htlcs,
        features: channel.features,
        alias: channel.peer_id.substring(0, 20),
        to_them_msat: remote,
        balancedness: (total === 0) ? 1 : (1 - Math.abs((local - remote) / total)).toFixed(3)
      };
    });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Peer Channels List Received', data: body.channels });
    res.status(200).json(body.channels);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'List Peer Channels Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const openChannel = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/fundchannel';
  options.form = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Opened', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Open Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const setChannelFee = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Setting Channel Fee..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/setchannel';
  options.form = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Updated Channel Policy', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const closeChannel = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
  req.setTimeout(60000 * 10); // timeout 10 mins
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/close';
  options.form = { channelId: req.params.channelId, unilaterlaltimeout: req.query.force ? 1 : null };
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel', data: options.url });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Closed', data: body });
    res.status(204).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Close Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getLocalRemoteBalance = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Local & Remote Balances..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listfunds';
  request.post(options).then((body) => {
    const versionCompatible = common.isVersionCompatible(req.session.selectedNode.ln_version, '23.02');
    let localBalance = 0;
    let remoteBalance = 0;
    let pendingBalance = 0;
    let inactiveBalance = 0;
    body.channels.forEach((channel) => {
      if ((channel.state === 'CHANNELD_NORMAL') && channel.connected === true) {
        localBalance = localBalance + (versionCompatible ? (channel.our_amount_msat) : channel.channel_sat);
        remoteBalance = remoteBalance + (versionCompatible ? (channel.amount_msat - channel.our_amount_msat) : (channel.channel_total_sat - channel.channel_sat));
      } else if ((channel.state === 'CHANNELD_NORMAL') && channel.connected === false) {
        inactiveBalance = inactiveBalance + (versionCompatible ? (channel.our_amount_msat) : channel.channel_sat);
      } else if (channel.state === 'CHANNELD_AWAITING_LOCKIN' || channel.state === 'DUALOPEND_AWAITING_LOCKIN') {
        pendingBalance = pendingBalance + (versionCompatible ? (channel.our_amount_msat) : channel.channel_sat);
      }
    });
    if (versionCompatible) {
      localBalance = localBalance / 1000;
      remoteBalance = remoteBalance / 1000;
      inactiveBalance = inactiveBalance / 1000;
      pendingBalance = pendingBalance / 1000;
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Local Remote Balance Received', data: body });
    res.status(200).json({ localBalance: localBalance || 0, remoteBalance: remoteBalance || 0, inactiveBalance: inactiveBalance || 0, pendingBalance: pendingBalance || 0 });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Local Remote Balance Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listForwards = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channel List Forwards..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listforwards';
  options.form = { status: req.query.status || 'settled' };
  request.get(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Received For Status ' + req.query.status, data: body });
    res.status(200).json(!body.forwards ? [] : (req.query.status === 'failed' || req.query.status === 'local_failed') ? body.forwards.slice(Math.max(0, body.forwards.length - 1000), Math.max(1000, body.forwards.length)).reverse() : body.forwards.reverse());
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Forwarding History Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const funderUpdatePolicy = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting or Updating Funder Policy..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/funderupdate';
  options.form = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Funder Update Body', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Funder Policy Received', data: body });
    body.channel_fee_max_base_msat = (body.channel_fee_max_base_msat && typeof body.channel_fee_max_base_msat === 'string' && body.channel_fee_max_base_msat.includes('msat')) ? +body.channel_fee_max_base_msat?.replace('msat', '') : body.channel_fee_max_base_msat;
    body.lease_fee_base_msat = (body.lease_fee_base_msat && typeof body.lease_fee_base_msat === 'string' && body.lease_fee_base_msat.includes('msat')) ? +body.lease_fee_base_msat?.replace('msat', '') : body.channel_fee_max_base_msat;
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Funder Policy Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
