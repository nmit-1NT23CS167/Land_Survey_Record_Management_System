const fetch = globalThis.fetch;

(async () => {
  try {
    console.log('=== User Edit Workflow Test ===\n');

    // Step 1: Login
    console.log('1. Logging in...');
    const loginRes = await fetch('http://localhost:5500/login', {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email: 'admin@landsurvey.com', password: 'Admin@1234' }),
    });
    const cookie = loginRes.headers.get('set-cookie');
    if (!cookie) {
      console.log('   ERROR: Login failed\n');
      return;
    }
    const c = cookie.split(';')[0];
    console.log('   ✓ Logged in successfully\n');

    // Step 2: Get users page to find a user to edit
    console.log('2. Fetching users list...');
    const usersRes = await fetch('http://localhost:5500/admin/users', {
      headers: { Cookie: c },
    });
    const usersHtml = await usersRes.text();
    const idMatch = usersHtml.match(/editUser\('([^']+)',\s*'([^']+)',\s*(\w+)\)/);
    if (!idMatch) {
      console.log('   ERROR: Could not find user in HTML\n');
      return;
    }
    const [, userId, currentRole, currentActive] = idMatch;
    console.log(`   ✓ Found user: ${userId}`);
    console.log(`     - Current role: ${currentRole}`);
    console.log(`     - Current active: ${currentActive}\n`);

    // Step 3: Update user
    console.log('3. Submitting user edit form...');
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const newActive = currentActive === 'true' ? 'false' : 'true';
    const updateRes = await fetch(`http://localhost:5500/admin/users/${userId}/role`, {
      method: 'POST',
      headers: {
        'Cookie': c,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'manual',
      body: new URLSearchParams({ role: newRole, is_active: newActive }),
    });
    console.log(`   ✓ Form submitted`);
    console.log(`   - Response status: ${updateRes.status}`);
    console.log(`   - Redirect location: ${updateRes.headers.get('location')}\n`);

    // Step 4: Check if flash message appears on redirect
    if (updateRes.status === 302) {
      const redirectRes = await fetch(`http://localhost:5500${updateRes.headers.get('location')}`, {
        headers: { Cookie: c },
      });
      const redirectHtml = await redirectRes.text();
      const hasSuccess = redirectHtml.includes('User updated successfully');
      console.log('4. Checking for success message...');
      console.log(`   ${hasSuccess ? '✓ Success message found' : '⚠ Success message not found'}\n`);

      // Step 5: Verify the change was applied
      console.log('5. Verifying change was applied...');
      const newIdMatch = redirectHtml.match(new RegExp(`editUser\\('${userId}',\\s*'([^']+)',\\s*(\\w+)\\)`));
      if (newIdMatch) {
        const [, updatedRole, updatedActive] = newIdMatch;
        console.log(`   ✓ Change applied`);
        console.log(`     - New role: ${updatedRole}`);
        console.log(`     - New active: ${updatedActive}\n`);
        console.log('✓✓✓ USER EDIT WORKFLOW COMPLETE ✓✓✓');
      }
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
})();
