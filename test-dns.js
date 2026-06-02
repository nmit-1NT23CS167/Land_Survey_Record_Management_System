const dns = require('dns');

dns.resolveSrv('_mongodb._tcp.cluster0.31rlw1l.mongodb.net', (err, addrs) => {
  if (err) {
    console.error('RESOLVE_SRV_ERROR', err);
    process.exit(1);
  }
  console.log('SRV RECORDS:', addrs);
});
