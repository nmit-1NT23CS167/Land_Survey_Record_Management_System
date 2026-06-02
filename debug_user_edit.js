const fetch = globalThis.fetch;
(async () => {
  try {
    // Login
    const loginRes = await fetch('http://localhost:5500/login', {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@landsurvey.com', password: 'Admin@1234' }),
    });
    const cookie = loginRes.headers.get('set-cookie');
    const c = cookie.split(';')[0];
    console.log('Logged in');

    // Get users page to get a user ID
    const usersRes = await fetch('http://localhost:5500/admin/users', {
      headers: { Cookie: c },
      redirect: 'manual',
    });
    const usersHtml = await usersRes.text();
    const idMatch = usersHtml.match(/editUser\('([^']+)'/);
    if (!idMatch) {
      console.log('No user ID found in users page');
      return;
    }
    const userId = idMatch[1];
    console.log('Found user ID:', userId);

    // Try to update the user
    const updateRes = await fetch(`http://localhost:5500/admin/users/${userId}/role`, {
      method: 'POST',
      headers: {
        'Cookie': c,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual',
      body: new URLSearchParams({ role: 'survey_officer', is_active: 'true' }),
    });
    console.log('Update response:', updateRes.status, updateRes.headers.get('location'));
    if (updateRes.status >= 400) {
      const text = await updateRes.text();
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.error(err.message);
  }
})();
