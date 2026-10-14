import { createClient } from '@supabase/supabase-js';
import { destinationFor } from './access.js';
import { supabaseUrl, supabaseKey } from './supabase-config.js';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const loginView = document.querySelector('#login-view');
const waitingView = document.querySelector('#waiting-view');
const dashboardView = document.querySelector('#dashboard-view');
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const authToggle = document.querySelector('#auth-toggle');
const authMessage = document.querySelector('#auth-message');
let registering = false;

function showView(view) {
  loginView.hidden = view !== 'login';
  waitingView.hidden = view !== 'waiting';
  dashboardView.hidden = view !== 'dashboard';
}

function showMessage(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function setBusy(form, busy) {
  form.querySelector('button[type="submit"]').disabled = busy;
}

function showWaiting(profile) {
  showView('waiting');
  const rejected = profile.status === 'rejected';
  document.querySelector('#waiting-label').textContent = rejected ? 'ACCESS NOT APPROVED' : 'APPROVAL PENDING';
  document.querySelector('#waiting-title').textContent = rejected ? 'Your request was declined.' : 'Your request is with an admin.';
  document.querySelector('#waiting-description').textContent = rejected
    ? 'Contact the college administrator if you think this is a mistake.'
    : 'You can sign in after an admin approves your account. Refresh this page to check again.';
}

const sample = {
  student: {
    description: 'Your account is approved. Here is a sample campus overview.',
    stats: [['Attendance', '86%', 'Sample only'], ['Assignments', '03', 'Sample only'], ['Next class', '10:30', 'Sample only']],
    title: 'Sample student overview',
    items: [['Data Structures', 'Today · 10:30 AM', 'Class'], ['Database assignment', 'Friday · 5:00 PM', 'Due']]
  },
  management: {
    description: 'Your account is approved. Here is a sample campus overview.',
    stats: [['Students', '1,248', 'Sample only'], ['Faculty', '82', 'Sample only'], ['Requests', '07', 'Sample only']],
    title: 'Sample management overview',
    items: [['Admissions review', '5 applications', 'Review'], ['Academic calendar', 'Next meeting · Monday', 'Plan']]
  }
};

function showDashboard(profile) {
  showView('dashboard');
  document.querySelector('#dashboard-role').textContent = `${profile.role.toUpperCase()} DASHBOARD`;
  document.querySelector('#dashboard-title').textContent = `Welcome, ${profile.full_name}.`;
  const isAdmin = profile.role === 'admin';
  document.querySelector('#dashboard-description').textContent = isAdmin
    ? 'Review new member requests below.' : sample[profile.role].description;
  document.querySelector('#dashboard-stats').hidden = isAdmin;
  document.querySelector('.dashboard-lower').hidden = isAdmin;
  document.querySelector('#admin-panel').hidden = !isAdmin;
  if (!isAdmin) {
    const data = sample[profile.role];
    document.querySelector('#overview-title').textContent = data.title;
    document.querySelector('#dashboard-stats').replaceChildren(...data.stats.map(([label, value, note]) => {
      const card = document.createElement('article');
      card.className = 'stat-card';
      const labelNode = document.createElement('span');
      labelNode.className = 'stat-label';
      labelNode.textContent = label;
      const valueNode = document.createElement('strong');
      valueNode.textContent = value;
      const noteNode = document.createElement('span');
      noteNode.className = 'stat-sub';
      noteNode.textContent = note;
      card.append(labelNode, valueNode, noteNode);
      return card;
    }));
    document.querySelector('#overview-items').replaceChildren(...data.items.map(([name, detail, tag]) => {
      const row = document.createElement('div');
      row.className = 'overview-row';
      const text = document.createElement('div');
      const nameNode = document.createElement('strong');
      nameNode.textContent = name;
      const detailNode = document.createElement('span');
      detailNode.textContent = detail;
      text.append(nameNode, detailNode);
      const badge = document.createElement('span');
      badge.className = 'row-tag';
      badge.textContent = tag;
      row.append(text, badge);
      return row;
    }));
  } else {
    loadRequests();
  }
  document.title = `AIMT College | ${profile.role}`;
}

async function loadRequests() {
  const list = document.querySelector('#pending-list');
  list.textContent = 'Loading requests...';
  const { data, error } = await supabase.from('profiles')
    .select('id, full_name, email, requested_role, created_at')
    .eq('status', 'pending').order('created_at', { ascending: true });
  if (error) {
    list.textContent = '';
    showMessage(document.querySelector('#admin-message'), `Could not load requests: ${error.message}`);
    return;
  }
  showMessage(document.querySelector('#admin-message'), '');
  list.replaceChildren();
  if (!data.length) {
    list.textContent = 'No requests are waiting for approval.';
    return;
  }
  for (const member of data) {
    const row = document.createElement('div');
    row.className = 'request-row';
    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = member.full_name;
    const email = document.createElement('span');
    email.textContent = member.email;
    details.append(name, email);
    const role = document.createElement('select');
    role.setAttribute('aria-label', `Role for ${member.full_name}`);
    for (const value of ['student', 'management']) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value === 'student' ? 'Student' : 'Management';
      role.append(option);
    }
    role.value = member.requested_role;
    const approve = document.createElement('button');
    approve.type = 'button';
    approve.className = 'small-button';
    approve.textContent = 'Approve';
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'small-button secondary-button';
    reject.textContent = 'Reject';
    async function review(status) {
      approve.disabled = reject.disabled = true;
      const { data: updated, error: reviewError } = await supabase.from('profiles')
        .update({ status, role: role.value, reviewed_at: new Date().toISOString() })
        .eq('id', member.id).eq('status', 'pending').select('id').single();
      if (reviewError || !updated) {
        showMessage(document.querySelector('#admin-message'), `Could not save review: ${reviewError?.message || 'Request changed. Refresh and try again.'}`);
        approve.disabled = reject.disabled = false;
        return;
      }
      row.remove();
      if (!list.children.length) list.textContent = 'No requests are waiting for approval.';
      showMessage(document.querySelector('#admin-message'), '');
    }
    approve.addEventListener('click', () => review('approved'));
    reject.addEventListener('click', () => review('rejected'));
    row.append(details, role, approve, reject);
    list.append(row);
  }
}

