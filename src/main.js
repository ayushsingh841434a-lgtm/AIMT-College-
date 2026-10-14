import { authenticate, restoreAccount } from './auth.js';

const dashboards = {
  student: {
    label: 'STUDENT DASHBOARD', title: 'Good to see you, Aarav.',
    description: 'Here is a quick look at your campus day.',
    stats: [['Attendance', '86%', 'This semester'], ['Assignments', '03', 'To complete'], ['Next class', '10:30', 'Computer Science']],
    overviewTitle: 'Coming up for you',
    items: [['Data Structures', 'Today · 10:30 AM', 'Class'], ['Database assignment', 'Friday · 5:00 PM', 'Due'], ['Semester fee window', '30 November', 'Reminder']]
  },
  management: {
    label: 'MANAGEMENT DASHBOARD', title: 'Welcome, Priya.',
    description: 'A simple overview of campus activity.',
    stats: [['Students', '1,248', 'Enrolled'], ['Faculty', '82', 'Active'], ['Requests', '07', 'Awaiting review']],
    overviewTitle: 'Management overview',
    items: [['Admissions review', '5 applications', 'Review'], ['Academic calendar', 'Next meeting · Monday', 'Plan'], ['Fee reports', 'October summary ready', 'Report']]
  },
  admin: {
    label: 'ADMIN DASHBOARD', title: 'Welcome, Admin.',
    description: 'Your portal overview is ready.',
    stats: [['Accounts', '1,331', 'Demo records'], ['System status', 'Online', 'Sample status'], ['Open tasks', '04', 'For attention']],
    overviewTitle: 'Admin overview',
    items: [['User accounts', 'View sample access', 'Users'], ['Role permissions', '3 profiles configured', 'Roles'], ['System notices', 'No urgent notices', 'Status']]
  }
};

const loginView = document.querySelector('#login-view');
const dashboardView = document.querySelector('#dashboard-view');
const loginForm = document.querySelector('#login-form');
const identifierInput = document.querySelector('#identifier');
const passwordInput = document.querySelector('#password');
const errorMessage = document.querySelector('#login-error');

function showDashboard(user) {
  const data = dashboards[user.role];
  document.querySelector('#dashboard-role').textContent = data.label;
  document.querySelector('#dashboard-title').textContent = data.title;
  document.querySelector('#dashboard-description').textContent = data.description;
  document.querySelector('#overview-title').textContent = data.overviewTitle;
  document.querySelector('#dashboard-stats').replaceChildren(...data.stats.map(([label, value, sub]) => {
    const card = document.createElement('article');
    card.className = 'stat-card';
    const labelElement = document.createElement('span');
    labelElement.className = 'stat-label';
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = value;
    const subElement = document.createElement('span');
    subElement.className = 'stat-sub';
    subElement.textContent = sub;
    card.append(labelElement, valueElement, subElement);
    return card;
  }));
  document.querySelector('#overview-items').replaceChildren(...data.items.map(([name, detail, tag]) => {
    const row = document.createElement('div');
    row.className = 'overview-row';
    const text = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = name;
    const subtitle = document.createElement('span');
    subtitle.textContent = detail;
    text.append(title, subtitle);
    const badge = document.createElement('span');
    badge.className = 'row-tag';
    badge.textContent = tag;
    row.append(text, badge);
    return row;
  }));
  loginView.hidden = true;
  dashboardView.hidden = false;
  document.title = `AIMT College | ${user.role[0].toUpperCase()}${user.role.slice(1)}`;
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const user = authenticate(identifierInput.value, passwordInput.value);
  if (!user) {
    errorMessage.textContent = 'Incorrect email, user ID or password. Please try again.';
    errorMessage.hidden = false;
    return;
  }
  sessionStorage.setItem('aimt-demo-session', JSON.stringify(user));
  showDashboard(user);
});

document.querySelector('#sign-out').addEventListener('click', () => {
  sessionStorage.removeItem('aimt-demo-session');
  dashboardView.hidden = true;
  loginView.hidden = false;
  loginForm.reset();
  errorMessage.hidden = true;
  document.title = 'AIMT College | Sign in';
  identifierInput.focus();
});

try {
  const user = restoreAccount(JSON.parse(sessionStorage.getItem('aimt-demo-session')));
  if (user) showDashboard(user);
  else sessionStorage.removeItem('aimt-demo-session');
} catch {
  sessionStorage.removeItem('aimt-demo-session');
}
