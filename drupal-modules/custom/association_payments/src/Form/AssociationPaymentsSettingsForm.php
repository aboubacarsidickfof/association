<?php

namespace Drupal\association_payments\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

class AssociationPaymentsSettingsForm extends ConfigFormBase {
  const CONFIG_NAME = 'association_payments.settings';

  protected function getEditableConfigNames() {
    return [self::CONFIG_NAME];
  }

  public function getFormId() {
    return 'association_payments_settings_form';
  }

  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config(self::CONFIG_NAME);

    $form['api_base_url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Payment API base URL'),
      '#default_value' => $config->get('api_base_url') ?: 'https://api.example.org',
      '#required' => TRUE,
      '#description' => $this->t('Example: https://api.yourdomain.tld'),
    ];

    $form['provider'] = [
      '#type' => 'select',
      '#title' => $this->t('Default provider'),
      '#options' => [
        'stripe' => 'Stripe',
        'flutterwave' => 'Flutterwave',
        'gocardless' => 'GoCardless',
      ],
      '#default_value' => $config->get('provider') ?: 'stripe',
    ];

    $form['amount_cents'] = [
      '#type' => 'number',
      '#title' => $this->t('Monthly amount (cents)'),
      '#default_value' => $config->get('amount_cents') ?: 500,
      '#min' => 100,
      '#required' => TRUE,
    ];

    $form['currency'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Currency (ISO 4217)'),
      '#default_value' => $config->get('currency') ?: 'EUR',
      '#size' => 6,
      '#maxlength' => 3,
      '#required' => TRUE,
    ];

    $form['webhook_token'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Webhook Shared Token'),
      '#default_value' => $config->get('webhook_token') ?: '',
      '#description' => $this->t('Payment API must set header X-Association-Token with this value'),
    ];

    return parent::buildForm($form, $form_state);
  }

  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->configFactory()->getEditable(self::CONFIG_NAME)
      ->set('api_base_url', rtrim($form_state->getValue('api_base_url'), '/'))
      ->set('provider', $form_state->getValue('provider'))
      ->set('amount_cents', (int) $form_state->getValue('amount_cents'))
      ->set('currency', strtoupper($form_state->getValue('currency')))
      ->set('webhook_token', $form_state->getValue('webhook_token'))
      ->save();
    parent::submitForm($form, $form_state);
  }
}
