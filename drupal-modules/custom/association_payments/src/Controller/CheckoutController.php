<?php

namespace Drupal\association_payments\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Drupal\user\Entity\User;

class CheckoutController extends ControllerBase {

  public function checkout() {
    $current_user = $this->currentUser();
    if ($current_user->isAnonymous()) {
      $this->messenger()->addError($this->t('You must be logged in.'));
      return $this->redirect('user.login');
    }

    $account = User::load($current_user->id());
    $email = $account->getEmail();
    $name = $account->getDisplayName();

    $config = $this->config('association_payments.settings');
    $api = rtrim($config->get('api_base_url') ?? '', '/');
    $provider = $config->get('provider') ?? 'stripe';
    $amount_cents = (int) ($config->get('amount_cents') ?? 500);
    $currency = strtoupper($config->get('currency') ?? 'EUR');

    if (!$api) {
      $this->messenger()->addError($this->t('Payment API base URL is not configured.'));
      return $this->redirect('<front>');
    }

    $success_url = $this->url('association_payments.success', [], ['absolute' => TRUE]);
    $cancel_url = $this->url('association_payments.cancel', [], ['absolute' => TRUE]);

    try {
      $client = \Drupal::httpClient();
      $response = $client->post($api . '/v1/checkout/subscription', [
        'json' => [
          'provider' => $provider,
          'email' => $email,
          'name' => $name,
          'amount_cents' => $amount_cents,
          'currency' => $currency,
          'success_url' => $success_url,
          'cancel_url' => $cancel_url,
        ],
        'timeout' => 15,
      ]);
      $data = json_decode($response->getBody()->getContents(), TRUE);
      if (!empty($data['url'])) {
        // GoCardless needs completion after return.
        if ($provider === 'gocardless' && !empty($data['session_token'])) {
          $session = \Drupal::requestStack()->getCurrentRequest()->getSession();
          $session->set('assoc_gc_session_token', $data['session_token']);
          $session->set('assoc_gc_subscription_id', $data['subscription_id'] ?? '');
          $session->set('assoc_gc_amount_cents', $amount_cents);
          $session->set('assoc_gc_currency', $currency);
          $session->set('assoc_gc_redirect_flow_id', $data['redirect_flow_id'] ?? '');
        }
        return new RedirectResponse($data['url']);
      }
      $this->messenger()->addError($this->t('Failed to start checkout.'));
      return $this->redirect('<front>');
    }
    catch (\Exception $e) {
      \Drupal::logger('association_payments')->error('Checkout error: @m', ['@m' => $e->getMessage()]);
      $this->messenger()->addError($this->t('An error occurred while starting the checkout.'));
      return $this->redirect('<front>');
    }
  }

  public function success(Request $request) {
    $this->messenger()->addStatus($this->t('Thanks! Your payment has been processed (or is being confirmed).'));

    // If GoCardless: complete redirect flow with stored session token.
    $config = $this->config('association_payments.settings');
    $provider = $config->get('provider') ?? 'stripe';
    if ($provider === 'gocardless') {
      $api = rtrim($config->get('api_base_url') ?? '', '/');
      $session = $request->getSession();
      $redirect_flow_id = $request->query->get('redirect_flow_id') ?: $session->get('assoc_gc_redirect_flow_id');
      $session_token = $session->get('assoc_gc_session_token');
      $subscription_id = $session->get('assoc_gc_subscription_id');
      $amount_cents = (int) $session->get('assoc_gc_amount_cents');
      $currency = $session->get('assoc_gc_currency');

      if ($api && $redirect_flow_id && $session_token && $subscription_id && $amount_cents && $currency) {
        try {
          $client = \Drupal::httpClient();
          $client->post($api . '/v1/gocardless/complete', [
            'json' => [
              'redirect_flow_id' => $redirect_flow_id,
              'session_token' => $session_token,
              'subscription_id' => $subscription_id,
              'amount_cents' => $amount_cents,
              'currency' => $currency,
            ],
            'timeout' => 15,
          ]);
          $this->messenger()->addStatus($this->t('Your subscription has been activated.'));
        }
        catch (\Exception $e) {
          \Drupal::logger('association_payments')->warning('GoCardless completion error: @m', ['@m' => $e->getMessage()]);
        }
      }
    }

    return [
      '#type' => 'markup',
      '#markup' => '<p>' . $this->t('You can now access the members area if your subscription is active.') . '</p>',
    ];
  }

  public function cancel() {
    $this->messenger()->addWarning($this->t('Payment was cancelled.'));
    return $this->redirect('<front>');
  }

  public function webhook(Request $request) {
    // Token verification
    $config = $this->config('association_payments.settings');
    $expected = $config->get('webhook_token');
    $token = $request->headers->get('X-Association-Token');
    if ($expected && $token !== $expected) {
      return new JsonResponse(['error' => 'forbidden'], 403);
    }

    $payload = json_decode($request->getContent(), TRUE);
    if (!is_array($payload)) {
      return new JsonResponse(['error' => 'invalid'], 400);
    }

    $email = $payload['email'] ?? NULL;
    $status = $payload['status'] ?? NULL;
    if (!$email || !$status) {
      return new JsonResponse(['error' => 'missing'], 400);
    }

    try {
      $users = \Drupal::entityTypeManager()->getStorage('user')->loadByProperties(['mail' => $email]);
      $user = $users ? reset($users) : NULL;
      if ($user) {
        if ($status === 'active') {
          if (!$user->hasRole('member')) {
            $user->addRole('member');
            $user->save();
          }
        }
        // Could handle other statuses: paused, cancelled, etc.
      }
    }
    catch (\Exception $e) {
      \Drupal::logger('association_payments')->error('Webhook error: @m', ['@m' => $e->getMessage()]);
      return new JsonResponse(['error' => 'server_error'], 500);
    }

    return new JsonResponse(['ok' => TRUE]);
  }
}
