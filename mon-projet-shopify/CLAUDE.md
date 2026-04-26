# Connexion Claude → Shopify

Ce dossier permet à Claude de se connecter à ta boutique Shopify pour lire/modifier les produits, commandes, clients, thème, etc.

---

## Étape 1 — Remplir tes credentials

Ouvre le fichier `.mcp.json` à côté de ce fichier et remplace les 3 valeurs :

```json
{
  "mcpServers": {
    "shopify": {
      "domain": "TON-STORE.myshopify.com",
      "clientId": "TON_CLIENT_ID",
      "clientSecret": "TON_CLIENT_SECRET"
    }
  }
}
```

**Où trouver ces valeurs ?**
1. Va sur ton admin Shopify → `Settings` → `Apps and sales channels` → `Develop apps`
2. Clique sur ton app custom (ou crée-en une)
3. Onglet `API credentials` :
   - `API key` → c'est ton **clientId**
   - `API secret key` → c'est ton **clientSecret**
4. Le domaine c'est `xxxxx.myshopify.com` (dans l'URL de ton admin)

**Scopes API requis** (onglet `Configuration` de ton app) :
`read_products`, `write_products`, `read_orders`, `write_orders`, `read_customers`, `write_customers`, `read_themes`, `write_themes`, `read_content`, `write_content`, `read_files`, `write_files`, `read_inventory`, `write_inventory`, `read_shipping`, `write_shipping`.

---

## Étape 2 — Comment Claude se connecte

Quand l'utilisateur demande quelque chose sur le store, Claude DOIT :

### 1. Lire les credentials
Lire `.mcp.json` à la racine de ce dossier et extraire `domain`, `clientId`, `clientSecret`.

### 2. Obtenir un token d'accès (OAuth)
```bash
curl -X POST "https://{domain}/admin/oauth/access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "{clientId}",
    "client_secret": "{clientSecret}",
    "grant_type": "client_credentials"
  }'
```

La réponse contient un `access_token` qui commence par `shpat_...`
→ Valide 24h, à réutiliser pour toutes les requêtes de la session.

### 3. Utiliser le token pour appeler l'API Shopify

**REST API** (thème, shipping, fichiers) :
```bash
curl "https://{domain}/admin/api/2024-01/products.json" \
  -H "X-Shopify-Access-Token: {access_token}"
```

**GraphQL API** (produits, commandes, clients) :
```bash
curl -X POST "https://{domain}/admin/api/2024-10/graphql.json" \
  -H "X-Shopify-Access-Token: {access_token}" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ shop { name } }"}'
```

---

## Ce que tu peux demander à Claude

Une fois connecté, tu peux lui dire des choses comme :

- "Liste mes 10 derniers produits"
- "Crée un nouveau produit : nom, prix, description, images"
- "Montre-moi les commandes non fulfilled"
- "Modifie le prix du produit X à 29,90 €"
- "Ajoute ce produit à la collection Y"
- "Exporte tous mes clients en CSV"
- "Change la couleur du bouton principal du thème"
- "Crée une nouvelle page Politique de confidentialité"

---

## Règles pour Claude

1. **Version API** : REST = `2024-01`, GraphQL = `2024-10`
2. **Upload d'images** : flow `stagedUploadsCreate` → HTTP PUT → `fileCreate` avec `originalSource` (pas `resourceUrl`)
3. **Fulfillment** : toujours `notify_customer: false` sauf demande explicite
4. **Avant toute modif destructive** (delete, reset) → demander confirmation à l'utilisateur
5. **Token expire** au bout de 24h → si erreur 401, relancer l'OAuth

---

## Problèmes fréquents

- **401 Unauthorized** → token expiré ou scopes manquants
- **403 Forbidden** → il manque un scope dans la config de l'app
- **429 Too Many Requests** → attendre quelques secondes puis réessayer
- **Domain invalide** → vérifier que c'est bien `xxxxx.myshopify.com` (pas le domaine custom)