async function showCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) { showView('login'); return; }
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('id, full_name, role, status').eq('id', user.id).single();
  if (profileError || !profile) {
    showView('login');
    showMessage(authMessage, 'Your account profile could not be loaded. Ask the administrator to check the Supabase setup.');
    return;
  }
  const destination = destinationFor(profile);
  if (destination === 'waiting') showWaiting(profile);
  else if (destination === 'dashboard') showDashboard(profile);
  else {
    showView('login');
    showMessage(authMessage, 'This account has an invalid profile. Contact the administrator.');
  }
}

authToggle.addEventListener('click', () => {
  registering = !registering;
  loginForm.hidden = registering;
  registerForm.hidden = !registering;
  authToggle.textContent = registering ? 'Already a member? Sign in' : 'New member? Request access';
  showMessage(authMessage, '');
  showMessage(document.querySelector('#login-error'), '');
  showMessage(document.querySelector('#register-error'), '');
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const errorNode = document.querySelector('#login-error');
  showMessage(errorNode, '');
  if (!supabase) { showMessage(errorNode, 'Supabase is not configured yet.'); return; }
  const email = document.querySelector('#identifier').value.trim();
  const password = document.querySelector('#password').value;
  if (!email || !password) { showMessage(errorNode, 'Enter your email and password.'); return; }
  setBusy(loginForm, true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  setBusy(loginForm, false);
  if (error) { showMessage(errorNode, error.message); return; }
  loginForm.reset();
  await showCurrentUser();
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const errorNode = document.querySelector('#register-error');
  showMessage(errorNode, '');
  if (!supabase) { showMessage(errorNode, 'Supabase is not configured yet.'); return; }
  const fullName = document.querySelector('#register-name').value.trim();
  const email = document.querySelector('#register-email').value.trim();
  const password = document.querySelector('#register-password').value;
  const requestedRole = document.querySelector('#register-role').value;
  if (!fullName || !email || password.length < 8 || !['student', 'management'].includes(requestedRole)) {
    showMessage(errorNode, 'Enter your name, email, role and a password of at least 8 characters.');
    return;
  }
  setBusy(registerForm, true);
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${location.origin}${location.pathname}`,
      data: { full_name: fullName, requested_role: requestedRole }
    }
  });
  setBusy(registerForm, false);
  if (error) { showMessage(errorNode, error.message); return; }
  registerForm.reset();
  if (data.session) await showCurrentUser();
  else showMessage(authMessage, 'Request received. Check your email to confirm your address, then wait for admin approval.');
});

async function signOut() {
  if (supabase) await supabase.auth.signOut();
  showView('login');
  document.title = 'AIMT College | Sign in';
}
document.querySelector('#sign-out').addEventListener('click', signOut);
document.querySelector('#waiting-sign-out').addEventListener('click', signOut);

if (!supabase) document.querySelector('#setup-notice').hidden = false;
else showCurrentUser();
