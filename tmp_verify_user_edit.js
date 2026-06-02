const fetch = globalThis.fetch;

(async () => {
  try {
    const loginRes = await fetch('http://localhost:5500/login', {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@landsurvey.com', password: 'Admin@1234' }),
    });
    const cookie = loginRes.headers.get('set-cookie');
    if (!cookie) {
      console.error('Login failed: no session cookie set');
      process.exit(1);
    }
    const c = cookie.split(';')[0];

    const usersRes = await fetch('http://localhost:5500/admin/users', {
      headers: { Cookie: c },
    });
    const usersHtml = await usersRes.text();
    const idMatch = usersHtml.match(/editUser\('([^']+)',\s*'([^']+)',\s*(\w+)\)/);
    if (!idMatch) {
      console.error('Could not find user id in users page');
      process.exit(1);
    }
    const userId = idMatch[1];

    const updateRes = await fetch(`http://localhost:5500/admin/users/${userId}/role`, {
      method: 'POST',
      redirect: 'manual',
      headers: { Cookie: c, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ role: 'survey_officer', is_active: 'true' }),
    });
    console.log('Update status', updateRes.status, updateRes.headers.get('location'));

    if (updateRes.status !== 302) {
      console.error('Update failed');
      console.error(await updateRes.text());
      process.exit(1);
    }

    const updatedLoginRes = await fetch('http://localhost:5500/login', {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@landsurvey.com', password: 'Admin@1234' }),
    });
    console.log('Login after update status', updatedLoginRes.status, updatedLoginRes.headers.get('location'));
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
})();
