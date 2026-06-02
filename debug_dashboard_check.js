const fetch = globalThis.fetch;
(async () => {
  const loginRes = await fetch('http://localhost:5500/login', {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'admin@landsurvey.com', password: 'Admin@1234' }),
  });
  const cookie = loginRes.headers.get('set-cookie');
  console.log('login', loginRes.status, !!cookie);
  if (!cookie) {
    console.log('no cookie');
    return;
  }
  const c = cookie.split(';')[0];
  const res = await fetch('http://localhost:5500/records/dashboard', {
    headers: { Cookie: c },
    redirect: 'manual',
  });
  console.log('dashboard', res.status);
  const text = await res.text();
  console.log(text.slice(0, 160));
})();
