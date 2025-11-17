# Configuration du serveur mail Axigen

## Vue d'ensemble
Le serveur mail Axigen fournit une solution complète pour l'envoi et la réception d'emails :
- **SMTP** : Envoi d'emails (ports 25, 587, 465)
- **IMAP** : Réception d'emails avec synchronisation (ports 143, 993)
- **POP3** : Réception d'emails (ports 110, 995)
- **Webmail** : Interface web pour consulter les emails
- **WebAdmin** : Interface d'administration

## Accès initial

### WebAdmin (Configuration)
- URL locale : http://localhost:9000 ou http://mailadmin.localhost
- URL production : https://mailadmin.example.com
- Identifiants : admin / `MAIL_ADMIN_PASSWORD` (défini dans `.env`)

### Webmail (Consultation des emails)
- URL locale : http://webmail.localhost
- URL production : https://webmail.example.com
- Accessible après création des comptes email

## Configuration initiale (WebAdmin)

### 1. Installation wizard (première utilisation)
```
http://localhost:9000/install
```
1. Accepter le contrat de licence
2. Définir le mot de passe administrateur (utiliser celui de `.env`)
3. Configurer le domaine principal : `association.local` (dev) ou `example.com` (production)
4. Terminer l'installation

### 2. Créer un domaine email
1. Aller dans **Domains** → **Add Domain**
2. Nom du domaine : `association.local` (ou votre domaine)
3. Activer les services :
   - ✅ SMTP (envoi)
   - ✅ IMAP (réception)
   - ✅ POP3 (optionnel)
4. Sauvegarder

### 3. Créer des comptes email
1. Sélectionner le domaine
2. Aller dans **Accounts** → **Add Account**
3. Créer les comptes suivants :

#### Compte système (pour Drupal)
- Username : `system`
- Email : `system@association.local`
- Password : Générer un mot de passe fort
- Quota : 1GB

#### Compte notifications
- Username : `noreply`
- Email : `noreply@association.local`
- Password : Générer un mot de passe fort
- Quota : 500MB

#### Compte administrateur
- Username : `contact`
- Email : `contact@association.local`
- Password : Mot de passe fort
- Quota : 2GB

### 4. Configurer SMTP pour applications
1. Dans **SMTP** → **Settings**
2. Activer **Submission Port (587)** avec STARTTLS
3. Exiger l'authentification
4. Optionnel : Activer **SMTPS (465)** pour SSL/TLS direct

## Intégration avec Drupal

### Option 1 : Module SMTP (recommandé)
```powershell
# Installation
docker compose exec drupal composer require drupal/smtp
docker compose exec drupal drush en smtp -y

# Configuration via UI
# Aller dans : Administration → Configuration → System → SMTP Authentication Support
# (/admin/config/system/smtp)
```

**Paramètres SMTP :**
- Install options : On
- SMTP server : `mailserver`
- SMTP port : `587`
- Use encrypted protocol : TLS
- Username : `system@association.local` (ou autre compte créé)
- Password : Mot de passe du compte
- E-mail from address : `noreply@association.local`
- E-mail from name : `Association Platform`

### Option 2 : Swift Mailer
```powershell
docker compose exec drupal composer require drupal/swiftmailer
docker compose exec drupal drush en swiftmailer -y
```

**Configuration :**
- Transport : SMTP
- Host : `mailserver`
- Port : `587`
- Encryption : TLS
- Username/Password : Identifiants du compte

### Test d'envoi
1. Aller dans la configuration SMTP
2. Entrer une adresse email de test
3. Cliquer sur "Send test email"
4. Vérifier la réception dans le webmail

## Configuration production

### DNS Records requis

#### MX Record (Mail Exchange)
```
@ IN MX 10 mail.example.com.
```

#### A Record
```
mail.example.com. IN A xxx.xxx.xxx.xxx
```

#### SPF Record (Sender Policy Framework)
```
@ IN TXT "v=spf1 mx ip4:xxx.xxx.xxx.xxx ~all"
```

#### DKIM (DomainKeys Identified Mail)
1. Générer la clé dans Axigen WebAdmin : **Security** → **DKIM**
2. Ajouter dans DNS :
```
default._domainkey.example.com. IN TXT "v=DKIM1; k=rsa; p=VOTRE_CLE_PUBLIQUE"
```

