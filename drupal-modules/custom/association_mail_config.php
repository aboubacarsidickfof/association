<?php

/**
 * @file
 * Drupal SMTP configuration script for Axigen mail server.
 * 
 * Usage:
 * docker compose exec drupal drush php:script /var/www/html/modules/custom/association_mail_config.php
 * 
 * Or install SMTP module via Composer:
 * docker compose exec drupal composer require drupal/smtp
 * Then enable via: docker compose exec drupal drush en smtp -y
 */

use Drupal\Core\Config\FileStorage;

// Configuration for Axigen mail server
$smtp_config = [
  'smtp_on' => TRUE,
  'smtp_host' => 'mailserver',
  'smtp_port' => 587,
  'smtp_protocol' => 'tls',
  'smtp_autotls' => TRUE,
  'smtp_username' => '', // Set after creating mailbox in Axigen
  'smtp_password' => '', // Set after creating mailbox in Axigen
  'smtp_from' => 'noreply@association.local',
  'smtp_fromname' => 'Association Platform',
  'smtp_client_hostname' => '',
  'smtp_client_helo' => '',
  'smtp_allowhtml' => TRUE,
  'smtp_test_address' => '',
  'smtp_debugging' => FALSE,
];

// Check if SMTP module exists
$module_handler = \Drupal::service('module_handler');
if (!$module_handler->moduleExists('smtp')) {
  echo "SMTP module not installed. Install with:\n";
  echo "  composer require drupal/smtp\n";
  echo "  drush en smtp -y\n";
  exit(1);
}

// Save SMTP configuration
$config = \Drupal::service('config.factory')->getEditable('smtp.settings');
foreach ($smtp_config as $key => $value) {
  $config->set($key, $value);
}
$config->save();

echo "SMTP configuration saved successfully!\n";
echo "Next steps:\n";
echo "1. Create a mailbox in Axigen WebAdmin (http://localhost:9000)\n";
echo "2. Update SMTP credentials in Drupal at: /admin/config/system/smtp\n";
echo "3. Test email sending from the SMTP configuration page\n";
