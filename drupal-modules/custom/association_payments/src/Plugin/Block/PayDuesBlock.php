<?php

namespace Drupal\association_payments\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Access\AccessResult;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Url;
use Drupal\Core\Link;

/**
 * Provides a 'Pay Dues' block.
 *
 * @Block(
 *   id = "association_payments_pay_dues",
 *   admin_label = @Translation("Association: Pay membership dues")
 * )
 */
class PayDuesBlock extends BlockBase {
  /**
   * {@inheritdoc}
   */
  public function build() {
    $url = Url::fromRoute('association_payments.checkout');
    $link = Link::fromTextAndUrl($this->t('Payer ma cotisation'), $url)->toRenderable();
    $link['#attributes']['class'][] = 'button';
    $link['#attributes']['class'][] = 'button--primary';

    return [
      '#type' => 'container',
      '#attributes' => ['class' => ['association-payments-dues']],
      'link' => $link,
      '#cache' => [
        'contexts' => ['user.roles', 'user'],
      ],
    ];
  }

  /**
   * {@inheritdoc}
   */
  protected function blockAccess(AccountInterface $account) {
    if (!$account->isAuthenticated()) {
      return AccessResult::forbidden();
    }
    if ($account->hasRole('member')) {
      return AccessResult::forbidden();
    }
    return AccessResult::allowed();
  }
}