#### DMARC Record
```
_dmarc.example.com. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
```

#### Reverse DNS (PTR)
Contacter votre hébergeur pour configurer :
```
xxx.xxx.xxx.xxx → mail.example.com
```

### SSL/TLS Configuration
1. Dans Traefik, activer HTTPS pour `webmail.example.com` et `mailadmin.example.com`
2. Dans Axigen WebAdmin :
   - **Security** → **SSL/TLS Certificates**
   - Importer ou générer des certificats
   - Activer SSL pour SMTP (465), IMAP (993), POP3 (995)

### Firewall
Ouvrir les ports suivants :
- 25 (SMTP)
- 587 (SMTP Submission)
- 465 (SMTPS)
- 143 (IMAP)
- 993 (IMAPS)
- 110 (POP3)
- 995 (POP3S)

## Utilisation du Webmail

### Accès
- http://webmail.localhost (développement)
- https://webmail.example.com (production)

### Connexion
- Email : `contact@association.local`
- Password : Mot de passe défini lors de la création

### Fonctionnalités
- Lecture/envoi d'emails
- Gestion des dossiers
- Carnet d'adresses
- Calendrier (si activé)
- Filtres anti-spam

## Configuration avancée

### Quotas de stockage
WebAdmin → Domains → Votre domaine → Accounts → Modifier le quota

### Filtres anti-spam
WebAdmin → Security → Anti-Spam → Configurer SpamAssassin/Bitdefender

### Aliases email
WebAdmin → Domains → Aliases
Exemples :
- `admin@association.local` → `contact@association.local`
- `support@association.local` → `contact@association.local`

### Listes de diffusion
WebAdmin → Domains → Mailing Lists
Créer des listes pour newsletters, annonces, etc.

## Sauvegarde

### Sauvegarder les données mail
```powershell
# Backup du volume mailserver
docker run --rm -v association_mailserver-data:/data -v J:\backups:/backup alpine tar czf /backup/mailserver-$(Get-Date -Format 'yyyyMMdd').tar.gz /data

# Ou copie des fichiers
docker compose exec mailserver tar czf /tmp/mail-backup.tar.gz /var/opt/axigen
docker compose cp mailserver:/tmp/mail-backup.tar.gz ./backups/
```

### Restaurer
```powershell
docker compose cp ./backups/mail-backup.tar.gz mailserver:/tmp/
docker compose exec mailserver tar xzf /tmp/mail-backup.tar.gz -C /
docker compose restart mailserver
```

## Troubleshooting

### Les emails ne partent pas
1. Vérifier la connexion SMTP : `telnet mailserver 587`
2. Vérifier les logs : `docker compose logs mailserver`
3. Tester avec un client email (Thunderbird, Outlook)
4. Vérifier que le compte a les permissions d'envoi

### Les emails sont marqués comme spam
1. Configurer SPF, DKIM, DMARC
2. Vérifier le reverse DNS
3. Tester sur https://www.mail-tester.com

### Webmail inaccessible
1. Vérifier que le port 8000 est exposé
2. Vérifier les logs : `docker compose logs mailserver | grep -i webmail`
3. Vérifier la configuration Traefik

### Erreur "Authentication failed"
1. Vérifier les identifiants
2. S'assurer que le compte existe dans Axigen
3. Vérifier que l'authentification SMTP est activée

## Commandes utiles

```powershell
# Logs du serveur mail
docker compose logs -f mailserver

# Redémarrer le serveur mail
docker compose restart mailserver

# Vérifier les ports ouverts
docker compose exec mailserver netstat -tlnp

# Accéder à la CLI Axigen
docker compose exec mailserver /axigen/bin/axigen-cli

# Tester SMTP manuellement
docker compose exec mailserver telnet localhost 25

# Lister les comptes email
docker compose exec mailserver cat /var/opt/axigen/domains/association.local/accounts.db
```

## Ressources

- Documentation Axigen : https://www.axigen.com/documentation/
- Guide SMTP : https://tools.ietf.org/html/rfc5321
- Configuration SPF : https://www.spfwizard.net/
- Test email : https://www.mail-tester.com/
- Test ports : https://mxtoolbox.com/
