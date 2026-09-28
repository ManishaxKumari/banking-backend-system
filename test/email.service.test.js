const assert = require('node:assert/strict');
const { test } = require('node:test');

const originalEnv = { ...process.env };

function resetEnv() {
  process.env = { ...originalEnv };
}

test('createTransporter prefers app password when configured', () => {
  resetEnv();
  process.env.EMAIL_USER = 'test@example.com';
  process.env.EMAIL_APP_PASSWORD = 'app-password';
  delete process.env.CLIENT_ID;
  delete process.env.CLIENT_SECRET;
  delete process.env.REFRESH_TOKEN;

  const { createTransporter } = require('../src/services/email.service');
  const transporter = createTransporter();

  assert.ok(transporter);
  assert.equal(transporter.options.auth.user, 'test@example.com');
  assert.equal(transporter.options.auth.pass, 'app-password');
});

test('createTransporter returns null when no valid Gmail credentials are configured', () => {
  resetEnv();
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_APP_PASSWORD;
  delete process.env.CLIENT_ID;
  delete process.env.CLIENT_SECRET;
  delete process.env.REFRESH_TOKEN;

  const { createTransporter } = require('../src/services/email.service');
  assert.equal(createTransporter(), null);
});

process.on('exit', () => {
  process.env = originalEnv;
});
